/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Viewport   
 */

import { degreeToRadian, radianToDegree, rotateAround } from "./coordinate";
import type { Point } from "./utils";



export class ViewManager {
    private view_center: Point;
    private view_rot_deg: number; // a clockwise rotation is a negative magnitude, a counterclockwise is a positive magnitude

    // private utility
    private normalizeDegree(degree: number): number {
        return (degree + 360) % 360;
        // let angle = degree % 360;
        // if (angle > 0)
        //     return angle > 180 ? -360 + angle : angle;
        // return angle < -180 ? 360 + angle : angle;
    }

    constructor(center?: Point, rotDeg?: number) {
        this.view_center = center || { "x": 0, "y": 0 };
        this.view_rot_deg = rotDeg || 0.0;
    }

    // Move the View along the axis of view
    public viewUp(deltaY: number) {
        // Move View Up, content move down
        // Coordinate is negative at up direction
        const upDegree = this.normalizeDegree(this.RotationDegree + 90);
        const delta_x = deltaY * Math.cos(degreeToRadian(upDegree));
        const delta_y = deltaY * Math.sin(degreeToRadian(upDegree));
        this.view_center.x -= delta_x;
        this.view_center.y -= delta_y;
    }
    public viewDown(deltaY: number) {
        // Move View Down, content move Up
        this.viewUp(-deltaY);
    }
    public viewRight(deltaX: number) {
        // Move View Right, content move left
        const upDegree = this.normalizeDegree(this.RotationDegree);
        const delta_x = deltaX * Math.cos(degreeToRadian(upDegree));
        const delta_y = deltaX * Math.sin(degreeToRadian(upDegree));
        this.view_center.x -= delta_x;
        this.view_center.y -= delta_y;
    }
    public viewLeft(deltaX: number) {
        // Move View Left, content move right
        this.viewRight(-deltaX);
    }
    // Rotation
    public viewRotate(degree: number) {
        this.cvsRotate(this.view_center, degree);
    }

    // Move Canvas
    public cvsUp(deltaY: number) {
        this.view_center.y -= deltaY;
    }
    public cvsDown(deltaY: number) {
        this.view_center.y += deltaY;
    }
    public cvsLeft(deltaX: number) {
        this.view_center.x += deltaX;
    }
    public cvsRight(deltaX: number) {
        this.view_center.x -= deltaX;
    }
    public cvsRotate(center: Point, degree: number) {
        // Rotate `degree` degree clockwise at `center`
        const vecX = Math.cos(degreeToRadian(this.RotationDegree));
        const vecY = Math.sin(degreeToRadian(this.RotationDegree));
        const start: Point = this.view_center;
        const end: Point = { x: start.x + vecX, y: start.y + vecY };

        const rotStart = rotateAround(start, center, degree);
        const rotEnd = rotateAround(end, center, degree);
        this.view_center = rotStart;
        const rad = Math.atan2(rotEnd.y - rotStart.y, rotEnd.x - rotStart.x);
        this.view_rot_deg = this.normalizeDegree(radianToDegree(rad));
    }

    // Results
    public get Center(): Point {
        return this.view_center;
    }
    public get RotationDegree(): number {
        return this.view_rot_deg;
    }
};

