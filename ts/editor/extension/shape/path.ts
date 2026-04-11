/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  PathShape     
 */

import { max, min } from "lodash";
import { v4 as uuid } from "uuid";
import { CanvasSettingType, type CanvasInterfaceSettings, type CanvasSettingEntry, type PaintEvent } from "../../../editorUI/canvas";
import { ObjectRender, type BoundingBox } from "../../layer/render/render";
import type { CanvasState } from "../../state/canvas/canvas";
import { objAttr } from "../../state/canvas/data/object";
import { rotateAround } from "../../utils/coordinate";
import { ClosedShapeBase, ClosedShapeBaseEditable, type ClosedShapeBaseConfig } from "./closed";


export enum PathCommandType {
    M = "MoveTo",
    L = "LineTo",
    H = "HorizontalLine",
    V = "VerticalLine",
    C = "CubicBezierCurve",
    S = "SmoothCubicBezierCurve",
    Q = "QuadraticBezierCurve",
    T = "TogetherMultipleQuadraticBezier",
    A = "Arc",
    Z = "ClosePath",
}

export type SVGPathM = {
    type: PathCommandType.M;
    x: number;
    y: number;
};
export type SVGPathL = {
    type: PathCommandType.L;
    x: number;
    y: number;
};
export type SVGPathH = {
    type: PathCommandType.H;
    x: number;
};
export type SVGPathV = {
    type: PathCommandType.V;
    y: number;
};
export type SVGPathC = {
    type: PathCommandType.C;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x: number;
    y: number;
};
export type SVGPathS = {
    type: PathCommandType.S;
    x2: number;
    y2: number;
    x: number;
    y: number;
};
export type SVGPathQ = {
    type: PathCommandType.Q;
    x1: number;
    y1: number;
    x: number;
    y: number;
};
export type SVGPathT = {
    type: PathCommandType.T;
    x: number;
    y: number;
};
export type SVGPathA = {
    type: PathCommandType.A;
    rx: number;
    ry: number;
    xAxisRotation: number;
    largeArcFlag: 0 | 1;
    sweepFlag: 0 | 1;
    x: number;
    y: number;
};
export type SVGPathZ = {
    type: PathCommandType.Z;
};

export type SVGPathCommand = SVGPathM | SVGPathL | SVGPathH | SVGPathV | SVGPathC | SVGPathS | SVGPathQ | SVGPathT | SVGPathA | SVGPathZ;

export interface PathConfig extends ClosedShapeBaseConfig {
    data: SVGPathCommand[];
}
export class PathShape extends ClosedShapeBase<PathConfig> {
    protected valid_and_init_config(config: PathConfig): Required<PathConfig> {
        if (!config.data || config.data.length === 0) {
            throw new Error('Path data must not be empty');
        }
        return {
            ...super.valid_and_init_config(config),
            data: config.data,
        } as Required<PathConfig>;
    }

    @objAttr("data")
    declare public data: SVGPathCommand[];

}

export class PathRender extends ObjectRender<PathShape> {
    public getBoundingBoxFrom(data: PathShape, rotDegree: number = 0): BoundingBox {
        const center = { x: 0, y: 0 };
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let curX: number = 0;
        let curY: number = 0;

        const updateMinMax = (x: number, y: number) => {
            const point = (rotDegree === 0)
                ? { x, y }
                : rotateAround({ x, y }, center, -rotDegree);
            minX = min([minX, point.x]);
            minY = min([minY, point.y]);
            maxX = max([maxX, point.x]);
            maxY = max([maxY, point.y]);
        }
        data.data.forEach((cmd) => {
            switch (cmd.type) {
                case PathCommandType.M: { curX = cmd.x; curY = cmd.y; break; }
                case PathCommandType.L: { curX = cmd.x; curY = cmd.y; break; }
                case PathCommandType.H: { curX = cmd.x; break; }
                case PathCommandType.V: { curY = cmd.y; break; }
                case PathCommandType.C: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.S: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.Q: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.T: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.A: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.Z: { break; }
            }
            updateMinMax(curX, curY);
        })
        const baseCornerLT = { x: minX - data.strokeWidth / 2, y: minY - data.strokeWidth / 2 };
        const cornerLT = (rotDegree === 0) ? baseCornerLT : rotateAround(baseCornerLT, center, rotDegree);
        return {
            cornerLT,
            size: { width: maxX - minX + data.strokeWidth, height: maxY - minY + data.strokeWidth }
        };
    }
    render(ctx: OffscreenCanvasRenderingContext2D, data: PathShape): void {
        if (!data.data || data.data.length === 0) return;
        ctx.save();
        ctx.globalCompositeOperation = data.globalCompositeOperation;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = data.stroke || '#000000';
        ctx.lineWidth = data.strokeWidth || 1.0;
        ctx.fillStyle = data.fill || 'transparent';

        let curX: number = 0;
        let curY: number = 0;
        ctx.beginPath();
        data.data.forEach((cmd) => {
            switch (cmd.type) {
                case PathCommandType.M: { curX = cmd.x; curY = cmd.y; ctx.moveTo(curX, curY); break; }
                case PathCommandType.L: { curX = cmd.x; curY = cmd.y; ctx.lineTo(curX, curY); break; }
                case PathCommandType.H: { curX = cmd.x; ctx.lineTo(curX, curY); break; }
                case PathCommandType.V: { curY = cmd.y; ctx.lineTo(curX, curY); break; }
                case PathCommandType.C: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.S: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.Q: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.T: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.A: { throw new Error(`${cmd.type} not implemented in getBoundingBoxFrom for PathShape`); }
                case PathCommandType.Z: { ctx.closePath(); break; }
            }
        });

        if (data.fill && data.fill !== 'transparent') {
            ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
    }
}

export class PathEditable extends ClosedShapeBaseEditable {
    public CanFinishDrawing: boolean = true;
    protected current_path_name: string = "path_preview";
    protected is_closed_path: boolean = false;

    protected createPath(name: string, e: PaintEvent): PathShape {
        return new PathShape(name, {
            data: [{ type: PathCommandType.M, x: e.X, y: e.Y }],
            stroke: this.BorderBrush,
            strokeWidth: this.BorderWidth,
            fill: this.CanFilled ? this.ContentColor : undefined,
            globalCompositeOperation: "source-over",
        });
    }

    protected getPath(ctx: CanvasState): PathShape {
        const preview_layer = ctx.activateLayer;
        const path = preview_layer.find(this.current_path_name);
        if (!path || !(path instanceof PathShape)) {
            throw new Error(`No path preview object '${this.current_path_name}' in preview layer`);
        }
        return path;
    }

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        const preview_layer = ctx.activateLayer;
        this.current_path_name = `${this.constructor.name.toLowerCase()}_${uuid()}`;
        const path = this.createPath(this.current_path_name, e);
        preview_layer.add(path);
        const bbox = PathRender.prototype.getBoundingBoxFrom(path, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        if (e.pressure === 0) return;
        const pathShape = this.getPath(ctx);
        pathShape.data = this.updateMovePath(pathShape.data, e);
        pathShape.stroke = this.BorderBrush;
        pathShape.strokeWidth = this.BorderWidth;
        pathShape.fill = this.CanFilled ? this.ContentColor : "transparent";
        const bbox = PathRender.prototype.getBoundingBoxFrom(pathShape, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }
    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        const pathShape = this.getPath(ctx);
        pathShape.data = this.updateUpPath(pathShape.data, e);
        pathShape.stroke = this.BorderBrush;
        pathShape.strokeWidth = this.BorderWidth;
        pathShape.fill = this.CanFilled ? this.ContentColor : "transparent";
        const bbox = PathRender.prototype.getBoundingBoxFrom(pathShape, e.rotDegree);
        this.drawPreviewBBox(ctx, bbox, e.rotDegree);
    }

    protected updateMovePath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        return this.updatePath(path, e);
    }
    protected updateUpPath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        return this.updatePath(path, e);
    }
    protected updatePath(path: SVGPathCommand[], _e: PaintEvent): SVGPathCommand[] {
        return path;
    }

    ToolName = "Path";
    public get Settings() {
        console.log("Getting settings from PathEditable");
        let settings: ([string, CanvasSettingEntry<any>])[] = [
            ["BorderBrush", {
                type: CanvasSettingType.Color,
                label: "Brush Color",
                value: this.BorderBrush
            }],
            ["BorderWidth", {
                type: CanvasSettingType.Number,
                label: "Brush Width",
                info: [1, 64], // min,max
                value: this.BorderWidth
            }],
        ]

        if (this.is_closed_path) {
            settings.push(["CanFilled", {
                type: CanvasSettingType.Boolean,
                label: "Filled the content",
                value: this.CanFilled,
            }]);
            settings.push(["ContentColor", {
                type: CanvasSettingType.Color,
                label: "Filled Color",
                value: this.ContentColor
            }]);
        }

        let rtv: CanvasInterfaceSettings = {
            Name: this.ToolName,
            Settings: new Map<string, CanvasSettingEntry<any>>(settings)
        };
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        console.log("Update settings ", setting);
        super.Settings = setting;
    }

    public SettingsUpdate(ctx: CanvasState, rotDegree: number): void {
        if (!ctx.activateLayer.has(this.current_path_name)) return;
        const pathShape = this.getPath(ctx);
        pathShape.stroke = this.BorderBrush;
        pathShape.strokeWidth = this.BorderWidth;
        pathShape.fill = this.CanFilled ? this.ContentColor : "transparent";
        console.log("SettingsUpdate", pathShape);
        const bbox = PathRender.prototype.getBoundingBoxFrom(pathShape, rotDegree);
        this.drawPreviewBBox(ctx, bbox, rotDegree);
    }


}

