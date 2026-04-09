/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Viewport   
 */

import { degreeToRadian, movePointFromCenter, radianToDegree, rotateAround } from "../../../utils/coordinate";
import { type Point, type Size } from "../../../utils/misc";
import { ViewPoint, type ViewportConfig } from "./utils";

export type ViewChangedHandler = (viewport: ViewportConfig) => void;
export type ViewStateConfig = {
    center?: Point;
    rotDeg?: number;
    scale?: number;
    size?: Size;
    viewChangedCallback?: ViewChangedHandler;
}
export class ViewState {
    private view_center: Point;
    private view_rot_deg: number; // a clockwise rotation is a negative magnitude, a counterclockwise is a positive magnitude
    private view_scale: number;
    private view_size: Size;
    private view_changed_handler: ViewChangedHandler = () => { };

    // private utility
    private normalizeDegree(degree: number): number {
        return (degree + 360) % 360;
    }

    private createConfig(): ViewportConfig {
        return {
            center: structuredClone(this.view_center),
            size: structuredClone(this.view_size),
            scale: this.view_scale,
            rotDeg: this.view_rot_deg,
        };
    }

    constructor(config?: ViewStateConfig) {
        this.view_center = structuredClone(config?.center) || { "x": 0, "y": 0 };
        this.view_rot_deg = config?.rotDeg || 0.0;
        this.view_scale = config?.scale || 1.0;
        this.view_size = structuredClone(config?.size) || { width: 0, height: 0 };
        this.view_changed_handler = config?.viewChangedCallback || (() => { });
    }

    public on(eventType: "viewChanged", handler: ViewChangedHandler) {
        if (eventType === "viewChanged") {
            this.view_changed_handler = handler;
        }
    }

    // helper
    public createPoint(point: Point): ViewPoint {
        return new ViewPoint(point, {
            center: this.Center,
            size: structuredClone(this.view_size),
            scale: this.Scale,
            rotDeg: this.RotationDegree,
        })
    }

    // Absolute value
    public viewAt(center: Point, rotDeg: number, scale: number) {
        this.view_center = structuredClone(center);
        this.view_rot_deg = rotDeg;
        this.view_scale = scale;
        this.view_changed_handler(this.createConfig());
    }
    public viewCenterAt(center: Point) {
        this.view_center = structuredClone(center);
        this.view_changed_handler(this.createConfig());
    }
    public viewRotDegAt(rotDeg: number) {
        this.view_rot_deg = this.normalizeDegree(rotDeg);
        this.view_changed_handler(this.createConfig());
    }
    public viewScaleAt(scale: number) {
        this.view_scale = scale;
        this.view_changed_handler(this.createConfig());
    }
    public set viewWidth(width: number) {
        this.view_size.width = width;
        this.view_changed_handler(this.createConfig());
    }
    public set viewHeight(height: number) {
        this.view_size.height = height;
        this.view_changed_handler(this.createConfig());
    }
    public set viewSize(size: Size) {
        this.view_size = structuredClone(size);
        this.view_changed_handler(this.createConfig());
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
        this.view_changed_handler(this.createConfig());
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
        this.view_changed_handler(this.createConfig());
    }
    public viewLeft(deltaX: number) {
        // Move View Left, content move right
        this.viewRight(-deltaX);
    }
    // Scale
    public viewZoomIn(scale: number, maxScale?: number, scaleCenter?: ViewPoint | Point) {
        const orig_scale = this.view_scale;
        this.view_scale += scale;
        if (maxScale) this.view_scale = (this.view_scale > maxScale) ? maxScale : this.view_scale;
        if (scaleCenter) {
            const centerPoint = scaleCenter instanceof ViewPoint ? scaleCenter.cvsPoint : scaleCenter;
            const new_scale = this.view_scale;
            this.view_center = movePointFromCenter(
                this.view_center, // point
                centerPoint, // center
                orig_scale / new_scale, // scale
            )
        }
        this.view_changed_handler(this.createConfig());
    }
    public viewZoomOut(scale: number, minScale?: number, scaleCenter?: ViewPoint | Point) {
        const orig_scale = this.view_scale;
        this.view_scale -= scale;
        if (minScale) this.view_scale = (this.view_scale < minScale) ? minScale : this.view_scale;
        if (scaleCenter) {
            const centerPoint = scaleCenter instanceof ViewPoint ? scaleCenter.cvsPoint : scaleCenter;
            const new_scale = this.view_scale;
            this.view_center = movePointFromCenter(
                this.view_center, // point
                centerPoint, // center
                orig_scale / new_scale, // scale
            )
        }
        this.view_changed_handler(this.createConfig());
    }
    // Rotation
    public viewRotate(degree: number, rotCenter?: ViewPoint | Point) {
        const centerPoint = rotCenter === undefined
            ? this.view_center
            : (rotCenter instanceof ViewPoint ? rotCenter.cvsPoint : rotCenter);
        this.cvsRotate(centerPoint, -degree);
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
        this.view_changed_handler(this.createConfig());
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

    public get ViewportConfig(): ViewportConfig {
        return this.createConfig();
    }
};
