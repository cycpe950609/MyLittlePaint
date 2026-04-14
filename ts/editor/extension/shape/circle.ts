/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  CircleShape     
 */

import { max } from "lodash";
import { v4 as uuid } from "uuid";
import { CanvasSettingType, type CanvasInterfaceSettings, type PaintEvent } from "../../../editorUI/canvas";
import type { BoundingBox } from "../../layer/render/render";
import type { CanvasState } from "../../state/canvas/canvas";
import { objAttr, type Point } from "../../state/canvas/data/object";
import { rotateAround } from "../../utils/coordinate";
import { ClosedShapeBase, ClosedShapeBaseEditable, ClosedShapeBaseRender, type ClosedShapeBaseConfig } from "./closed";



export interface CircleConfig extends ClosedShapeBaseConfig {
    center: Point;
    radius: number;
}
export class CircleShape extends ClosedShapeBase<CircleConfig> {
    protected valid_and_init_config(config: CircleConfig): Required<CircleConfig> {
        if (config.radius < 0) {
            throw new Error('Radius must be non-zero positive');
        }
        return {
            ...super.valid_and_init_config(config),
            center: config.center,
            radius: config.radius,
        } as Required<CircleConfig>;
    }

    @objAttr("center")
    declare public center: Point;

    @objAttr("radius")
    declare public radius: number;

}
export class CircleRender extends ClosedShapeBaseRender<CircleShape> {

    public getBoundingBoxFrom(data: CircleShape, rotDegree: number = 0): BoundingBox {
        const { center, radius } = data;
        const bbox = {
            cornerLT: { x: center.x - radius - data.strokeWidth / 2, y: center.y - radius - data.strokeWidth / 2 },
            size: { width: radius * 2 + data.strokeWidth, height: radius * 2 + data.strokeWidth }
        };
        if (rotDegree === 0) return bbox;
        return {
            cornerLT: rotateAround(bbox.cornerLT, data.center, rotDegree),
            size: bbox.size,
        };
    }

    render_shape(ctx: OffscreenCanvasRenderingContext2D, data: CircleShape): void {
        if (data.radius < 0 || !Number.isFinite(data.radius)) return;
        ctx.arc(data.center.x, data.center.y, data.radius, 0, Math.PI * 2);
    }
}

type ComputedCircle = {
    center: Point;
    radius: number;
}
const CircleDrawingMethod: string[] = [
    "Start: Center, To: Border",
    "Start: Corner, To: Border (Long Edge as Diameter length)",
    "Start: Border, To: Border (Diameter)",
];
export class CircleEditable extends ClosedShapeBaseEditable {
    ToolName = "Circle";
    public CanFinishDrawing: boolean = true;
    private current_circle_name: string = 'circle_preview';

    private drawing_index: number = 0;
    private startPoint: Point = { x: 0, y: 0 };
    private calcCircle(from: Point, to: Point, method: number, rotDegree: number): ComputedCircle {
        const start = rotateAround(from, { x: 0, y: 0 }, -rotDegree);
        const end = rotateAround(to, { x: 0, y: 0 }, -rotDegree);
        switch (method) {
            case 0: // Start: Center, To: Border
                return {
                    center: rotateAround(start, { x: 0, y: 0 }, rotDegree),
                    radius: Math.hypot(end.x - start.x, end.y - start.y),
                }
            case 1: { // Start: Corner, To: Border
                const w = Math.abs(end.x - start.x);
                const h = Math.abs(end.y - start.y);
                const circleW = max([w, h]);
                let cornerLT: Point = { x: 0, y: 0 };
                if (start.x <= end.x && start.y > end.y) { // 1st quadrant
                    // Start is cornerLB
                    cornerLT = { x: start.x, y: start.y - circleW };
                }
                if (start.x > end.x && start.y >= end.y) { // 2nd quadrant
                    // Start is cornerRB
                    cornerLT = { x: start.x - circleW, y: start.y - circleW };
                }
                if (start.x >= end.x && start.y < end.y) { // 3rd quadrant
                    // Start is cornerRT
                    cornerLT = { x: start.x - circleW, y: start.y };
                }
                if (start.x < end.x && start.y <= end.y) { // 4th quadrant
                    // Start is cornerLT
                    cornerLT = start;
                }
                return {
                    center: rotateAround({ x: cornerLT.x + circleW / 2, y: cornerLT.y + circleW / 2 }, { x: 0, y: 0 }, rotDegree),
                    radius: circleW / 2,
                }
            }
            case 2: // Start: Border, To: Border (Diameter)
                return {
                    center: rotateAround({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, { x: 0, y: 0 }, rotDegree),
                    radius: Math.hypot(end.x - start.x, end.y - start.y) / 2,
                }
            default:
                throw new Error(`Invalid drawing method index ${method}`)
        }
    }

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`No preview layer in canvas state`);
        this.current_circle_name = `circle_${uuid()}`;
        this.startPoint = { x: e.X, y: e.Y };
        const new_circle_cfg = this.calcCircle(this.startPoint, { x: e.X, y: e.Y }, this.drawing_index, e.rotDegree);
        const circle = new CircleShape(
            this.current_circle_name,
            {
                center: new_circle_cfg.center,
                radius: new_circle_cfg.radius,
                stroke: this.BorderBrush,
                strokeWidth: this.BorderWidth,
                fill: (this.CanFilled) ? this.ContentColor : undefined,
            });
        preview_layer.add(circle);
        const bbox = CircleRender.prototype.getBoundingBoxFrom(circle, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        if (e.pressure === 0) return;
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`(PointerMove) No preview layer in canvas state`);
        let circle = preview_layer.find(this.current_circle_name);
        if (circle === undefined || !(circle instanceof CircleShape)) throw new Error(`(PointerMove) No circle preview object in preview layer`);
        const new_circle_cfg = this.calcCircle(this.startPoint, { x: e.X, y: e.Y }, this.drawing_index, e.rotDegree);
        circle.center = new_circle_cfg.center;
        circle.radius = new_circle_cfg.radius;
        const bbox = CircleRender.prototype.getBoundingBoxFrom(circle, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`(PointerUp) No preview layer in canvas state`);
        let circle = preview_layer.find(this.current_circle_name);
        if (circle === undefined || !(circle instanceof CircleShape)) throw new Error(`(PointerUp) No circle preview object in preview layer`);
        const new_circle_cfg = this.calcCircle(this.startPoint, { x: e.X, y: e.Y }, this.drawing_index, e.rotDegree);
        circle.center = new_circle_cfg.center;
        circle.radius = new_circle_cfg.radius;
        const bbox = CircleRender.prototype.getBoundingBoxFrom(circle, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public get Settings() {
        const rtv = super.Settings;
        rtv.Settings?.set("DrawingMethod", {
            type: CanvasSettingType.DropDownList,
            label: "Drawing Method",
            info: {
                options: CircleDrawingMethod,
                defaultIdx: 0
            },
            value: this.drawing_index,
        });
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        super.Settings = setting;
        let refreshWindow = false;
        if (setting.Settings.get("DrawingMethod") !== undefined) {
            this.drawing_index = setting.Settings.get("DrawingMethod")?.value;
            refreshWindow = true;
        }
        if (refreshWindow) window.editorUI.forceRerender();
    }
}


export interface EllipseConfig extends ClosedShapeBaseConfig {
    point1: Point;
    point2: Point;
    distance: number; // sum of distances to foci
}
export class EllipseShape extends ClosedShapeBase<EllipseConfig> {
    protected valid_and_init_config(config: EllipseConfig): Required<EllipseConfig> {
        const distance1 = Math.hypot(config.point2.x - config.point1.x, config.point2.y - config.point1.y);
        if (config.distance <= distance1) {
            throw new Error('Distance must be greater than distance between foci');
        }
        return {
            ...super.valid_and_init_config(config),
            point1: config.point1,
            point2: config.point2,
            distance: config.distance,
        } as Required<EllipseConfig>;
    }
}

export class EllipseRender extends ClosedShapeBaseRender<EllipseShape> {
    render_shape(_ctx: OffscreenCanvasRenderingContext2D, _data: EllipseShape): void {
        throw new Error('EllipseShape render not implemented');
    }
}