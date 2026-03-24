/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Line Canvas Function     
 */

import { PathBase } from "./base";


export class LineCVSFunc extends PathBase {
    Name = 'Line';
    HistoryName = 'line';
    ImgName = 'line';
    Tip = 'Line';
    Path = "M ${startX} ${startY} L ${endX} ${endY}";
}
;
