/**
 * Created : 2026/04/01
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass for `Shape` extension    
 */
import { CanvasSettingType, type CanvasInterfaceSettings, type CanvasSettingEntry } from "../../../editorUI/canvas";
import { editorUIActions, editorUIData } from "../../../editorUI/data";
import type { IEditable } from "../../editing/interface/editable";
import { ObjectRender } from "../../layer/render/render";
import { objAttr, ObjectBase, type ObjectBaseConfig } from "../../state/canvas/data/object";

export interface ShapeBaseConfig extends ObjectBaseConfig {
    stroke?: string | CanvasGradient;
    strokeWidth?: number;
}

export class ShapeBase<ShapeConfig extends ShapeBaseConfig> extends ObjectBase<ShapeConfig> {
    protected valid_and_init_config(config: ShapeConfig): Required<ShapeConfig> {
        return {
            ...super.valid_and_init_config(config),
            stroke: config.stroke ?? '#000000',
            strokeWidth: config.strokeWidth ?? 1,
        } as Required<ShapeConfig>;
    }

    @objAttr("stroke")
    declare public stroke: string | CanvasGradient;

    @objAttr("strokeWidth")
    declare public strokeWidth: number;
}
export class ShapeBaseRender<DATATYPE extends ShapeBase<any>> extends ObjectRender<DATATYPE> {
    render(ctx: OffscreenCanvasRenderingContext2D, data: DATATYPE): void {
        ctx.save();
        ctx.beginPath();
        ctx.globalCompositeOperation = data.globalCompositeOperation;
        ctx.strokeStyle = data.stroke || '#000000';
        ctx.lineWidth = data.strokeWidth || 1.0;
        this.render_shape(ctx, data);
        ctx.stroke();
        ctx.restore();
    }
    protected render_shape(_ctx: OffscreenCanvasRenderingContext2D, _data: DATATYPE): void {
        throw new Error(`${this.constructor.name}.render_shape not implemented`)
    }
}
export class ShapeBaseEditable implements IEditable {
    CursorName = 'crosshair';
    ToolName = 'Shape';
    public CanFinishDrawing: boolean = true;
    // Settings for opened shape
    protected BorderBrush = '#FF0000';//'rgb(255,0,0)';
    protected BorderWidth = 5;
    public get Settings() {
        let rtv: CanvasInterfaceSettings = {
            Name: this.ToolName || "Shape",
            Settings: new Map<string, CanvasSettingEntry<any>>([
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
            ])
        };
        return rtv;
    }
    public set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        let refreshWindow = false;
        if (setting.Settings.get("BorderBrush") !== undefined) {
            this.BorderBrush = setting.Settings.get("BorderBrush")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("BorderWidth") !== undefined) {
            this.BorderWidth = setting.Settings.get("BorderWidth")?.value;
            refreshWindow = true;
        }
        // TODO: Remove manually update sidebar window after settings changed, find a better way to update the settings page
        if (refreshWindow)
            editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "SettingsPage", new_func: null }));
    }
};


