import { CanvasSettingType, type CanvasInterfaceSettings } from "../../../editorUI/canvas";
import type { BoundingBox } from "../../layer/render/render";
import type { CanvasState } from "../../state/canvas/canvas";
import { Layer } from "../../state/canvas/data/layer";
import { objAttr } from "../../state/canvas/data/object";
import { rotateAround } from "../../utils/coordinate";
import type { Point } from "../../utils/misc";
import { ShapeBase, ShapeBaseEditable, ShapeBaseRender, type ShapeBaseConfig } from "./base";
import { LineShape } from "./line";


export class ClosedShapeBaseEditable extends ShapeBaseEditable {
    public CanFinishDrawing: boolean = true;
    protected ContentColor = '#0000FF'; //'rgb(0,0,255)';
    protected CanFilled = false;
    public get Settings() {
        const rtv = super.Settings;
        rtv.Settings?.set("CanFilled", {
            type: CanvasSettingType.Boolean,
            label: "Filled the content",
            value: this.CanFilled,
        });
        rtv.Settings?.set("ContentColor", {
            type: CanvasSettingType.Color,
            label: "Filled Color",
            value: this.ContentColor,
        });
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        super.Settings = setting;
        let refreshWindow = false;
        if (setting.Settings.get("ContentColor") !== undefined) {
            this.ContentColor = setting.Settings.get("ContentColor")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("CanFilled") !== undefined) {
            this.CanFilled = setting.Settings.get("CanFilled")?.value;
            refreshWindow = true;
        }
        if (refreshWindow) window.editorUI.forceRerender();
    }

    protected drawPreviewBBox(ctx: CanvasState, bbox: BoundingBox, rotDegree: number): void {
        const final_cornerLT = bbox.cornerLT;
        const final_cornerRT = rotateAround({ x: bbox.cornerLT.x + bbox.size.width, y: bbox.cornerLT.y }, bbox.cornerLT, rotDegree);
        const final_cornerRB = rotateAround({ x: bbox.cornerLT.x + bbox.size.width, y: bbox.cornerLT.y + bbox.size.height }, bbox.cornerLT, rotDegree);
        const final_cornerLB = rotateAround({ x: bbox.cornerLT.x, y: bbox.cornerLT.y + bbox.size.height }, bbox.cornerLT, rotDegree);

        if (!ctx.has("preview_bbox_layer")) ctx.add(new Layer("preview_bbox_layer", { zIndex: 100 }));
        const preview_layer = ctx.find("preview_bbox_layer");
        if (!preview_layer) throw new Error(`No preview layer in canvas state found`);

        const BBoxStrokeWidth = 2;

        const updateCross = (c: Point, name: string) => {
            if (!preview_layer.has(`${name}_bbox_center_vertical`)) preview_layer.add(new LineShape(`${name}_bbox_center_vertical`, { strokeWidth: BBoxStrokeWidth, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }));
            if (!preview_layer.has(`${name}_bbox_center_horizontal`)) preview_layer.add(new LineShape(`${name}_bbox_center_horizontal`, { strokeWidth: BBoxStrokeWidth, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }));

            const vertical_line = preview_layer.find(`${name}_bbox_center_vertical`);
            if (vertical_line === undefined || !(vertical_line instanceof LineShape)) throw new Error(`No vertical line for ${name} in preview layer`);
            vertical_line.start = rotateAround({ x: c.x, y: c.y - 10 }, { x: c.x, y: c.y }, rotDegree);
            vertical_line.end = rotateAround({ x: c.x, y: c.y + 10 }, { x: c.x, y: c.y }, rotDegree);

            const horizontal_line = preview_layer.find(`${name}_bbox_center_horizontal`);
            if (horizontal_line === undefined || !(horizontal_line instanceof LineShape)) throw new Error(`No horizontal line for ${name} in preview layer`);
            horizontal_line.start = rotateAround({ x: c.x - 10, y: c.y }, { x: c.x, y: c.y }, rotDegree);
            horizontal_line.end = rotateAround({ x: c.x + 10, y: c.y }, { x: c.x, y: c.y }, rotDegree);
        }
        const updateCorner = (c: Point, name: string, extraDegree: number) => {
            // Draw a LT corner: ⌜, rotated for another corner
            if (!preview_layer.has(`${name}_bbox_center_vertical`)) preview_layer.add(new LineShape(`${name}_bbox_center_vertical`, { strokeWidth: BBoxStrokeWidth, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }));
            if (!preview_layer.has(`${name}_bbox_center_horizontal`)) preview_layer.add(new LineShape(`${name}_bbox_center_horizontal`, { strokeWidth: BBoxStrokeWidth, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }));

            const vertical_line = preview_layer.find(`${name}_bbox_center_vertical`);
            if (vertical_line === undefined || !(vertical_line instanceof LineShape)) throw new Error(`No vertical line for ${name} in preview layer`);
            vertical_line.start = rotateAround({ x: c.x + 10, y: c.y }, c, rotDegree + extraDegree);
            vertical_line.end = rotateAround({ x: c.x - BBoxStrokeWidth / 2, y: c.y }, c, rotDegree + extraDegree);

            const horizontal_line = preview_layer.find(`${name}_bbox_center_horizontal`);
            if (horizontal_line === undefined || !(horizontal_line instanceof LineShape)) throw new Error(`No horizontal line for ${name} in preview layer`);
            horizontal_line.start = rotateAround({ x: c.x, y: c.y + 10 }, { x: c.x, y: c.y }, rotDegree + extraDegree);
            horizontal_line.end = { x: c.x, y: c.y };
        }
        const updateEdge = (c: Point, name: string, extraDegree: number) => {
            // Draw a horizontal edge: ─, rotated for vertical edge
            if (!preview_layer.has(`${name}_bbox_edge`)) preview_layer.add(new LineShape(`${name}_bbox_edge`, { strokeWidth: BBoxStrokeWidth, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }));
            const edge_line = preview_layer.find(`${name}_bbox_edge`);
            if (edge_line === undefined || !(edge_line instanceof LineShape)) throw new Error(`No edge line for ${name} in preview layer`);
            edge_line.start = rotateAround({ x: c.x - 10, y: c.y }, { x: c.x, y: c.y }, rotDegree + extraDegree);
            edge_line.end = rotateAround({ x: c.x + 10, y: c.y }, { x: c.x, y: c.y }, rotDegree + extraDegree);
        }

        updateCorner(final_cornerLT, "cornerLT", 0);
        updateCorner(final_cornerRT, "cornerRT", -90);
        updateCorner(final_cornerRB, "cornerRB", -180);
        updateCorner(final_cornerLB, "cornerLB", -270);
        updateEdge({ x: (final_cornerLT.x + final_cornerRT.x) / 2, y: (final_cornerLT.y + final_cornerRT.y) / 2 }, "edge_top", 0);
        updateEdge({ x: (final_cornerRT.x + final_cornerRB.x) / 2, y: (final_cornerRT.y + final_cornerRB.y) / 2 }, "edge_right", -90);
        updateEdge({ x: (final_cornerRB.x + final_cornerLB.x) / 2, y: (final_cornerRB.y + final_cornerLB.y) / 2 }, "edge_bottom", -180);
        updateEdge({ x: (final_cornerLB.x + final_cornerLT.x) / 2, y: (final_cornerLB.y + final_cornerLT.y) / 2 }, "edge_left", -270);
        updateCross({ x: (final_cornerLT.x + final_cornerRB.x) / 2, y: (final_cornerLT.y + final_cornerRB.y) / 2 }, "center");
    }
}
export class ClosedShapeBaseRender<DATATYPE extends ClosedShapeBase<any>> extends ShapeBaseRender<DATATYPE> {
    render(ctx: OffscreenCanvasRenderingContext2D, data: DATATYPE): void {
        ctx.save();
        ctx.beginPath();
        ctx.globalCompositeOperation = data.globalCompositeOperation;
        ctx.fillStyle = data.fill || 'transparent';
        ctx.strokeStyle = data.stroke || '#000000';
        ctx.lineWidth = data.strokeWidth || 1.0;
        this.render_shape(ctx, data);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

export class ClosedShapeBase<ShapeConfig extends ClosedShapeBaseConfig> extends ShapeBase<ShapeConfig> {
    CursorName = 'crosshair';
    protected valid_and_init_config(config: ShapeConfig): Required<ShapeConfig> {
        return {
            ...super.valid_and_init_config(config),
            fill: config.fill ?? 'transparent',
        } as Required<ShapeConfig>;
    }

    @objAttr("fill")
    declare public fill: string | CanvasGradient;
}

export interface ClosedShapeBaseConfig extends ShapeBaseConfig {
    fill?: string | CanvasGradient;
}
