/**
 * Created : 2026/04/02
 * Author  : Ting Fang, Tsai
 * About:
 *  Editing Tools Interface     
 */

import type { CanvasInterfaceSettings, PaintEvent } from "../../../editorUI/canvas";
import type { CanvasState } from "../../state/canvas/canvas";

export interface IEditable {
    CanFinishDrawing: boolean;
    CursorName?: string;
    /** Pointer events */
    PointerDown?: (ctx: CanvasState, e: PaintEvent) => void;
    PointerMove?: (ctx: CanvasState, e: PaintEvent) => void;
    PointerUp?: (ctx: CanvasState, e: PaintEvent) => void;
    /** Settings */
    ToolName: string;
    Settings?: CanvasInterfaceSettings;
    SettingsUpdate?: (ctx: CanvasState, rotDegree: number) => void;
    /** Lifecycle */
    StartEdit?: (ctx: CanvasState) => void;
    StopEdit?: (ctx: CanvasState) => void;
};

export class NoOPEditable implements IEditable {
    public CanFinishDrawing: boolean = true;
    public ToolName: string = "NoOP";
}