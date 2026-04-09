/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Polygon Canvas Function
 */

import type EditorUI from "../../../editorUI";
import type { CanvasBase, PaintEvent } from "../../../editorUI/canvas";
import type { NextFunctionState } from "../../../editorUI/interface/function";
import type { SubModeFunction } from "../../../editorUI/interface/mode";
import { returnMode } from "../../../editorUI/mode";
import { EditorCanvas } from "../../canvas";
import type { CanvasState } from "../../state/canvas/canvas";
import { PathCommandType, PathEditable, PathShape, type SVGPathCommand } from "./path";

class btnExitDrawing implements EditorUI.Interface.Function {
    Name: string = "Exit";
    ImgName?: string = "exit";
    Tip = "Finish Drawing";
    StartFunction = (cvs: CanvasBase) => {
        if (!(cvs instanceof EditorCanvas))
            throw new Error(`Unexpected canvas type '${typeof cvs}'`);
        cvs.stopEdit();
        return {
            isChangeTo: false,
            finishSubMode: true,
        } as NextFunctionState;
    };
}

export class btnPolygon implements EditorUI.Interface.Function {
    Name: string = "Polygon";
    ImgName = "polygon";
    Tip = "Polygon";

    StartFunction = async (cvs: CanvasBase) => {
        if (!(cvs instanceof EditorCanvas))
            throw new Error(`Unexpected canvas type '${typeof cvs}'`);
        if (cvs.editingName === "polygon") return { isChangeTo: false } as NextFunctionState;
        cvs.startEdit("polygon");
        console.log("Start Polygon mode");
        return {
            isChangeTo: true,
            subMode: {
                clearToolbar: false,
                MenuToolbarRight: [
                    new btnExitDrawing()
                ],
            } as SubModeFunction
        } as NextFunctionState;
    };
}

export class PolygonEditable extends PathEditable {
    ToolName = "Polygon";
    public CanFinishDrawing: boolean = false;
    protected is_closed_path: boolean = true;

    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        if (!ctx.activateLayer.has(this.current_path_name))
            super.PointerDown(ctx, e);
        const pathShape = this.getPath(ctx);
        pathShape.data = this.updateDownPath(pathShape.data, e);
    }
    protected createPath(name: string, e: PaintEvent): PathShape {
        return new PathShape(name, {
            data: [{ type: PathCommandType.M, x: e.X, y: e.Y }, { type: PathCommandType.Z }],
            stroke: this.BorderBrush,
            strokeWidth: this.BorderWidth,
            fill: this.CanFilled ? this.ContentColor : undefined,
            globalCompositeOperation: "source-over",
        });
    }
    protected updateDownPath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        // Add a LineTo command to the path data
        console.log("Down", path)
        const new_command: SVGPathCommand = {
            type: PathCommandType.L,
            x: e.X,
            y: e.Y
        };
        return [...path.slice(0, -1), new_command, { type: PathCommandType.Z }];
    }

    protected updateMovePath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        // Update last command to current pointer position
        if (path.length < 2) throw new Error("Path data should not less than 2 when updating move path.");
        const last_command = path[path.length - 2];
        if (last_command.type !== PathCommandType.L) throw new Error(`Last command should be LineTo when updating move path, but got ${last_command.type}`);

        const updated_command: SVGPathCommand = {
            type: PathCommandType.L,
            x: e.X,
            y: e.Y
        };
        return [...path.slice(0, -2), updated_command, { type: PathCommandType.Z }];
    }
    protected updateUpPath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        // Update last command to current pointer position
        if (path.length < 2) throw new Error("Path data should not less than 2 when updating move path.");
        const last_command = path[path.length - 2];
        if (last_command.type !== PathCommandType.L) throw new Error(`Last command should be LineTo when updating move path, but got ${last_command.type}`);

        const updated_command: SVGPathCommand = {
            type: PathCommandType.L,
            x: e.X,
            y: e.Y
        };
        return [...path.slice(0, -2), updated_command, { type: PathCommandType.Z }];
    }
    public StopEdit(_ctx: CanvasState): void {
        returnMode();
    }
}