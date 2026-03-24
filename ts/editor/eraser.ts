import { type CanvasInterfaceSettings, type CanvasSettingEntry, CanvasSettingType, DrawBase } from "../editorUI/canvas";
import { editorUIActions, editorUIData } from "../editorUI/data";
import { AnyCanvas } from "./anycanvas";
// import { PaintContext } from "./canvas";

class EraserCVSFunc extends DrawBase {
    Name = 'Eraser';
    HistoryName = 'eraser';
    Tip = 'Eraser';
    ImgName = 'eraser';
    CursorName = 'eraser';
    BrushWidth = 10;
    BrushColor = 'white';
    DrawFunction = (Ctx: AnyCanvas.Layer, _width: number, _height: number) => {
        let eraser = Ctx.find('prev-brush')
        if (eraser === undefined) {
            eraser = new AnyCanvas.Shape.Line({
                name: "prev-brush",
                stroke: this.BrushColor,
                strokeWidth: this.BrushWidth,
                // round cap for smoother lines
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: this.CompositeOperation,
                points: [this.LastX, this.LastY, this.LastX, this.LastY]
            });
            Ctx.add(eraser)
        }

        if (!(eraser instanceof AnyCanvas.Shape.Line))
            throw new Error(`Unexpected type, expect 'Line', got ${typeof eraser}`)


        if (this.ifDrawing) {
            //console.log('Drawing...');
            let newPoints = eraser.points.concat([this.NextX, this.NextY]);
            eraser.points = newPoints;
        }

        [this.LastX, this.LastY] = [this.NextX, this.NextY];
    };
    CompositeOperation = <GlobalCompositeOperation>"destination-out"
    get Settings() {
        let rtv: CanvasInterfaceSettings = {
            Name: "Eraser",
            Settings: new Map<string, CanvasSettingEntry<any>>([
                ["BrushWidth", {
                    type: CanvasSettingType.Number,
                    label: "Eraser Width",
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
        if (setting.Settings.get("BrushWidth") !== undefined) {
            this.BrushWidth = setting.Settings.get("BrushWidth")?.value;
            refreshWindow = true;
        }
        if (refreshWindow)
            editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "SettingsPage", new_func: null }));
    }
};

export default EraserCVSFunc;