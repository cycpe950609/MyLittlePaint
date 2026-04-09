/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Coordinate conversion     
 */

import { type Point } from "./misc";

export const degreeToRadian = (degree: number): number => {
    return degree / 180 * Math.PI;
}
export const radianToDegree = (radian: number): number => {
    return radian * 180 / Math.PI;
}

export const rotateAround = (point: Point, center: Point, degree: number): Point => {
    if(degree === 0) return point;
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