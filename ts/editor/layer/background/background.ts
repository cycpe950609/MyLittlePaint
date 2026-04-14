/**
 * Created : 2026/03/19
 * Author  : Ting Fang, Tsai
 * About:
 *  Render background using canvas     
 */

import Color, { type ColorInstance } from 'color';
import { max, min } from "lodash";
import { degreeToRadian, movePointFromCenter, rotateAround } from "../../utils/coordinate";
import type { Point, Size } from "../../utils/misc";
import type { ViewportConfig } from "../interact/state/utils";

export type CanvasConfig = {
    color?: ColorInstance;
    width?: number;
    height?: number;
    chessboardSize?: number
}

export class BackgroundLayer {
    private ctx: CanvasRenderingContext2D
    private view_at_center: Point
    private view_at_rotDegree: number
    private view_at_scale: number
    private cvs_color: ColorInstance;
    private cvs_width: number;
    private cvs_height: number;
    private chessboard_size: number;
    private size_changed: boolean = true;

    constructor(config?: CanvasConfig) {
        const cvs = document.createElement("canvas");
        cvs.id = "background_layer_canvas";
        cvs.style.position = "fixed";
        cvs.style.left = "0";
        cvs.style.top = "0";
        cvs.style.width = "100%";
        cvs.style.height = "100%";
        cvs.style.pointerEvents = "none";
        this.cvs_color = config?.color || Color.rgb("white").alpha(0.5);
        this.cvs_height = config?.height || Infinity;
        this.cvs_width = config?.width || Infinity;
        this.chessboard_size = config?.chessboardSize || 96;

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
        const dpr = window.devicePixelRatio || 1;
        this.ctx.canvas.style.width = `${size.width}px`;
        this.ctx.canvas.style.height = `${size.height}px`;
        this.ctx.canvas.width = Math.max(1, Math.round(size.width * dpr));
        this.ctx.canvas.height = Math.max(1, Math.round(size.height * dpr));
        this.size_changed = true;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public set cvsSize(size: Size) {
        this.cvs_height = size.height;
        this.cvs_width = size.width;
    }

    public get viewHeight(): number {
        const dpr = window.devicePixelRatio || 1;
        return this.ctx.canvas.height / dpr;
    }
    public set viewHeight(height: number) {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.canvas.style.height = `${height}px`;
        this.ctx.canvas.height = Math.max(1, Math.round(height * dpr));
        this.size_changed = true;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public get viewWidth(): number {
        const dpr = window.devicePixelRatio || 1;
        return this.ctx.canvas.width / dpr;
    }
    public set viewWidth(width: number) {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.canvas.style.width = `${width}px`;
        this.ctx.canvas.width = Math.max(1, Math.round(width * dpr));
        this.size_changed = true;
        this.viewAt(this.view_at_center, this.view_at_rotDegree, this.view_at_scale);
    }

    public viewAt(center: Point, rotDegree: number, scale: number) {
        if (
            this.view_at_center.x === center.x &&
            this.view_at_center.y === center.y &&
            this.view_at_rotDegree === rotDegree &&
            this.view_at_scale === scale &&
            !this.size_changed
        ) return;
        this.size_changed = false;

        this.view_at_center = structuredClone(center);
        this.view_at_rotDegree = rotDegree;
        this.view_at_scale = scale;
        const cvs_width = this.viewWidth;
        const cvs_height = this.viewHeight;

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

        // Calculate start/end point of chessboard
        const unitSize: Size = {
            width: this.chessboard_size,
            height: this.chessboard_size,
        }
        const blockLT: Point = { // Corner of the Left-Top unit
            x: (Math.floor(renderLT.x / unitSize.width) + 0) * unitSize.width,
            y: (Math.floor(renderLT.y / unitSize.height) + 0) * unitSize.height,
        }
        const blockRB: Point = { // Corner of the Right-Bottom unit
            x: (Math.ceil(renderRB.x / unitSize.width) + 0) * unitSize.width,
            y: (Math.ceil(renderRB.y / unitSize.height) + 0) * unitSize.height,
        }

        return {
            cornerLT: blockLT,
            cornerRB: blockRB,
        }
    }
    private renderBackground(viewConfig: ViewportConfig, renderConfig: RenderViewConfig): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if (this.cvs_color.alpha() !== 1)
            this.renderBackChessboard(viewConfig, renderConfig);
        this.renderBackColor(viewConfig, renderConfig, this.cvs_color);
        this.clipCanvasMargin(viewConfig, renderConfig);
    }


    /** Render transparent background (chessboard) */
    private renderBackChessboard(viewConfig: ViewportConfig, renderConfig: RenderViewConfig) {
        this.ctx.save();
        const dpr = window.devicePixelRatio || 1;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.translate(viewConfig.size.width / 2, viewConfig.size.height / 2);
        this.ctx.rotate(degreeToRadian(viewConfig.rotDeg));
        this.ctx.translate(-viewConfig.center.x, -viewConfig.center.y);

        const unitSize: Size = {
            width: this.chessboard_size,
            height: this.chessboard_size,
        }

        const scale = viewConfig.scale;
        // scale = render_scale x ranged_scale
        const ranged_scale = (Math.pow(2, (Math.floor(Math.log2(scale)))))
        const unit_world = this.chessboard_size / ranged_scale;

        const endX = Math.ceil(renderConfig.cornerRB.x / unit_world) * unit_world;
        let startY = Math.floor(renderConfig.cornerLT.y / unit_world) * unit_world;
        const endY = Math.ceil(renderConfig.cornerRB.y / unit_world) * unit_world;
        while (startY <= endY) {
            let startX = Math.floor(renderConfig.cornerLT.x / unit_world) * unit_world;
            while (startX <= endX) {
                this.drawUnitBlockAt(
                    movePointFromCenter(
                        { x: startX, y: startY }, // point
                        viewConfig.center,
                        viewConfig.scale,
                    ), // cornerLT
                    { width: unitSize.width * scale / ranged_scale, height: unitSize.height * scale / ranged_scale },  // unitSize
                );
                startX += unit_world;
            }
            startY += unit_world;
        }

        this.ctx.restore();
    }
    private drawUnitBlockAt(cornerLT: Point, unitSize: Size) {
        const hori_delta_x = (unitSize.width / 2)
        const vert_delta_y = (unitSize.height / 2)

        const drawBlock = (cornerLTX: number, cornerLTY: number, color: string) => {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(cornerLTX, cornerLTY);
            this.ctx.lineTo(cornerLTX + hori_delta_x, cornerLTY);
            this.ctx.lineTo(cornerLTX + hori_delta_x, cornerLTY - vert_delta_y);
            this.ctx.lineTo(cornerLTX, cornerLTY - vert_delta_y);
            this.ctx.closePath();
            this.ctx.fill();
        }

        const BLACK_BLOCK_COLOR: string = 'grey'
        const WHITE_BLOCK_COLOR: string = 'lightgrey'

        drawBlock(cornerLT.x, cornerLT.y, BLACK_BLOCK_COLOR);
        drawBlock(cornerLT.x + hori_delta_x, cornerLT.y, WHITE_BLOCK_COLOR);
        drawBlock(cornerLT.x, cornerLT.y - vert_delta_y, WHITE_BLOCK_COLOR);
        drawBlock(cornerLT.x + hori_delta_x, cornerLT.y - vert_delta_y, BLACK_BLOCK_COLOR);
    }

    /** Render color background */
    private renderBackColor(viewConfig: ViewportConfig, renderConfig: RenderViewConfig, color: ColorInstance) {
        this.ctx.save();
        const dpr = window.devicePixelRatio || 1;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.translate(viewConfig.size.width / 2, viewConfig.size.height / 2);
        this.ctx.rotate(degreeToRadian(viewConfig.rotDeg));
        this.ctx.translate(-viewConfig.center.x, -viewConfig.center.y);

        const lt = movePointFromCenter(renderConfig.cornerLT, viewConfig.center, viewConfig.scale);
        const rb = movePointFromCenter(renderConfig.cornerRB, viewConfig.center, viewConfig.scale);
        this.ctx.fillStyle = color.string();
        this.ctx.fillRect(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);

        this.ctx.restore();
    }
    /** Clip the range that not in the canvas but in renderView */
    private clipCanvasMargin(viewConfig: ViewportConfig, renderConfig: RenderViewConfig) {
        if (this.cvs_width === Infinity || this.cvs_height === Infinity) return;

        const halfW = this.cvs_width / 2;
        const halfH = this.cvs_height / 2;
        const canvasLT: Point = { x: -halfW, y: -halfH };
        const canvasRB: Point = { x: halfW, y: halfH };

        if (
            renderConfig.cornerLT.x >= canvasLT.x &&
            renderConfig.cornerLT.y >= canvasLT.y &&
            renderConfig.cornerRB.x <= canvasRB.x &&
            renderConfig.cornerRB.y <= canvasRB.y
        ) return;

        this.ctx.save();
        const dpr = window.devicePixelRatio || 1;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.translate(viewConfig.size.width / 2, viewConfig.size.height / 2);
        this.ctx.rotate(degreeToRadian(viewConfig.rotDeg));
        this.ctx.translate(-viewConfig.center.x, -viewConfig.center.y);

        const lt = movePointFromCenter(canvasLT, viewConfig.center, viewConfig.scale);
        const rb = movePointFromCenter(canvasRB, viewConfig.center, viewConfig.scale);

        this.ctx.globalCompositeOperation = "destination-in";
        this.ctx.beginPath();
        this.ctx.rect(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
        this.ctx.fill();
        this.ctx.restore();
    }
}

export type RenderViewConfig = {
    cornerLT: Point,
    cornerRB: Point,
}
