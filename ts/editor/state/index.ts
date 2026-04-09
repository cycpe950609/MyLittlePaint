/**
 * Created : 2026/04/01
 * Author  : Ting Fang, Tsai
 * About:
 *  Export State in namespace `State`      
 */

import { CanvasState } from "./canvas/canvas";


export const State = {
    Canvas: CanvasState,
}

export namespace State {
    export type Canvas = CanvasState;
}

export default State;