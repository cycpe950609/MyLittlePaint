/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Layer
 */

import Konva from "konva";
import { createShape, INTERNAL_SHAPE, type ShapeBase } from "./shape";

export const INTERNAL_LAYER = Symbol("LayerInternal");

export class Layer {
    private render: Konva.Group;
    private layer_z_index: number = 0;

    constructor(id: string) {
        this.render = new Konva.Group({
            name: `render_${id}`,
        } as Konva.GroupConfig);
    }
    public add(shape: ShapeBase<any, any>) {
        const konva_node = shape[INTERNAL_SHAPE]()
        this.render.add(konva_node)
    }
    public find(id: string): ShapeBase<any, any> | undefined {
        const shape = this.render.find(`.${id}`)
        if (shape === undefined) return undefined
        if (shape.length === 0) return undefined
        if (shape.length !== 1)
            throw new Error(`Unexpected shape found, should only 1 shape, got '${shape.length}'.`)
        const polygon = shape[0]
        if (!(polygon instanceof Konva.Shape))
            throw new Error(`Unexpected type, should be Konva.Shape, got '${typeof polygon}'`)
        return createShape(polygon)
    }
    public clear(): void {
        this.render.destroyChildren();
    }

    public toDataURL(): string {
        return this.render.toDataURL();
    }

    // Properties

    public get zIndex(): number {
        return this.layer_z_index;
    }
    public set zIndex(zIdx: number) {
        this.layer_z_index = zIdx;
        this.render.zIndex(zIdx);
    }

    public get children(): Generator<ShapeBase<any, any>> {
        const self = this;
        return (function* () {
            for (const child of self.render.children) {
                if (!(child instanceof Konva.Shape))
                    throw new Error(`Unexpect type, should be 'Konva.Shape', got '${typeof child}'`)
                yield createShape(child);
            }
        })();
    }

    // "friend-only" accessor
    [INTERNAL_LAYER](): Konva.Group {
        return this.render;
    }

};