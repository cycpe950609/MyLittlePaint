/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Rectangle Canvas Function     
 */

import { PathBase } from "./base";


export class RectangleCVSFunc extends PathBase {
    Name = 'Rectangle';
    HistoryName = 'polygon-rectangle';
    ImgName = 'rectangle';
    Tip = 'Rectangle';
    Path = "M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY} L ${startX} ${endY} Z";
}
