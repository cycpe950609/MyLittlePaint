
/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Infinite Canvas     
*/

import { BackgroundCanvas } from "./cvs/background";
import { CanvasBase } from "./cvs/canvas";
import type Konva from "konva";
import type { ImageConfig } from "konva/lib/Node";

export class InfiniteCanvas extends CanvasBase {
    constructor() {
        super(new BackgroundCanvas())
    }

    public toDataURL(): string {
        const cvs = this.render.clone().offset({ x: 0, y: 0 }).position({ x: 0, y: 0 }).scale({ x: 1, y: 1 }).rotation(0);
        cvs.getLayers().forEach((layer: Konva.Layer) => {
            layer.offset({ x: 0, y: 0 }).position({ x: 0, y: 0 }).scale({ x: 1.0, y: 1.0 }).rotation(0)
        })
        const rect = cvs.getClientRect({ skipTransform: false });
        const cfg: ImageConfig = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            imageSmoothingEnabled: true,
        };
        return cvs.toDataURL(cfg);
    }
};
