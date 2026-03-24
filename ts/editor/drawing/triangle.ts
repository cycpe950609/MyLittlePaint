/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Triangle Canvas Function     
 */

import { PathBase } from "./base";


export class TriangleCVSFunc extends PathBase {
    Name = 'Triangle';
    HistoryName = 'polygon-triangle';
    ImgName = 'triangle';
    Tip = 'Triangle';
    Path = "M ${endX} ${endY} L ${startX} ${endY} L ${endX/2} ${startY} Z";
}
