/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  CircleShape     
 */

import { v4 as uuid } from "uuid";
import type { PaintEvent } from "../../../editorUI/canvas";
import type { ViewportConfig } from "../../layer/interact/state/utils";
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
export class CircleEditable extends ClosedShapeBaseEditable {
    ToolName = "Circle";
    public CanFinishDrawing: boolean = true;
    private current_circle_name: string = 'circle_preview';
    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`No preview layer in canvas state`);
        this.current_circle_name = `circle_${uuid()}`;
        const circle = new CircleShape(
            this.current_circle_name,
            {
                center: { x: e.X, y: e.Y },
                radius: 1,
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
        const dx = e.X - circle.center.x;
        const dy = e.Y - circle.center.y;
        circle.radius = Math.hypot(dx, dy);
        const bbox = CircleRender.prototype.getBoundingBoxFrom(circle, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        if (preview_layer === undefined) throw new Error(`(PointerUp) No preview layer in canvas state`);
        let circle = preview_layer.find(this.current_circle_name);
        if (circle === undefined || !(circle instanceof CircleShape)) throw new Error(`(PointerUp) No circle preview object in preview layer`);
        const dx = e.X - circle.center.x;
        const dy = e.Y - circle.center.y;
        circle.radius = Math.hypot(dx, dy);
        const bbox = CircleRender.prototype.getBoundingBoxFrom(circle, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
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
    protected isInView(_view: ViewportConfig): boolean {
        return true;
    }

    protected renderSelf(_ctx: OffscreenCanvasRenderingContext2D, _view: ViewportConfig): void { }

}

export class EllipseRender extends ClosedShapeBaseRender<EllipseShape> {
    render_shape(_ctx: OffscreenCanvasRenderingContext2D, _data: EllipseShape): void {
        throw new Error('EllipseShape render not implemented');
    }
}