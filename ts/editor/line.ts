import Konva from "konva";
import { type LineConfig } from "konva/lib/shapes/Line";
// import { PaintContext } from "./canvas";
import { type CanvasInterfaceSettings, type CanvasSettingEntry, CanvasSettingType, DrawBase } from "../editorUI/canvas";
import { editorUIActions, editorUIData } from "../editorUI/data";

class LineCVSFunc extends DrawBase {
    Name = 'Line';
    HistoryName = 'line';
    Tip = 'Line';
    ImgName = 'line';
    CursorName = 'crosshair';
    BrushColor = '#00FF00';//'rgb(0,255,0)';
    BrushWidth = 10;
    DrawFunction = (Ctx: Konva.Group, width: number, height: number) => {

        let circle = Ctx.find('.prev-line')
        let polygon = undefined;
        if (circle.length > 0) {
            polygon = circle[0]
        }
        else {
            polygon = new Konva.Line({
                name: "prev-line"
            } as LineConfig);
            Ctx.add(polygon)
        }


        if (this.ifDrawing) {
            polygon.setAttr("stroke", this.BrushColor);
            polygon.setAttr("strokeWidth", this.BrushWidth);
            // round cap for smoother lines
            polygon.setAttr("lineCap", 'round');
            polygon.setAttr("lineJoin", 'round');
            polygon.setAttr("globalCompositeOperation", this.CompositeOperation);
            // add point twice, so we have some drawings even on a simple click
            polygon.setAttr("points", [this.LastX, this.LastY, this.NextX, this.NextY]);
        }

    };
    CompositeOperation = <GlobalCompositeOperation>"source-over"
    get Settings() {
        let rtv: CanvasInterfaceSettings = {
            Name: "Line",
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

export default LineCVSFunc;