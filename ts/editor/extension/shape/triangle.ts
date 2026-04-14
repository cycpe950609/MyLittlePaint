/**
 * Created : 2026/04/03
 * Author  : Ting Fang, Tsai
 * About:
 *     
 */

import { CanvasSettingType, type CanvasInterfaceSettings, type PaintEvent } from "../../../editorUI/canvas";
import type { CanvasState } from "../../state/canvas/canvas";
import type { Point } from "../../state/canvas/data/object";
import { rotateAround } from "../../utils/coordinate";
import { PathCommandType, PathEditable, type SVGPathCommand } from "./path";

const TriangleDrawingMethod: string[] = [
    "Isosceles (Horizontal Base)", // 等腰三角形
    "Isosceles (Vertical Base)", // 等腰三角形
    "Right Angled", // 直角三角形
];
export class TriangleEditable extends PathEditable {
    ToolName = "Triangle";
    public CanFinishDrawing: boolean = true;
    protected is_closed_path: boolean = true;
    private drawing_method_index: number = 0;
    private draw_from_center: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };

    private buildTriangleData(from: Point, to: Point, rotDegree: number, methodIndex: number, fromCenter: boolean): SVGPathCommand[] {
        const start = fromCenter ? { x: from.x - (to.x - from.x), y: from.y - (to.y - from.y) } : from;
        const end = to;
        const new_bbox_size = rotateAround(
            { x: end.x - start.x, y: end.y - start.y }, // old bbox size
            { x: 0, y: 0 }, // cornerLT
            -rotDegree,
        );
        const cornerLT = start;
        const cornerRT = rotateAround({ x: cornerLT.x + new_bbox_size.x, y: cornerLT.y }, cornerLT, rotDegree);
        const cornerRB = end;
        const cornerLB = rotateAround({ x: cornerRB.x - new_bbox_size.x, y: cornerRB.y }, cornerRB, rotDegree);
        switch (methodIndex) {
            case 0: { // Isosceles (Horizontal Base)
                return [
                    { type: PathCommandType.M, x: cornerLT.x, y: cornerLT.y },
                    { type: PathCommandType.L, x: cornerRT.x, y: cornerRT.y },
                    { type: PathCommandType.L, x: (cornerLB.x + cornerRB.x) / 2, y: (cornerLB.y + cornerRB.y) / 2 },
                    { type: PathCommandType.Z },
                ]
            }
            case 1: {
                // Isosceles (Vertical Base)
                return [
                    { type: PathCommandType.M, x: cornerLT.x, y: cornerLT.y },
                    { type: PathCommandType.L, x: cornerLB.x, y: cornerLB.y },
                    { type: PathCommandType.L, x: (cornerRT.x + cornerRB.x) / 2, y: (cornerRT.y + cornerRB.y) / 2 },
                    { type: PathCommandType.Z },
                ]
            }
            case 2: {
                // Right Angled
                return [
                    { type: PathCommandType.M, x: cornerLT.x, y: cornerLT.y },
                    { type: PathCommandType.L, x: cornerRT.x, y: cornerRT.y },
                    { type: PathCommandType.L, x: cornerLB.x, y: cornerLB.y },
                    { type: PathCommandType.Z },
                ]
            }
            default:
                throw new Error(`Invalid triangle drawing method index: ${methodIndex}`);
        }

    }
    public PointerDown(ctx: CanvasState, e: PaintEvent): void {
        this.startPoint = { x: e.X, y: e.Y };
        super.PointerDown(ctx, e);
    }

    protected updatePath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        if (path[0].type !== PathCommandType.M)
            throw new Error("INTERNAL_ERROR: Invalid path data for triangle");
        const current_point: Point = { x: e.X, y: e.Y };
        return this.buildTriangleData(this.startPoint, current_point, e.rotDegree, this.drawing_method_index, this.draw_from_center);
    }
    public get Settings() {
        const rtv = super.Settings;
        rtv.Settings?.set("DrawFromCenter", {
            type: CanvasSettingType.Boolean,
            label: "Draw from center",
            value: this.draw_from_center,
        });
        rtv.Settings?.set("DrawingMethod", {
            type: CanvasSettingType.DropDownList,
            label: "Drawing Method",
            info: {
                options: TriangleDrawingMethod,
                defaultIdx: 0
            },
            value: this.drawing_method_index,
        });
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        super.Settings = setting;
        let refreshWindow = false;
        if (setting.Settings.get("DrawFromCenter") !== undefined) {
            this.draw_from_center = setting.Settings.get("DrawFromCenter")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("DrawingMethod") !== undefined) {
            this.drawing_method_index = setting.Settings.get("DrawingMethod")?.value;
            refreshWindow = true;
        }
        if (refreshWindow) window.editorUI.forceRerender();
    }


}
