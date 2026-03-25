/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Brush Canvas Function     
 */

import { type CanvasInterfaceSettings, type CanvasSettingEntry, CanvasSettingType, DrawBase } from "../../editorUI/canvas";
import { editorUIActions, editorUIData } from "../../editorUI/data";
import AnyCanvas from "../anycanvas";


class BrushCVSFunc extends DrawBase {

    Name = 'Brush';
    HistoryName = 'brush';
    Tip = 'Brush';
    ImgName = 'brush';
    CursorName = 'brush';
    BrushColor = '#00FF00';// 'rgb(0,255,0)';
    BrushWidth = 10;
    DrawFunction = (Ctx: AnyCanvas.Layer, _rotate: number) => {
        let brush = Ctx.find(this.shapeID)
        if (brush === undefined) {
            brush = new AnyCanvas.Shape.Line({
                name: this.shapeID,
                stroke: this.BrushColor,
                strokeWidth: this.BrushWidth,
                // round cap for smoother lines
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: this.CompositeOperation,
                points: [this.LastX, this.LastY, this.LastX, this.LastY]
            });
            Ctx.add(brush)
        }

        if (!(brush instanceof AnyCanvas.Shape.Line))
            throw new Error(`Unexpected type, expect 'Line', got ${typeof brush}`)

        if (this.ifDrawing) {
            //console.log('Drawing...');
            let newPoints = brush.points.concat([this.NextX, this.NextY]);
            brush.points = newPoints;
        }

        [this.LastX, this.LastY] = [this.NextX, this.NextY];
    };

    CompositeOperation = <GlobalCompositeOperation>"source-over";
    get Settings() {
        let rtv: CanvasInterfaceSettings = {
            Name: "Brush",
            Settings: new Map<string, CanvasSettingEntry<any>>([
                ["BrushColor", {
                    type: CanvasSettingType.Color,
                    label: "Brush Color",
                    value: this.BrushColor
                }],
                ["BrushWidth", {
                    type: CanvasSettingType.Number,
                    label: "Brush Width",
                    info: [1, 64], // min,max
                    value: this.BrushWidth
                }]
            ])
        };
        return rtv;
    }
    set Settings(setting: CanvasInterfaceSettings) {
        if (setting.Settings === undefined)
            throw new Error("INTERNAL_ERROR: Settings are missing");
        let refreshWindow = false;
        if (setting.Settings.get("BrushColor") !== undefined) {
            this.BrushColor = setting.Settings.get("BrushColor")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("BrushWidth") !== undefined) {
            this.BrushWidth = setting.Settings.get("BrushWidth")?.value;
            refreshWindow = true;
        }
        if (refreshWindow)
            editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "SettingsPage", new_func: null }));
    }
};

export default BrushCVSFunc;
