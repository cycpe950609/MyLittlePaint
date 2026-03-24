/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Shape    
 */

import Konva from "konva";

export const INTERNAL_SHAPE = Symbol("ShapeInternal");

export type ShapeBaseConfig = {}
export class ShapeBase<KonvaShape extends Konva.Shape, ShapeConfig extends ShapeBaseConfig> {

    protected shape!: KonvaShape;

    constructor(config?: ShapeConfig) {
        if (config) this.shape = this.create_shape(config);
    }

    protected create_shape(_config: ShapeConfig): KonvaShape {
        throw new Error("ShapeBase.create_shape")
    }

    static create<TS extends Konva.Shape, TC extends ShapeBaseConfig>(
        this: new (config?: TC) => ShapeBase<TS, TC>,
        shape: TS
    ): ShapeBase<TS, TC> {
        // TODO: create default config
        const instance = new this();
        instance.shape = shape;
        return instance;
    }

    // "friend-only" accessor
    [INTERNAL_SHAPE](): Konva.Shape {
        return this.shape;
    }
}

export interface LineConfig extends ShapeBaseConfig { }
export class Line extends ShapeBase<Konva.Line, LineConfig> {
    constructor(config?: LineConfig) {
        super(config);
    }

    public get points(): number[] {
        // TODO: Get points
        return []
    }
    public set points(points: number[]) {
        // TODO: Set points
    }
}

export class ClosedShapeBase<KonvaShape extends Konva.Shape, ShapeConfig extends ShapeBaseConfig> extends ShapeBase<KonvaShape, ShapeConfig> {
    public set x(_x: number) { }
    public set y(_y: number) { }
    public set fill(_fill: string | CanvasGradient) { }
    public set stroke(_stroke: string | CanvasGradient) { }
    public set strokeWidth(_strokeWidth: number) { }
};

export interface RectConfig extends ShapeBaseConfig { }
export class Rect extends ClosedShapeBase<Konva.Rect, RectConfig> { }

export interface CircleConfig extends ShapeBaseConfig { }
export class Circle extends ClosedShapeBase<Konva.Circle, CircleConfig> {
    public set radius(_radius: number) { }
}

export interface EllipseConfig extends ShapeBaseConfig { }
export class Ellipse extends ClosedShapeBase<Konva.Ellipse, EllipseConfig> { }

export interface PathConfig extends ShapeBaseConfig { }
export class Path extends ClosedShapeBase<Konva.Path, PathConfig> {
    public set pathData(path: string) { }
}

export interface TextConfig extends ShapeBaseConfig { }
export class Text extends ClosedShapeBase<Konva.Text, TextConfig> { }

export function createShape(shape: Konva.Shape): ShapeBase<typeof shape, any> {
    if (shape instanceof Konva.Line) return Line.create(shape)
    if (shape instanceof Konva.Rect) return Rect.create(shape)
    if (shape instanceof Konva.Circle) return Circle.create(shape)
    if (shape instanceof Konva.Ellipse) return Ellipse.create(shape)
    if (shape instanceof Konva.Path) return Path.create(shape)
    if (shape instanceof Konva.Text) return Text.create(shape)
    throw new Error(`Unsupported Konva Shape type '${typeof shape}'`)
}