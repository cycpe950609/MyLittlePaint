/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Viewport   
 */

import { degreeToRadian, movePointFromCenter, radianToDegree, rotateAround } from "./coordinate";
import type { Point } from "./utils";


export type ViewChangedHandler = () => void;
export class ViewManager {
    private view_center: Point;
    private view_rot_deg: number; // a clockwise rotation is a negative magnitude, a counterclockwise is a positive magnitude
    private view_scale: number;
    private view_changed_handler: ViewChangedHandler;

    // private utility
    private normalizeDegree(degree: number): number {
        return (degree + 360) % 360;
    }

    constructor(center?: Point, rotDeg?: number, scale?: number, viewChangedCallback?: ViewChangedHandler) {
        this.view_center = center || { "x": 0, "y": 0 };
        this.view_rot_deg = rotDeg || 0.0;
        this.view_scale = scale || 1.0;
        this.view_changed_handler = viewChangedCallback || (() => { });
    }

    // Absolute value
    public viewAt(center: Point, rotDeg: number, scale: number) {
        this.view_center = center;
        this.view_rot_deg = rotDeg;
        this.view_scale = scale;
        this.view_changed_handler();
    }
    public viewCenterAt(center: Point) {
        this.view_center = center;
        this.view_changed_handler();
    }
    public viewRotDegAt(rotDeg: number) {
        this.view_rot_deg = this.normalizeDegree(rotDeg);
    }
    public viewScaleAt(scale: number) {
        this.view_scale = scale;
        this.view_changed_handler();
    }


    // Move the View along the axis of view
    public viewUp(deltaY: number) {
        // Move View Up, content move down
        const upDegree = this.normalizeDegree(this.RotationDegree + 90);
        const delta_x = deltaY * Math.cos(degreeToRadian(upDegree));
        const delta_y = deltaY * Math.sin(degreeToRadian(upDegree));
        this.view_center.x += delta_x;
        // NOTE: For `sin`, `cos`, etc, 90° is vector point upward
        // NOTE: But canvas Y-Coordinate is negative at up direction
        this.view_center.y -= delta_y;
        this.view_changed_handler();
    }
    public viewDown(deltaY: number) {
        // Move View Down, content move Up
        this.viewUp(-deltaY);
    }
    public viewRight(deltaX: number) {
        // Move View Right, content move left
        const rightDegree = this.normalizeDegree(this.RotationDegree);
        const delta_x = deltaX * Math.cos(degreeToRadian(rightDegree));
        const delta_y = deltaX * Math.sin(degreeToRadian(rightDegree));
        this.view_center.x += delta_x;
        this.view_center.y -= delta_y;
        this.view_changed_handler();
    }
    public viewLeft(deltaX: number) {
        // Move View Left, content move right
        this.viewRight(-deltaX);
    }
    // Scale
    public viewZoomIn(scale: number, maxScale?: number, scaleCenter?: Point) {
        const orig_scale = this.view_scale;
        this.view_scale += scale;
        if (maxScale) this.view_scale = (this.view_scale > maxScale) ? maxScale : this.view_scale;
        if (scaleCenter) {
            const new_scale = this.view_scale;
            this.view_center = movePointFromCenter(
                this.view_center, // point
                scaleCenter, // center
                orig_scale / new_scale, // scale
            )
        }
        this.view_changed_handler();
    }
    public viewZoomOut(scale: number, minScale?: number, scaleCenter?: Point) {
        const orig_scale = this.view_scale;
        this.view_scale -= scale;
        if (minScale) this.view_scale = (this.view_scale < minScale) ? minScale : this.view_scale;
        if (scaleCenter) {
            const new_scale = this.view_scale;
            this.view_center = movePointFromCenter(
                this.view_center, // point
                scaleCenter, // center
                orig_scale / new_scale, // scale
            )
        }
        this.view_changed_handler();
    }
    // Rotation
    public viewRotate(degree: number, rot_center?: Point) {
        this.cvsRotate(rot_center || this.view_center, -degree);
    }

    // Move Canvas
    private cvsRotate(center: Point, degree: number) {
        // Rotate `degree` degree clockwise around `center` (NOTE: `center` may not be viewport's center)
        const vecX = Math.cos(degreeToRadian(this.RotationDegree));
        const vecY = Math.sin(degreeToRadian(this.RotationDegree));
        const start: Point = this.view_center;
        const end: Point = { x: start.x + vecX, y: start.y + vecY };

        const rotStart = rotateAround(start, center, degree);
        const rotEnd = rotateAround(end, center, degree);
        const rad = Math.atan2(rotEnd.y - rotStart.y, rotEnd.x - rotStart.x);
        this.view_rot_deg = this.normalizeDegree(radianToDegree(rad));

        // New Center: canvas rotate counter-clockwise, viewCenter should move clockwise around rotation center
        this.view_center = rotateAround(this.view_center, center, -degree);
        this.view_changed_handler();
    }

    // Results
    public get Center(): Point {
        return this.view_center;
    }
    public get RotationDegree(): number {
        return this.view_rot_deg;
    }
    public get Scale(): number {
        return this.view_scale;
    }
};
