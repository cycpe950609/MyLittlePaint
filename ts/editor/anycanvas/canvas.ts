/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Canvas with size     
 */

import { CanvasBase } from "./cvs/canvas";
import { BackgroundCanvas } from "./cvs/background";
import type { Size } from "./cvs/utils";
import Konva from "konva";
import type { ImageConfig } from "konva/lib/Node";

export class WebCanvas extends CanvasBase {
    private cvs_size: Size;

    constructor(size: Size) {
        super(new BackgroundCanvas({
            width: size.width,
            height: size.height,
        }));
        this.cvs_size = size;
    }

    public toDataURL(): string {
        const cvs = this.render.clone().offset({ x: 0, y: 0 }).position({ x: 0, y: 0 }).scale({ x: 1, y: 1 }).rotation(0);
        cvs.getLayers().forEach((layer: Konva.Layer) => {
            layer.offset({ x: 0, y: 0 }).position({ x: 0, y: 0 }).scale({ x: 1.0, y: 1.0 }).rotation(0)
        })
        const cfg: ImageConfig = {
            x: - this.cvs_size.width / 2,
            y: -this.cvs_size.height / 2,
            width: this.cvs_size.width,
            height: this.cvs_size.height,
            imageSmoothingEnabled: true,
        };
        return cvs.toDataURL(cfg);
    }
};
