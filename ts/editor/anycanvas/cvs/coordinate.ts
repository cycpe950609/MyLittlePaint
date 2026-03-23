/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Coordinate conversion     
 */

import { type Point, type Size } from "./utils";

export type ViewportConfig = {
    center: Point;
    size: Size;
    scale: number;
    rotDeg: number;
}

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
