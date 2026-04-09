/**
 * Created : 2026/04/01
 * Author  : Ting Fang, Tsai
 * About:
 *  Render interface    
 */

import { max, min } from "lodash";
import { Group } from "../../state/canvas/data/group";
import type { ObjectBase } from "../../state/canvas/data/object";
import type { Point, Size } from "../../utils/misc";
import type { ViewportConfig } from "../interact/state/utils";

export type BoundingBox = {
    cornerLT: Point;
    size: Size;
};

export class ObjectRender<DATATYPE extends ObjectBase<any>> {
    render(_ctx: OffscreenCanvasRenderingContext2D, _data: DATATYPE): void {
        throw new Error(`Render method of ${this.constructor.name} not implemented`);
    }
    protected transform_point(data: DATATYPE, point: Point): Point {
        const center = data.transformCenter;
        const [a, b, c, d, e, f] = data.transformMatrix;
        const x = point.x - center.x;
        const y = point.y - center.y;
        return {
            x: a * x + c * y + e + center.x,
            y: b * x + d * y + f + center.y,
        };
    }
    public renderWithTransform(ctx: OffscreenCanvasRenderingContext2D, data: DATATYPE, draw: () => void): void {
        const center = data.transformCenter;
        const [a, b, c, d, e, f] = data.transformMatrix;
        const isIdentity = center.x === 0 && center.y === 0 && a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
        if (isIdentity) {
            draw();
            return;
        }

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.transform(a, b, c, d, e, f);
        ctx.translate(-center.x, -center.y);
        draw();
        ctx.restore();
    }
    public getBoundingBoxFrom(_data: DATATYPE, _rotDegree: number = 0): BoundingBox {
        // Calculate bounding box, not effected by view state (e.g. zoom, pan, etc.) 
        throw new Error(`BoundingBox method of ${this.constructor.name} not implemented`);
    }
    public visible(data: DATATYPE, center: Point, size: Size, rotDegree: number, scale: number): boolean {
        if (!data.visible) return false;
        const bbox = this.getBoundingBoxFrom(data);
        const bboxW = bbox.size.width;
        const bboxH = bbox.size.height;
        if (bboxW <= 0 || bboxH <= 0 || size.width <= 0 || size.height <= 0 || scale === 0) return false;

        const x0 = bbox.cornerLT.x;
        const y0 = bbox.cornerLT.y;
        const x1 = x0 + bboxW;
        const y1 = y0 + bboxH;

        const rad = rotDegree * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Viewport bounds in world units after accounting for zoom.
        const halfW = (size.width * 0.5) / scale;
        const halfH = (size.height * 0.5) / scale;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        const project = (x: number, y: number) => {
            const transformed = this.transform_point(data, { x, y });
            const dx = transformed.x - center.x;
            const dy = transformed.y - center.y;
            // Rotate into viewport-aligned space (inverse of view rotation).
            const px = dx * cos - dy * sin;
            const py = dx * sin + dy * cos;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
        };

        project(x0, y0);
        project(x1, y0);
        project(x0, y1);
        project(x1, y1);

        return !(maxX < -halfW || minX > halfW || maxY < -halfH || minY > halfH);
    }
}



export const setGetRenderFunc: unique symbol = Symbol("GroupRender.setGetRenderFunc");
type GetRenderFunc = (type: string) => ObjectRender<any> | undefined;
export const setGetViewportConfigFunc: unique symbol = Symbol("GroupRender.setGetViewportConfigFunc");
type GetViewportConfigFunc = () => ViewportConfig;
export class GroupRender extends ObjectRender<Group> {

    protected get_render_func?: GetRenderFunc;
    public [setGetRenderFunc](func: GetRenderFunc): void {
        this.get_render_func = func;
    }
    protected get_viewport_config_func?: GetViewportConfigFunc;
    public [setGetViewportConfigFunc](func: GetViewportConfigFunc): void {
        this.get_viewport_config_func = func;
    }

    private render_obj(ctx: OffscreenCanvasRenderingContext2D, group: Group | ObjectBase<any>) {
        if (group instanceof Group) {
            this.renderWithTransform(ctx, group, () => {
                group.children.forEach(child => {
                    this.render_obj(ctx, child);
                });
            });
        } else {
            const renderer = this.get_render_func?.(group.type);
            if (renderer) {
                const viewport_config = this.get_viewport_config_func!();
                if (renderer.visible(
                    group, // data
                    viewport_config.center, // center
                    viewport_config.size, // size
                    viewport_config.rotDeg, // rotDegree
                    viewport_config.scale,    // scale
                )) {
                    renderer.renderWithTransform(ctx, group, () => renderer.render(ctx, group));
                }
            }
        }
    };
    public getBoundingBoxFrom(data: Group, rotDegree: number = 0): BoundingBox {
        if(data.children.length === 0) return { cornerLT: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
        // TODO: Calculate boundingBox from all children
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        data.children.forEach((child) => {
            const render = this.get_render_func?.(child.type);
            if (render !== undefined) {
                const child_bbox = render.getBoundingBoxFrom(child, rotDegree);
                const cornerLT = child_bbox.cornerLT;
                const cornerRB = { x: cornerLT.x + child_bbox.size.width, y: cornerLT.y + child_bbox.size.height };
                minX = min([minX, cornerLT.x, cornerRB.x]);
                minY = min([minY, cornerLT.y, cornerRB.y]);
                maxX = max([maxX, cornerLT.x, cornerRB.x]);
                maxY = max([maxY, cornerLT.y, cornerRB.y]);
            }
        })
        return { cornerLT: { x: minX, y: minY }, size: { width: maxX - minX, height: maxY - minY } };
    }
    public render(ctx: OffscreenCanvasRenderingContext2D, data: Group): void {
        // TODO: Support transform, composite operation, etc.
        this.render_obj(ctx, data);
    }
}

export class LayerRender extends GroupRender {
    // LayerRender should same as GroupRender
}
