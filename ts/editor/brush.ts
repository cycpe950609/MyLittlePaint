import Konva from "konva";
import { Line, type LineConfig } from "konva/lib/shapes/Line";
import { type CanvasInterfaceSettings, type CanvasSettingEntry, CanvasSettingType, DrawBase } from "../editorUI/canvas";
import { editorUIActions, editorUIData } from "../editorUI/data";
// import { PaintContext } from "./canvas";

class BrushCVSFunc extends DrawBase {

    Name = 'Brush';
    HistoryName = 'brush';
    Tip = 'Brush';
    ImgName = 'brush';
    CursorName = 'brush';
    BrushColor = '#00FF00';// 'rgb(0,255,0)';
    BrushWidth = 10;
    DrawFunction = (Ctx: Konva.Group, _width: number, _height: number) => {
        let brush = Ctx.find(`.${this.shapeID}`)
        let polygon = undefined;
        if (brush.length > 0) {
            polygon = brush[0]
        }
        else {
            polygon = new Konva.Line({
                name: this.shapeID,
                stroke: this.BrushColor,
                strokeWidth: this.BrushWidth,
                // round cap for smoother lines
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: this.CompositeOperation,
                points: [this.LastX, this.LastY, this.LastX, this.LastY]
            } as LineConfig);
            Ctx.add(polygon)
        }

        if (this.ifDrawing) {
            //console.log('Drawing...');
            let newPoints = (<Line>polygon).points().concat([this.NextX, this.NextY]);
            (<Line>polygon).points(newPoints);
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
