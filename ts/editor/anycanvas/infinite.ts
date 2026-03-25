
/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Infinite Canvas     
*/

import { BackCVSBase, type RenderViewConfig, type ViewportConfig } from "./cvs/background";
import { CanvasBase } from "./cvs/canvas";
import { degreeToRadian, movePointFromCenter, rotateAround } from "./cvs/coordinate";
import type { Point, Size } from "./cvs/utils";
import type Konva from "konva";
import type { ImageConfig } from "konva/lib/Node";

export class InfiniteBackground extends BackCVSBase {
    private chessboard_size: number

    constructor(chessboard_size: number) {
        super()
        this.chessboard_size = chessboard_size;
    }

    protected override calcRenderViewport(config: ViewportConfig): RenderViewConfig {
        const minimal_render_view = super.calcRenderViewport(config)
        const renderLT = minimal_render_view.cornerLT;
        const renderRB = minimal_render_view.cornerRB;

        const unitSize: Size = {
            width: this.chessboard_size,
            height: this.chessboard_size,
        }

        const blockLT: Point = { // Corner of the Left-Top unit
            x: (Math.floor(renderLT.x / unitSize.width) + 0) * unitSize.width,
            y: (Math.floor(renderLT.y / unitSize.height) + 0) * unitSize.height,
        }
        const blockRB: Point = { // Corner of the Right-Bottom unit
            x: (Math.floor(renderRB.x / unitSize.width) + 1) * unitSize.width,
            y: (Math.floor(renderRB.y / unitSize.height) + 1) * unitSize.height,
        }

        return {
            cornerLT: blockLT,
            cornerRB: blockRB,
        }
    }
    protected renderBackground(viewConfig: ViewportConfig, renderConfig: RenderViewConfig) {
        const unitSize: Size = {
            width: this.chessboard_size,
            height: this.chessboard_size,
        }

        const scale = viewConfig.scale;
        // scale = render_scale x ranged_scale
        const ranged_scale = (Math.pow(2, (Math.floor(Math.log2(scale)))))

        let startY = renderConfig.cornerLT.y;
        while (startY <= renderConfig.cornerRB.y) {
            let startX = renderConfig.cornerLT.x;
            while (startX <= renderConfig.cornerRB.x) {
                this.drawUnitBlockAt(
                    movePointFromCenter(
                        { x: startX, y: startY }, // point
                        viewConfig.center,
                        viewConfig.scale,
                    ), // cornerLT
                    viewConfig.center,
                    viewConfig.size, // viewSize
                    viewConfig.rotDeg,
                    { width: unitSize.width * scale / ranged_scale, height: unitSize.height * scale / ranged_scale },  // unitSize
                );
                startX += this.chessboard_size / ranged_scale;
            }
            startY += this.chessboard_size / ranged_scale;
        }
    }
    private drawUnitBlockAt(cornerLT: Point, center: Point, viewSize: Size, rotDeg: number, unitSize: Size) {
        const hori_delta_x = (unitSize.width / 2) * Math.cos(degreeToRadian(-rotDeg))
        const hori_delta_y = (unitSize.width / 2) * Math.sin(degreeToRadian(-rotDeg))
        const vert_delta_x = (unitSize.height / 2) * Math.cos(degreeToRadian(-rotDeg - 90))
        const vert_delta_y = (unitSize.height / 2) * Math.sin(degreeToRadian(-rotDeg - 90))

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

        let corner = rotateAround(cornerLT, center, -rotDeg);
        // Move `center` to `(viewSize.width/2, viewSize.height/2)`
        corner.x += -center.x + viewSize.width / 2;
        corner.y += -center.y + viewSize.height / 2;

        const BLACK_BLOCK_COLOR: string = 'grey'
        const WHITE_BLOCK_COLOR: string = 'lightgrey'

        drawBlock(corner.x, corner.y, BLACK_BLOCK_COLOR);
        drawBlock(corner.x + hori_delta_x, corner.y - hori_delta_y, WHITE_BLOCK_COLOR);
        drawBlock(corner.x + vert_delta_x, corner.y - vert_delta_y, WHITE_BLOCK_COLOR);
        drawBlock(corner.x + hori_delta_x + vert_delta_x, corner.y - hori_delta_y - vert_delta_y, BLACK_BLOCK_COLOR);
    }
}

export class InfiniteCanvas extends CanvasBase {
    constructor() {
        super(new InfiniteBackground(96))
    }

    public toDataURL(): string {
        const cvs = this.render.clone()
        cvs.getLayers().map((layer: Konva.Layer) => layer.rotation(0).position({ x: 0, y: 0 }))
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
