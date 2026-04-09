/**
 * Created : 2026/03/19
 * Author  : Ting Fang, Tsai
 * About:
 *  Render background using canvas     
 */

import { max, min } from "lodash";
import { rotateAround } from "./coordinate";
import type { Point, Size } from "./utils";

export class BackCVSBase {
    protected ctx: CanvasRenderingContext2D
    private view_at_center: Point
    private view_at_rotDegree: number
    private view_at_scale: number

    constructor() {
        const cvs = document.createElement("canvas");
        cvs.style.position = "fixed";
        cvs.style.left = "0";
        cvs.style.top = "0";

        let ctx = cvs.getContext("2d");
        if (ctx === null) throw new Error("INTERNAL_ERROR: Context not exist");
        this.ctx = ctx;

        this.view_at_center = { x: 0, y: 0 };
        this.view_at_rotDegree = 0;
        this.view_at_scale = 1.0;
    }

    get element() {
        return this.ctx.canvas;
    }

    public get viewSize(): Size {
        return {
            width: this.viewWidth,
            height: this.viewHeight,
        }
    }
    public set viewSize(size: Size) {
        this.ctx.canvas.width = size.width;
        this.ctx.canvas.height = size.height;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public get viewHeight(): number {
        return this.ctx.canvas.height
    }
    public set viewHeight(height: number) {
        this.ctx.canvas.height = height;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public get viewWidth(): number {
        return this.ctx.canvas.width;
    }
    public set viewWidth(width: number) {
        this.ctx.canvas.width = width;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public viewAt = (center: Point, rotDegree: number, scale: number) => {
        this.view_at_center = center;
        this.view_at_rotDegree = rotDegree;
        this.view_at_scale = scale;
        const cvs_width = this.ctx.canvas.width;
        const cvs_height = this.ctx.canvas.height;

        const viewConfig: ViewportConfig = {
            center: center,
            size: {
                width: cvs_width,
                height: cvs_height,
            },
            scale: scale,
            rotDeg: rotDegree,
        }
        const renderView = this.calcRenderViewport(viewConfig)

        this.renderBackground(
            viewConfig,
            renderView,
        )

    }

    protected calcRenderViewport(config: ViewportConfig): RenderViewConfig {

        // Calculate a rectangle that bound the visible part of background canvas
        // STEP 1: Rotate a viewport which center is origin (0,0)
        /// NOTE: Y-axis is positive upward 
        const vecLT = { x: -config.size.width / config.scale / 2, y: -config.size.height / config.scale / 2 };
        const vecRT = { x: +config.size.width / config.scale / 2, y: -config.size.height / config.scale / 2 };
        const vecLB = { x: -config.size.width / config.scale / 2, y: +config.size.height / config.scale / 2 };
        const vecRB = { x: +config.size.width / config.scale / 2, y: +config.size.height / config.scale / 2 };

        const vecRotatedLT = rotateAround(vecLT, { x: 0, y: 0 }, -config.rotDeg);
        const vecRotatedRT = rotateAround(vecRT, { x: 0, y: 0 }, -config.rotDeg);
        const vecRotatedLB = rotateAround(vecLB, { x: 0, y: 0 }, -config.rotDeg);
        const vecRotatedRB = rotateAround(vecRB, { x: 0, y: 0 }, -config.rotDeg);

        // STEP 2: Convert to canvas coordinate (Y-axis is negative upward)
        const renderLT: Point = {
            x: min([vecRotatedLT.x, vecRotatedRT.x, vecRotatedLB.x, vecRotatedRB.x]) + config.center.x,
            y: min([vecRotatedLT.y, vecRotatedRT.y, vecRotatedLB.y, vecRotatedRB.y]) + config.center.y,
        }
        const renderRB: Point = {
            x: max([vecRotatedLT.x, vecRotatedRT.x, vecRotatedLB.x, vecRotatedRB.x]) + config.center.x,
            y: max([vecRotatedLT.y, vecRotatedRT.y, vecRotatedLB.y, vecRotatedRB.y]) + config.center.y,
        }

        return {
            cornerLT: renderLT,
            cornerRB: renderRB,
        }
    }
    protected renderBackground(_viewConfig: ViewportConfig, _renderConfig: RenderViewConfig): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

}

export type ViewportConfig = {
    center: Point;
    size: Size;
    scale: number;
    rotDeg: number;
}

export type RenderViewConfig = {
    cornerLT: Point,
    cornerRB: Point,
}
