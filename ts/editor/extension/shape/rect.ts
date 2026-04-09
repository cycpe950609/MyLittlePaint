/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  RectangleShape     
 */

import { v4 as uuid } from "uuid";
import type { PaintEvent } from "../../../editorUI/canvas";
import type { BoundingBox } from "../../layer/render/render";
import type { CanvasState } from "../../state/canvas/canvas";
import { objAttr, type Size } from "../../state/canvas/data/object";
import { degreeToRadian, rotateAround } from "../../utils/coordinate";
import type { Point } from "../../utils/misc";
import { ClosedShapeBase, ClosedShapeBaseEditable, ClosedShapeBaseRender, type ClosedShapeBaseConfig } from "./closed";

export interface RectConfig extends ClosedShapeBaseConfig {
    cornerLT: Point;
    size: Size;
}
export class RectShape extends ClosedShapeBase<RectConfig> {
    protected valid_and_init_config(config: RectConfig): Required<RectConfig> {
        if (config.size.width <= 0 || config.size.height <= 0) {
            throw new Error('Size dimensions must be positive');
        }
        const validated = {
            ...super.valid_and_init_config(config),
            cornerLT: config.cornerLT,
            size: config.size,
        } as Required<RectConfig>;
        return validated;
    }

    @objAttr("cornerLT")
    declare public cornerLT: Point;

    @objAttr("size")
    declare public size: Size;
}

export class RectRender extends ClosedShapeBaseRender<RectShape> {
    public getBoundingBoxFrom(data: RectShape, rotDegree: number = 0): BoundingBox {
        const cornerLT = rotateAround(data.cornerLT, { x: 0, y: 0 }, -rotDegree);
        const bbox_corner_lt = { x: cornerLT.x - data.strokeWidth / 2, y: cornerLT.y - data.strokeWidth / 2 };
        return {
            cornerLT: rotateAround(bbox_corner_lt, { x: 0, y: 0 }, rotDegree),
            size: {
                width: data.size.width + data.strokeWidth,
                height: data.size.height + data.strokeWidth,
            },
        };
    }
    render_shape(ctx: OffscreenCanvasRenderingContext2D, data: RectShape): void {
        const width = data.size.width;
        const height = data.size.height;
        if (width <= 0 || height <= 0) return;
        ctx.globalCompositeOperation = data.globalCompositeOperation;
        ctx.beginPath();
        ctx.rect(data.cornerLT.x, data.cornerLT.y, width, height);
        ctx.fill();
    }
}

export class RectEditable extends ClosedShapeBaseEditable {
    ToolName = "Rectangle";
    public CanFinishDrawing: boolean = true;
    private current_rect_name: string = "rect_preview";
    private start_point: Point = { x: 0, y: 0 };
    private toRect(from: Point, to: Point, rotDegree: number): RectConfig {
        const new_rect_size = rotateAround(
            { x: to.x - from.x, y: to.y - from.y },
            { x: 0, y: 0 },
            -rotDegree,
        );
        const rect_offset = { // if size is negative, the rect will draw to opposite direction
            x: (new_rect_size.x < 0) ? new_rect_size.x : 0,
            y: (new_rect_size.y < 0) ? new_rect_size.y : 0,
        };

        // Move local top-left offset back to world space.
        const world_offset = rotateAround(rect_offset, { x: 0, y: 0 }, rotDegree);
        const cornerLT = {
            x: from.x + world_offset.x,
            y: from.y + world_offset.y,
        };
        const size = {
            width: Math.max(1, Math.abs(new_rect_size.x)),
            height: Math.max(1, Math.abs(new_rect_size.y)),
        };
        return {
            cornerLT: cornerLT,
            size: size,
            stroke: this.BorderBrush,
            strokeWidth: this.BorderWidth,
            fill: (this.CanFilled) ? this.ContentColor : undefined,
        };
    }

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        this.current_rect_name = `rect_${uuid()}`;
        this.start_point = { x: e.X, y: e.Y };
        const init_rect = this.toRect(this.start_point, this.start_point, e.rotDegree);
        const rect = new RectShape(this.current_rect_name, init_rect);
        if (preview_layer === undefined) throw new Error(`No preview layer in canvas state`);
        preview_layer.add(rect);
        const bbox = RectRender.prototype.getBoundingBoxFrom(rect, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        if (e.pressure === 0) return;
        const preview_layer = ctx.activateLayer;
        const rect = preview_layer.find(this.current_rect_name);
        if (!rect || !(rect instanceof RectShape)) throw new Error(`(PointerMove) No rect preview object in preview layer`);
        const next_rect = this.toRect(this.start_point, { x: e.X, y: e.Y }, e.rotDegree);
        rect.cornerLT = next_rect.cornerLT;
        rect.size = next_rect.size;
        rect.transformCenter = next_rect.cornerLT;
        const rad = degreeToRadian(e.rotDegree);
        rect.transformMatrix = [
            Math.cos(rad), -Math.sin(rad),
            Math.sin(rad), Math.cos(rad),
            0, 0,
        ];
        const bbox = RectRender.prototype.getBoundingBoxFrom(rect, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        this.PointerMove(ctx, e);
    }
}
