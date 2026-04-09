/**
 * Created : 2026/04/09
 * Author  : GitHub Copilot
 * About:
 *  Export canvas state as offscreen render context
 */

import { max, min } from "lodash";
import { GroupRender, LayerRender, setGetRenderFunc, setGetViewportConfigFunc, type ObjectRender } from "../layer/render/render";
import { Layer } from "../state/canvas/data/layer";
import type { Point, Size } from "../utils/misc";


export class Exporter {
    private readonly EXPORT_VIEW_SIZE = 1_000_000;
    private renderers: Record<string, ObjectRender<any>>;

    constructor() {
        this.renderers = {};
        this.register("Group", new GroupRender());
        this.register("Layer", new LayerRender());
    }

    public render(layers: Layer[], size: Size): OffscreenCanvasRenderingContext2D {
        let cvs_size: Size = { width: 0, height: 0 };
        let cvs_corner: Point = { x: 0, y: 0 };
        if (size.width === Infinity || size.height === Infinity) {
            const renderer = this.renderers["Layer"];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            layers.forEach(layer => {
                const child_bbox = renderer.getBoundingBoxFrom(layer, 0);
                const cornerLT = child_bbox.cornerLT;
                const cornerRB = { x: cornerLT.x + child_bbox.size.width, y: cornerLT.y + child_bbox.size.height };
                minX = min([minX, cornerLT.x, cornerRB.x]);
                minY = min([minY, cornerLT.y, cornerRB.y]);
                maxX = max([maxX, cornerLT.x, cornerRB.x]);
                maxY = max([maxY, cornerLT.y, cornerRB.y]);
            });
            cvs_size = { width: maxX - minX, height: maxY - minY };
            cvs_corner = { x: minX, y: minY };
        }
        else {
            cvs_size = size;
            cvs_corner = { x: -size.width / 2, y: -size.height / 2 };
        }

        const cvs = new OffscreenCanvas(cvs_size.width, cvs_size.height);
        const ctx = cvs.getContext("2d");
        if (ctx === null) throw new Error("Failed to create export context");

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.translate(-cvs_corner.x, -cvs_corner.y);

        const renderer = this.renderers["Layer"];
        if (renderer === undefined) throw new Error("Layer renderer not found");

        layers.forEach(layer => {
            renderer.render(ctx, layer);
        });
        return ctx;
    }

    public register(name: string, extension: ObjectRender<any>): void {
        if (extension instanceof GroupRender) {
            extension[setGetRenderFunc]((type: string) => this.renderers[type]);
            extension[setGetViewportConfigFunc](() => {
                return {
                    center: { x: 0, y: 0 },
                    size: {
                        width: this.EXPORT_VIEW_SIZE,
                        height: this.EXPORT_VIEW_SIZE,
                    },
                    scale: 1,
                    rotDeg: 0,
                };
            });
        }
        this.renderers[name] = extension;
    }
}