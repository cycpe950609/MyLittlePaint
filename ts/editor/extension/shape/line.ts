/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  LineShape    
 */

import { v4 as uuid } from "uuid";
import { type PaintEvent } from "../../../editorUI/canvas";
import type { BoundingBox } from "../../layer/render/render";
import type { CanvasState } from "../../state/canvas/canvas";
import { objAttr, type Point } from "../../state/canvas/data/object";
import { ShapeBase, ShapeBaseEditable, ShapeBaseRender, type ShapeBaseConfig } from "./base";

export type LineJoin = 'round' | 'bevel' | 'miter';
export type LineCap = 'butt' | 'round' | 'square';

export interface LineConfig extends ShapeBaseConfig {
    lineCap?: LineCap;
    lineJoin?: LineJoin;
    start: Point;
    end: Point;
}

export class LineShape extends ShapeBase<LineConfig> {
    protected valid_and_init_config(config: LineConfig): Required<LineConfig> {
        return {
            ...super.valid_and_init_config(config),
            stroke: config.stroke ?? '#000000',
            strokeWidth: config.strokeWidth ?? 1,
            lineCap: config.lineCap ?? 'butt',
            lineJoin: config.lineJoin ?? 'miter',
            start: config.start,
            end: config.end,
        } as Required<LineConfig>;
    }

    @objAttr("lineCap")
    declare public lineCap: LineCap;

    @objAttr("lineJoin")
    declare public lineJoin: LineJoin;

    @objAttr("start")
    declare public start: Point;

    @objAttr("end")
    declare public end: Point;

}

export class LineRender extends ShapeBaseRender<LineShape> {
    public getBoundingBoxFrom(data: LineShape, _rotDegree: number = 0): BoundingBox {
        const minX = Math.min(data.start.x, data.end.x) - data.strokeWidth / 2;
        const minY = Math.min(data.start.y, data.end.y) - data.strokeWidth / 2;
        const maxX = Math.max(data.start.x, data.end.x) + data.strokeWidth / 2;
        const maxY = Math.max(data.start.y, data.end.y) + data.strokeWidth / 2;
        return {
            cornerLT: { x: minX, y: minY },
            size: { width: maxX - minX, height: maxY - minY }
        };
    }
    protected render_shape(ctx: OffscreenCanvasRenderingContext2D, data: LineShape): void {
        ctx.lineCap = data.lineCap;
        ctx.lineJoin = data.lineJoin;
        ctx.moveTo(data.start.x, data.start.y);
        ctx.lineTo(data.end.x, data.end.y);
    }
}

export class LineEditable extends ShapeBaseEditable {
    ToolName = "Line";
    public CanFinishDrawing: boolean = true;
    private current_line_name: string = 'line_preview';
    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`No preview layer in canvas state`);
        this.current_line_name = `line_${uuid()}`;
        const line = new LineShape(
            this.current_line_name,
            {
                start: { x: e.X, y: e.Y },
                end: { x: e.X, y: e.Y },
                stroke: this.BorderBrush,
                strokeWidth: this.BorderWidth,
            });
        preview_layer.add(line);
    }
    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        if (e.pressure === 0) return;
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`(PointerMove) No preview layer in canvas state`);
        let line = preview_layer.find(this.current_line_name);
        if (line === undefined || !(line instanceof LineShape)) throw new Error(`(PointerMove) No line preview object in preview layer`);
        line.end = { x: e.X, y: e.Y };
    }
    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`(PointerUp) No preview layer in canvas state`);
        let line = preview_layer.find(this.current_line_name);
        if (line === undefined || !(line instanceof LineShape)) throw new Error(`(PointerUp) No line preview object in preview layer`);
        line.end = { x: e.X, y: e.Y };
    }
}