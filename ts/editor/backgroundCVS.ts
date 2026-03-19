/**
 * Created : 2026/03/19
 * Author  : Ting Fang, Tsai
 * About:
 *  Render background using canvas     
 */

import { max, min } from "lodash";


const toRadian = (degrees: number) => degrees * (Math.PI / 180)

export class BackgroundCanvas {
    private ctx: CanvasRenderingContext2D
    private chessboard_size: number
    constructor(chessboard_size: number) {
        const cvs = document.createElement("canvas");
        cvs.style.position = "fixed";
        cvs.style.left = "0";
        cvs.style.top = "0";

        let ctx = cvs.getContext("2d");
        if (ctx === null) throw new Error("INTERNAL_ERROR: Context not exist");
        this.ctx = ctx;

        this.chessboard_size = chessboard_size;
    }

    get element() {
        return this.ctx.canvas;
    }

    public resize = (width: number, height: number) => {
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        // TODO: Re-render after resize
    }

    public viewAt = (cornerLTX: number, cornerLTY: number, rotDegree: number, scale: number) => {
        const cvs_width = this.ctx.canvas.width;
        const cvs_height = this.ctx.canvas.height;

        console.log("viewAt", cornerLTX, cornerLTY, cvs_width, cvs_height)

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const renderBlockSz = this.chessboard_size * scale

        const viewConfig: ViewportConfig = {
            cornerLTX: cornerLTX,
            cornerLTY: cornerLTY,
            width: cvs_width,
            height: cvs_height,
            scale: scale,
            rotDeg: rotDegree,
        }
        const renderView = this.calcRenderViewport(viewConfig, renderBlockSz, renderBlockSz)
        console.log("view", viewConfig);

        // view LT <-> render LT
        const deltaX = viewConfig.cornerLTX - renderView.cornerLTX;
        const deltaY = viewConfig.cornerLTY - renderView.cornerLTY;
        let startY = 0;
        this.ctx.fillStyle = 'gray';
        while (startY < renderView.height) {
            let startX = 0;
            while (startX < renderView.width) {
                // if (this.isUnitVisible(startX - deltaX, startY - deltaY, renderBlockSz, renderBlockSz, renderView, viewConfig)) {
                //     this.drawUnitBlockAt(startX, startY, renderBlockSz, renderBlockSz, rotDegree);

                // }
                // console.log(startX, startY);
                this.drawUnitBlockAt(startX - deltaX, startY - deltaY, renderBlockSz, renderBlockSz, rotDegree);
                startX += renderBlockSz;
            }
            startY += renderBlockSz;
        }

        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`(${cornerLTX}, ${cornerLTY}) ${rotDegree}° x${scale}`, cvs_width / 2, cvs_height / 2);
        this.ctx.stroke();

    }
    private calcRenderViewport = (config: ViewportConfig, unitWidth: number, unitHeight: number): RenderViewConfig => {
        // Calculate a rectangle that bound the visible part of background canvas
        // TODO: support rotation
        type Point = { x: number, y: number };
        const hori_delta_x = (config.width) * Math.cos(toRadian(config.rotDeg))
        const hori_delta_y = (config.width) * Math.sin(toRadian(config.rotDeg))
        const vert_delta_x = (config.height) * Math.cos(toRadian(config.rotDeg + 90))
        const vert_delta_y = (config.height) * Math.sin(toRadian(config.rotDeg + 90))
        const cornerViewLT: Point = {
            x: config.cornerLTX,
            y: config.cornerLTY,
        }
        const cornerViewRT: Point = {
            x: config.cornerLTX + hori_delta_x,
            y: config.cornerLTY + hori_delta_y,
        }
        const cornerViewRB: Point = {
            x: config.cornerLTX + hori_delta_x + vert_delta_x,
            y: config.cornerLTY + hori_delta_y + vert_delta_y,
        }
        const cornerViewLB: Point = {
            x: config.cornerLTX + vert_delta_x,
            y: config.cornerLTY + vert_delta_y,
        }

        const renderLT: Point = {
            x: min([cornerViewLT.x, cornerViewRT.x, cornerViewRB.x, cornerViewLB.x]),
            y: min([cornerViewLT.y, cornerViewRT.y, cornerViewRB.y, cornerViewLB.y]),
        }
        const renderRB: Point = {
            x: max([cornerViewLT.x, cornerViewRT.x, cornerViewRB.x, cornerViewLB.x]),
            y: max([cornerViewLT.y, cornerViewRT.y, cornerViewRB.y, cornerViewLB.y]),
        }
        const blockLT: Point = { // Corner of the Left-Top unit
            x: Math.floor(renderLT.x / unitWidth) * unitWidth,
            y: Math.floor(renderLT.y / unitHeight) * unitHeight,
        }
        const blockRB: Point = { // Corner of the Right-Bottom unit
            x: (Math.floor(renderRB.x / unitWidth) + 1) * unitWidth,
            y: (Math.floor(renderRB.y / unitHeight) + 1) * unitHeight,
        }
        console.log(blockLT, blockRB);

        return {
            cornerLTX: blockLT.x,
            cornerLTY: blockLT.y,
            width: blockRB.x - blockLT.x,
            height: blockRB.y - blockLT.y,
        }
    }
    private isUnitVisible = (cornerLTX: number, cornerLTY: number, width: number, height: number, renderCfg: RenderViewConfig, viewCfg: ViewportConfig): boolean => {
        // Is the unit visible, the bounding rect may contain unit of of viewport, skip it
        // TODO:
        return true;
    }
    private drawUnitBlockAt = (cornerLTX: number, cornerLTY: number, width: number, height: number, rotDeg: number) => {
        const hori_delta_x = (width / 2) * Math.cos(toRadian(rotDeg))
        const hori_delta_y = (width / 2) * Math.sin(toRadian(rotDeg))
        const vert_delta_x = (height / 2) * Math.cos(toRadian(rotDeg + 90))
        const vert_delta_y = (height / 2) * Math.sin(toRadian(rotDeg + 90))

        const drawBlock = (cornerLTX: number, cornerLTY: number) => {
            this.ctx.fillStyle = 'gray';
            this.ctx.beginPath();
            this.ctx.moveTo(cornerLTX, cornerLTY);
            this.ctx.lineTo(cornerLTX + hori_delta_x, cornerLTY + hori_delta_y);
            this.ctx.lineTo(cornerLTX + hori_delta_x + vert_delta_x, cornerLTY + hori_delta_y + vert_delta_y);
            this.ctx.lineTo(cornerLTX + vert_delta_x, cornerLTY + vert_delta_y);
            this.ctx.closePath();
            this.ctx.fill();
        }

        drawBlock(cornerLTX, cornerLTY);
        drawBlock(cornerLTX + hori_delta_x + vert_delta_x, cornerLTY + hori_delta_y + vert_delta_y);
    }
}

type ViewportConfig = {
    cornerLTX: number,
    cornerLTY: number
    width: number;
    height: number;
    scale: number;
    rotDeg: number;
}

type RenderViewConfig = Omit<ViewportConfig, "rotDeg" | "scale"> 