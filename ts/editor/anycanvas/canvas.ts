/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Canvas with size     
 */

import { CanvasBase } from "./cvs/canvas";
import { BackCVSBase, type RenderViewConfig, type ViewportConfig } from "./cvs/background";
import { degreeToRadian } from "./cvs/coordinate";
import type { Size } from "./cvs/utils";
import type Konva from "konva";
import type { ImageConfig } from "konva/lib/Node";

export class SizedBackground extends BackCVSBase {
    private cvs_size: Size;

    constructor(canvasSize: Size) {
        super()
        this.cvs_size = canvasSize;
    }

    protected renderBackground(viewConfig: ViewportConfig, _renderConfig: RenderViewConfig) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(viewConfig.size.width / 2, viewConfig.size.height / 2);
        ctx.rotate(degreeToRadian(viewConfig.rotDeg));
        ctx.scale(viewConfig.scale, viewConfig.scale);
        ctx.translate(-viewConfig.center.x, -viewConfig.center.y);
        ctx.fillStyle = "white";
        // TODO: Support very big background
        ctx.fillRect(
            -this.cvs_size.width / 2,
            -this.cvs_size.height / 2,
            this.cvs_size.width,
            this.cvs_size.height,
        );
        ctx.restore();
    }
}

export class WebCanvas extends CanvasBase {
    private cvs_size: Size;

    constructor(size: Size) {
        super(new SizedBackground(size));
        this.cvs_size = size;
    }

    public toDataURL(): string {
        const cvs = this.render.clone()
        cvs.getLayers().map((layer: Konva.Layer) => layer.rotation(0).position({ x: 0, y: 0 }))
        const cfg: ImageConfig = {
            x: -this.cvs_size.width / 2,
            y: -this.cvs_size.height / 2,
            width: this.cvs_size.width,
            height: this.cvs_size.height,
            imageSmoothingEnabled: true,
        };
        return cvs.toDataURL(cfg);
    }
};
