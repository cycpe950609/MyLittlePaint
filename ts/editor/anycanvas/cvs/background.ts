/**
 * Created : 2026/03/19
 * Author  : Ting Fang, Tsai
 * About:
 *  Render background using canvas     
 */

import { max, min } from "lodash";
import type { Point, Size } from "./utils";
import { degreeToRadian, rotateAround } from "./coordinate";

export class BackgroundCanvas {
    private ctx: CanvasRenderingContext2D
    private chessboard_size: number
    private view_at_center: Point
    private view_at_rotDegree: number
    private view_at_scale: number

    constructor(chessboard_size: number) {
        const cvs = document.createElement("canvas");
        cvs.style.position = "fixed";
        cvs.style.left = "0";
        cvs.style.top = "0";

        let ctx = cvs.getContext("2d");
        if (ctx === null) throw new Error("INTERNAL_ERROR: Context not exist");
        this.ctx = ctx;

        this.chessboard_size = chessboard_size;
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

        const ranged_scale = (scale) / (Math.pow(2, (Math.floor(Math.log2(scale)))))

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const viewConfig: ViewportConfig = {
            center: center,
            size: {
                width: cvs_width,
                height: cvs_height,
            },
            scale: ranged_scale,
            rotDeg: rotDegree,
        }
        const renderView = this.calcRenderViewport(viewConfig, this.chessboard_size, this.chessboard_size)

        this.renderBackground(
            viewConfig,
            renderView,
            { width: this.chessboard_size, height: this.chessboard_size },  // unitSize
        )

    }
    private calcRenderViewport = (config: ViewportConfig, unitWidth: number, unitHeight: number): RenderViewConfig => {
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

        const blockLT: Point = { // Corner of the Left-Top unit
            x: (Math.floor(renderLT.x / unitWidth) + 0) * unitWidth,
            y: (Math.floor(renderLT.y / unitHeight) + 0) * unitHeight,
        }
        const blockRB: Point = { // Corner of the Right-Bottom unit
            x: (Math.floor(renderRB.x / unitWidth) + 1) * unitWidth,
            y: (Math.floor(renderRB.y / unitHeight) + 1) * unitHeight,
        }

        return {
            cornerLT: blockLT,
            cornerRB: blockRB,
        }
    }
    private renderBackground = (viewConfig: ViewportConfig, renderConfig: RenderViewConfig, unitSize: Size) => {

        const extendPointFromCenter = (point: Point, center: Point, scale: number): Point => {
            const vectorCenterToPoint: Point = {
                x: point.x - center.x,
                y: point.y - center.y,
            }
            const vectorScaled: Point = {
                x: vectorCenterToPoint.x * scale,
                y: vectorCenterToPoint.y * scale,
            }
            const extendedPoint: Point = {
                x: center.x + vectorScaled.x,
                y: center.y + vectorScaled.y,
            }
            return extendedPoint;
        }


        let startY = renderConfig.cornerLT.y;
        while (startY <= renderConfig.cornerRB.y) {
            let startX = renderConfig.cornerLT.x;
            while (startX <= renderConfig.cornerRB.x) {
                this.drawUnitBlockAt(
                    extendPointFromCenter(
                        { x: startX, y: startY }, // point
                        viewConfig.center,
                        viewConfig.scale,
                    ), // cornerLT
                    viewConfig, // config
                    { width: unitSize.width, height: unitSize.height },  // unitSize
                );
                startX += this.chessboard_size;
            }
            startY += this.chessboard_size;
        }
    }
    private drawUnitBlockAt = (cornerLT: Point, config: ViewportConfig, unitSize: Size) => {
        const hori_delta_x = (unitSize.width * config.scale / 2) * Math.cos(degreeToRadian(-config.rotDeg))
        const hori_delta_y = (unitSize.width * config.scale / 2) * Math.sin(degreeToRadian(-config.rotDeg))
        const vert_delta_x = (unitSize.height * config.scale / 2) * Math.cos(degreeToRadian(-config.rotDeg - 90))
        const vert_delta_y = (unitSize.height * config.scale / 2) * Math.sin(degreeToRadian(-config.rotDeg - 90))

        const drawBlock = (cornerLTX: number, cornerLTY: number, color: string) => {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(cornerLTX, cornerLTY);
            this.ctx.lineTo(cornerLTX + hori_delta_x, cornerLTY - hori_delta_y);
            this.ctx.lineTo(cornerLTX + hori_delta_x + vert_delta_x, cornerLTY - hori_delta_y - vert_delta_y);
            this.ctx.lineTo(cornerLTX + vert_delta_x, cornerLTY - vert_delta_y);
            this.ctx.closePath();
            this.ctx.fill();
        }

        let corner = rotateAround(cornerLT, config.center, -config.rotDeg);
        // Move `center` to `(viewSize.width/2, viewSize.height/2)`
        corner.x += -config.center.x + config.size.width / 2;
        corner.y += -config.center.y + config.size.height / 2;

        const BLACK_BLOCK_COLOR: string = 'grey'
        const WHITE_BLOCK_COLOR: string = 'lightgrey'

        drawBlock(corner.x, corner.y, BLACK_BLOCK_COLOR);
        drawBlock(corner.x + hori_delta_x, corner.y - hori_delta_y, WHITE_BLOCK_COLOR);
        drawBlock(corner.x + vert_delta_x, corner.y - vert_delta_y, WHITE_BLOCK_COLOR);
        drawBlock(corner.x + hori_delta_x + vert_delta_x, corner.y - hori_delta_y - vert_delta_y, BLACK_BLOCK_COLOR);
    }
}

type ViewportConfig = {
    center: Point,
    size: Size,
    scale: number;
    rotDeg: number;
}

type RenderViewConfig = {
    cornerLT: Point,
    cornerRB: Point,
}
