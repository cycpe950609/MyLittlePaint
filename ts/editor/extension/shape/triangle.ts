/**
 * Created : 2026/04/03
 * Author  : Ting Fang, Tsai
 * About:
 *     
 */

import type { PaintEvent } from "../../../editorUI/canvas";
import type { Point } from "../../state/canvas/data/object";
import { rotateAround } from "../../utils/coordinate";
import { PathCommandType, PathEditable, type SVGPathCommand } from "./path";

export class TriangleEditable extends PathEditable {
    ToolName = "Triangle";
    public CanFinishDrawing: boolean = true;
    protected is_closed_path: boolean = true;

    private buildTriangleData(from: Point, to: Point, rotDegree: number): SVGPathCommand[] {
        const new_bbox_size = rotateAround(
            { x: to.x - from.x, y: to.y - from.y }, // old bbox size
            { x: 0, y: 0 }, // cornerLT
            -rotDegree,
        );
        const cornerRT = rotateAround({ x: from.x + new_bbox_size.x, y: from.y }, from, rotDegree);
        const cornerLB = rotateAround({ x: to.x - new_bbox_size.x, y: to.y }, to, rotDegree);
        return [
            { type: PathCommandType.M, x: from.x, y: from.y },
            { type: PathCommandType.L, x: cornerRT.x, y: cornerRT.y },
            { type: PathCommandType.L, x: (cornerLB.x + to.x) / 2, y: (cornerLB.y + to.y) / 2 },
            { type: PathCommandType.Z },
        ]
    }

    protected updatePath(path: SVGPathCommand[], e: PaintEvent): SVGPathCommand[] {
        if (path[0].type !== PathCommandType.M)
            throw new Error("INTERNAL_ERROR: Invalid path data for triangle");
        const start_point: Point = { x: path[0].x, y: path[0].y };
        const current_point: Point = { x: e.X, y: e.Y };
        return this.buildTriangleData(start_point, current_point, e.rotDegree);
    }


}
