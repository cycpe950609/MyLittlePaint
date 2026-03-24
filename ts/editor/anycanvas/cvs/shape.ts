/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Shape    
 */

import Konva from "konva";

export const INTERNAL_SHAPE = Symbol("ShapeInternal");

export type ShapeBaseConfig = {
    name: string,
    stroke?: string | CanvasGradient,
    strokeWidth?: number,
    globalCompositeOperation?: GlobalCompositeOperation
}
export class ShapeBase<KonvaShape extends Konva.Shape, ShapeConfig extends ShapeBaseConfig> {

    protected shape!: KonvaShape;

    constructor(config?: ShapeConfig) {
        if (config) this.shape = this.create_shape(config);
    }

    protected create_shape(_config: ShapeConfig): KonvaShape {
        throw new Error(`${typeof this}.create_shape`)
    }

    public show() {
        this.shape.show();
    }
    public hide() {
        this.shape.hide();
    }
    public clear() {
        this.shape.destroy()
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

    // General attributes
    @shapeAttr("stroke")
    declare stroke: string | CanvasGradient;

    @shapeAttr("strokeWidth")
    declare strokeWidth: number;

    @shapeAttr("className")
    declare className: string;
    
    @shapeAttr("name")
    declare name: string;

    @shapeAttr("attrs")
    declare attrs: any;

    // "friend-only" accessor
    [INTERNAL_SHAPE](): Konva.Shape {
        return this.shape;
    }
}

export function shapeAttr(key: string) {
    // Create get/set using decorator
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get() {
                return this.shape.getAttr(key);
            },
            set(value: any) {
                this.shape.setAttr(key, value);
            },
        });
    };
}

export type LineJoin = 'round' | 'bevel' | 'miter';
export type LineCap = 'butt' | 'round' | 'square';
export interface LineConfig extends ShapeBaseConfig {
    lineCap: LineCap,
    lineJoin: LineJoin,
    points: number[]
}
export class Line extends ShapeBase<Konva.Line, LineConfig> {
    protected create_shape(config: LineConfig): Konva.Line {
        return new Konva.Line({
            name: config.name,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
            lineCap: config.lineCap,
            lineJoin: config.lineJoin,
            globalCompositeOperation: config.globalCompositeOperation,
            points: config.points,
        } as Konva.LineConfig)
    }

    @shapeAttr("points")
    declare points: number[];

}

export class ClosedShapeBase<KonvaShape extends Konva.Shape, ShapeConfig extends ShapeBaseConfig> extends ShapeBase<KonvaShape, ShapeConfig> {

    @shapeAttr("x")
    declare x: number;

    @shapeAttr("y")
    declare y: number;

    @shapeAttr("fill")
    declare fill: string | CanvasGradient;


};

export interface RectConfig extends ShapeBaseConfig { }
export class Rect extends ClosedShapeBase<Konva.Rect, RectConfig> { }

export interface CircleConfig extends ShapeBaseConfig { }
export class Circle extends ClosedShapeBase<Konva.Circle, CircleConfig> {
    protected create_shape(config: CircleConfig): Konva.Circle {
        return new Konva.Circle({
            name: config.name
        } as Konva.CircleConfig)
    }
    @shapeAttr("radius")
    declare radius: number
}

export interface EllipseConfig extends ShapeBaseConfig { }
export class Ellipse extends ClosedShapeBase<Konva.Ellipse, EllipseConfig> { }

export interface PathConfig extends ShapeBaseConfig { }
export class Path extends ClosedShapeBase<Konva.Path, PathConfig> {
    protected create_shape(config: PathConfig): Konva.Path {
        return new Konva.Path({
            name: config.name
        } as Konva.PathConfig)
    }
    @shapeAttr("data")
    declare pathData: string;
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