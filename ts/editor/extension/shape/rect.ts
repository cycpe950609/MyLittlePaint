/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  RectangleShape     
 */

import { v4 as uuid } from "uuid";
import { CanvasSettingType, type CanvasInterfaceSettings, type PaintEvent } from "../../../editorUI/canvas";
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
    private draw_square: boolean = false;
    private draw_from_center: boolean = false;
    private toRect(from: Point, to: Point, rotDegree: number, square: boolean, fromCenter: boolean): RectConfig {
        // Convert from canvas coordinate to view coordinate
        const start = rotateAround(from, { x: 0, y: 0 }, -rotDegree);
        const end = rotateAround(to, { x: 0, y: 0 }, -rotDegree);
        console.log("toRect", square, fromCenter);
        const rotated_diagonal = rotateAround(
            { x: to.x - from.x, y: to.y - from.y },
            { x: 0, y: 0 },
            -rotDegree,
        );
        let new_rect_size = {
            width: Math.max(1, Math.abs(rotated_diagonal.x)),
            height: Math.max(1, Math.abs(rotated_diagonal.y)),
        };
        // Draw square
        new_rect_size = {
            width: square ? Math.max(new_rect_size.width, new_rect_size.height) : new_rect_size.width,
            height: square ? Math.max(new_rect_size.width, new_rect_size.height) : new_rect_size.height,
        }
        // Draw from center
        new_rect_size = {
            width: fromCenter ? new_rect_size.width * 2 : new_rect_size.width,
            height: fromCenter ? new_rect_size.height * 2 : new_rect_size.height,
        }
        let cornerLT: Point = { x: 0, y: 0 };
        if (start.x <= end.x && start.y > end.y) { // 1st quadrant
            cornerLT = {
                x: fromCenter ? start.x - new_rect_size.width / 2 : start.x,
                y: fromCenter ? start.y - new_rect_size.height / 2 : start.y - new_rect_size.height,
            };
        }
        if (start.x > end.x && start.y >= end.y) { // 2nd quadrant
            cornerLT = {
                x: fromCenter ? start.x - new_rect_size.width / 2 : start.x - new_rect_size.width,
                y: fromCenter ? start.y - new_rect_size.height / 2 : start.y - new_rect_size.height,
            };
        }
        if (start.x >= end.x && start.y < end.y) { // 3rd quadrant
            cornerLT = {
                x: fromCenter ? start.x - new_rect_size.width / 2 : start.x - new_rect_size.width,
                y: fromCenter ? start.y - new_rect_size.height / 2 : start.y,
            };
        }

        if (start.x < end.x && start.y <= end.y) { // 4th quadrant
            cornerLT = {
                x: fromCenter ? start.x - new_rect_size.width / 2 : start.x,
                y: fromCenter ? start.y - new_rect_size.height / 2 : start.y,
            };
        }

        return {
            cornerLT: rotateAround(cornerLT, { x: 0, y: 0 }, rotDegree), // Convert back to canvas coordinate
            size: { width: new_rect_size.width, height: new_rect_size.height },
            stroke: this.BorderBrush,
            strokeWidth: this.BorderWidth,
            fill: (this.CanFilled) ? this.ContentColor : undefined,
        };
    }

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        this.current_rect_name = `rect_${uuid()}`;
        this.start_point = { x: e.X, y: e.Y };
        const init_rect = this.toRect(this.start_point, this.start_point, e.rotDegree, this.draw_square, this.draw_from_center);
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
        const next_rect = this.toRect(this.start_point, { x: e.X, y: e.Y }, e.rotDegree, this.draw_square, this.draw_from_center);
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

    public get Settings() {
        const rtv = super.Settings;
        rtv.Settings?.set("DrawSquare", {
            type: CanvasSettingType.Boolean,
            label: "Draw a square",
            value: this.draw_square,
        });
        rtv.Settings?.set("DrawFromCenter", {
            type: CanvasSettingType.Boolean,
            label: "Draw from center",
            value: this.draw_from_center,
        });
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        super.Settings = setting;
        let refreshWindow = false;
        if (setting.Settings.get("DrawSquare") !== undefined) {
            this.draw_square = setting.Settings.get("DrawSquare")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("DrawFromCenter") !== undefined) {
            this.draw_from_center = setting.Settings.get("DrawFromCenter")?.value;
            refreshWindow = true;
        }
        if (refreshWindow) window.editorUI.forceRerender();
    }
}
