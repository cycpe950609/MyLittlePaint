/**
 * Created : 2026/04/04
 * Author  : Ting Fang, Tsai
 * About:
 *  Brush-liked tools     
 */

import type { CanvasInterfaceSettings, PaintEvent } from "../../../editorUI/canvas";
import type { CanvasState } from "../../state/canvas/canvas";
import { Layer } from "../../state/canvas/data/layer";
import { CircleShape } from "./circle";
import { PathCommandType, PathEditable, type SVGPathCommand } from "./path";


export class BrushEditable extends PathEditable {
    CursorName = 'brush';
    ToolName = "Brush";
    protected is_closed_path: boolean = false;
    protected updatePath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        return [...path, { type: PathCommandType.L, x: e.X, y: e.Y }];
    }

    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        if (ctx.find("brush_outline") === undefined) {
            const brush_layer = new Layer("brush_outline", { zIndex: 100 });
            brush_layer.add(new CircleShape("brush_outline", { center: { x: e.X, y: e.Y }, radius: this.BorderWidth / 2 }));
            ctx.add(brush_layer);
        }
        const layer = ctx.find("brush_outline");
        if (layer === undefined) throw new Error(`No brush_outline layer in canvas state`);
        const brush_outline = layer.find("brush_outline");
        if (!(brush_outline instanceof CircleShape)) throw new Error(`No brush outline shape in brush_outline layer`);
        brush_outline.center = { x: e.X, y: e.Y };
        brush_outline.radius = this.BorderWidth / 2;

        super.PointerMove(ctx, e);
    }
}

export class EraserEditable extends BrushEditable {
    CursorName = 'eraser';
    ToolName = "Eraser";
    // Cause we draw eraser on a preview layer, which cant eraser other layers
    // So we use a semi-transparent red stroke to indicate the eraser area
    protected BorderBrush: string = "#ff000077";

    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        super.PointerUp(ctx, e);
        let brush = this.getPath(ctx);
        brush.globalCompositeOperation = "destination-out";
        brush.stroke = "#000000"; // Stroke color should have 100% opacity for erasing
    }

    public get Settings() {
        let setting = super.Settings;
        setting.Settings?.delete("BorderBrush");
        return setting;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings?.has("BorderBrush")) {
            setting.Settings.delete("BorderBrush");
        }
        super.Settings = setting;
    }
}

