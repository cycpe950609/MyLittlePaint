/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass of Canvas  
 */

import type { Layer } from "./layer";
import type { Point } from "./utils";
import { ViewManager } from "./view";


export class CanvasBase {

    protected View: ViewManager;
    protected container: HTMLDivElement;

    constructor() {
        this.View = new ViewManager();
        this.container = document.createElement("div");
    }

    public get element(): HTMLDivElement {
        return this.container;
    }

    protected offsetToCanvas(_point: Point): Point {
        throw new Error("CanvasBase.offsetToCanvas")
    }

    public add(layer: Layer) { 
        
    }



};
