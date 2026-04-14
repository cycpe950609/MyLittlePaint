/**
 * Created : 2026/03/31
 * Author  : Ting Fang, Tsai
 * About:
 *  ViewLayer     
 */

import { Layer } from "../../state/canvas/data/layer";
import { type Size } from "../../state/canvas/data/object";
import type { Point } from "../../utils/misc";
import { GroupRender, LayerRender, setGetRenderFunc, setGetViewportConfigFunc, type ObjectRender } from "./render";


export class RenderLayer {
    private render_canvas: HTMLCanvasElement;
    private render_ctx: CanvasRenderingContext2D;

    constructor() {
        this.render_canvas = document.createElement("canvas");
        this.render_canvas.style.width = "100%";
        this.render_canvas.style.height = "100%";
        this.render_canvas.style.position = "absolute";
        this.render_canvas.style.left = "0";
        this.render_canvas.style.top = "0";
        this.render_canvas.style.pointerEvents = "none"; // Disable pointer events for view layer

        const view_ctx = this.render_canvas.getContext("2d")!;
        if (view_ctx === null) throw new Error("Failed to get 2D context for view layer");
        this.render_ctx = view_ctx;
        this.layers_cache = new Map();

        this.renderers = {};

        this.view_at_center = { x: 0, y: 0 };
        this.view_at_rotDegree = 0;
        this.view_at_scale = 1.0;

        this.register("Group", new GroupRender());
        this.register("Layer", new LayerRender());
    }

    /** Function */
    private layers_cache: Map<Layer, OffscreenCanvasRenderingContext2D>;
    private view_changed: boolean = false;
    private get viewWidth(): number {
        const dpr = window.devicePixelRatio || 1;
        return this.render_canvas.width / dpr;
    }
    private get viewHeight(): number {
        const dpr = window.devicePixelRatio || 1;
        return this.render_canvas.height / dpr;
    }
    public render(layers: Layer[]): void {
        const create_cache_ctx = (width: number, height: number): OffscreenCanvasRenderingContext2D => {
            const cache_canvas = new OffscreenCanvas(width, height);
            const cache_ctx = cache_canvas.getContext("2d");
            if (cache_ctx === null) throw new Error("Failed to create cache context");
            return cache_ctx;
        }

        let need_rerender = false || this.view_changed;
        layers.forEach(layer => {
            if ((!layer.changed) && (this.layers_cache.has(layer)) && (!this.view_changed)) return;
            // Re-compositing is required whenever a layer cache is rebuilt,
            // even if the layer is now invisible/empty (e.g. undo last stroke).
            need_rerender = true;
            const cvsW = this.render_canvas.width;
            const cvsH = this.render_canvas.height;
            const cssW = this.viewWidth;
            const cssH = this.viewHeight;
            const dpr = window.devicePixelRatio || 1;
            if (!this.layers_cache.has(layer)) this.layers_cache.set(layer, create_cache_ctx(cvsW, cvsH));
            let cache_ctx = this.layers_cache.get(layer)!;
            cache_ctx.setTransform(1, 0, 0, 1, 0, 0);
            cache_ctx.clearRect(0, 0, cvsW, cvsH);
            cache_ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cache_ctx.translate(cssW / 2, cssH / 2);
            const rotRad = this.view_at_rotDegree * Math.PI / 180;
            if (rotRad !== 0) cache_ctx.rotate(rotRad);
            if (this.view_at_scale !== 1) cache_ctx.scale(this.view_at_scale, this.view_at_scale);
            cache_ctx.translate(-this.view_at_center.x, -this.view_at_center.y);

            const renderer = this.renderers["Layer"];
            if (renderer.visible(
                layer, // data
                this.view_at_center, // center
                { width: cssW, height: cssH }, // size
                this.view_at_rotDegree, // rotDegree
                this.view_at_scale,    // scale
            )) {
                renderer.render(cache_ctx, layer);
            }
        })
        if (!need_rerender) return;
        console.log("[DEB] Rendering view.");
        this.render_ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.render_ctx.clearRect(0, 0, this.render_canvas.width, this.render_canvas.height);
        layers.forEach(layer => {
            const cache_ctx = this.layers_cache.get(layer);
            if (cache_ctx === undefined) throw new Error("Cache context not found for layer during rendering");
            this.render_ctx.save();
            this.render_ctx.globalCompositeOperation = layer.globalCompositeOperation;
            this.render_ctx.drawImage(cache_ctx.canvas, 0, 0);
            this.render_ctx.restore();
        });
        this.view_changed = false;
    }

    /** Properties */
    public set viewSize(size: Size) {
        const dpr = window.devicePixelRatio || 1;
        this.render_canvas.style.width = `${size.width}px`;
        this.render_canvas.style.height = `${size.height}px`;
        this.render_canvas.width = Math.max(1, Math.round(size.width * dpr));
        this.render_canvas.height = Math.max(1, Math.round(size.height * dpr));
        this.layers_cache.forEach((cache_ctx) => {
            cache_ctx.canvas.width = this.render_canvas.width;
            cache_ctx.canvas.height = this.render_canvas.height;
        });
        this.view_changed = true;
    }
    private view_at_center: Point
    private view_at_rotDegree: number
    private view_at_scale: number
    public viewAt(center: Point, rotDegree: number, scale: number) {
        if (
            this.view_at_center.x === center.x &&
            this.view_at_center.y === center.y &&
            this.view_at_rotDegree === rotDegree &&
            this.view_at_scale === scale &&
            !this.view_changed
        ) return;
        this.view_at_center = structuredClone(center);
        this.view_at_rotDegree = rotDegree;
        this.view_at_scale = scale;
        this.view_changed = true;
    }

    public get element(): HTMLCanvasElement {
        return this.render_canvas;
    }

    /** Extension */
    private renderers: Record<string, ObjectRender<any>>;
    public register(name: string, extension: ObjectRender<any>): void {
        /** Register extension */
        console.log("[DEB] Register renderer:", name, extension.constructor.name);
        if (extension instanceof GroupRender) {
            console.log("[DEB] Setting getRenderFunc for GroupRender extension:", name);
            extension[setGetRenderFunc]((type: string) => this.renderers[type]);
            extension[setGetViewportConfigFunc](() => {
                return {
                    center: this.view_at_center,
                    size: { width: this.viewWidth, height: this.viewHeight },
                    scale: this.view_at_scale,
                    rotDeg: this.view_at_rotDegree,
                }
            });
        }
        this.renderers[name] = extension;
    }
}
