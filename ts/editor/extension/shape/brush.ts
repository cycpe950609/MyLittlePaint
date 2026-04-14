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
import { PathCommandType, PathEditable, PathShape, type SVGPathCommand } from "./path";


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
    protected BorderBrush: string = "#000000";

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        ctx.activateLayer.globalCompositeOperation = "destination-out";
        super.PointerDown(ctx, e);
        if (!ctx.has("eraser_preview")) {
            const eraser_layer = new Layer("eraser_preview", { zIndex: 101 });
            let path = this.createPath(this.current_path_name, e);
            path.stroke = "#ff000066";
            eraser_layer.add(path)
            ctx.add(eraser_layer);
        }
    }

    public PointerMove(ctx: CanvasState, e: PaintEvent): void {
        super.PointerMove(ctx, e);
        const preview_layer = ctx.find("eraser_preview");
        if (preview_layer === undefined) throw new Error(`No eraser_preview layer in canvas state`);
        const path = preview_layer.find(this.current_path_name);
        if (!path || !(path instanceof PathShape)) {
            throw new Error(`No path preview object '${this.current_path_name}' in preview layer`);
        }
        path.data = this.updateMovePath(path.data, e);
    }

    public PointerUp(ctx: CanvasState, e: PaintEvent): void {
        super.PointerUp(ctx, e);
        let brush = this.getPath(ctx);
        ctx.activateLayer.globalCompositeOperation = "source-over";
        // NOTE: Reset composite operation to default after erasing, 
        //       so that we wont change the composite operation of activated layer
        brush.globalCompositeOperation = "destination-out";
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

