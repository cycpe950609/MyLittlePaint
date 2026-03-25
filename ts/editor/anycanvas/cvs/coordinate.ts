/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Coordinate conversion     
 */

import type { ViewportConfig } from "./background";
import { type Point } from "./utils";

export const degreeToRadian = (degree: number): number => {
    return degree / 180 * Math.PI;
}
export const radianToDegree = (radian: number): number => {
    return radian * 180 / Math.PI;
}

export const rotateAround = (point: Point, center: Point, degree: number): Point => {
    // Rotate `point` around `center` with `degree` clockwise
    const rad = degreeToRadian(degree);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
        x: dx * (cos) + dy * (sin) + center.x,
        y: dx * (-sin) + dy * (cos) + center.y,
    };
}

export const convertViewToCanvas = (viewCfg: ViewportConfig, viewPoint: Point): Point => {
    let center_x = viewCfg.size.width / 2
    let center_y = viewCfg.size.height / 2
    let new_x_wo_rot = (viewPoint.x - center_x) / viewCfg.scale;
    let new_y_wo_rot = (viewPoint.y - center_y) / viewCfg.scale;
    let rot_deg = degreeToRadian(viewCfg.rotDeg);
    let new_delta_x = new_x_wo_rot * Math.cos(rot_deg) + new_y_wo_rot * Math.sin(rot_deg);
    let new_delta_y = new_x_wo_rot * (-Math.sin(rot_deg)) + new_y_wo_rot * Math.cos(rot_deg);
    let new_x = new_delta_x + viewCfg.center.x;
    let new_y = new_delta_y + viewCfg.center.y;
    return { "x": new_x, "y": new_y }
}

export const movePointFromCenter = (point: Point, center: Point, scale: number): Point => {
    const vectorCenterToPoint: Point = {
        x: point.x - center.x,
        y: point.y - center.y,
    }
    const vectorScaled: Point = {
        x: vectorCenterToPoint.x * scale,
        y: vectorCenterToPoint.y * scale,
    }
    const movedPoint: Point = {
        x: center.x + vectorScaled.x,
        y: center.y + vectorScaled.y,
    }
    return movedPoint;
}