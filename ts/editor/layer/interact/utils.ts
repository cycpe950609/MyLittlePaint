/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  Utility     
 */

import type { Point } from "../../utils/misc";


export const distanceSquare = (a: Point, b: Point): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export const distance = (a: Point, b: Point): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}