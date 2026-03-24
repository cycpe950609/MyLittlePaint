import { type CanvasBase, type CanvasInterfaceSettings, type CanvasSettingEntry, type PaintEvent, CanvasSettingType, ClickDrawBase, NoOPCVSFunc } from "../editorUI/canvas";
import { editorUIActions, editorUIData } from "../editorUI/data";
import { type FunctionInterface } from "../editorUI";
import { type NextFunctionState } from "../editorUI/interface/function";
import { type SubModeFunction } from "../editorUI/interface/mode";
import { returnMode } from "../editorUI/mode";
import SettingPageSidebar from "./setting";
import { btnResetRotate, btnResetScale, btnToggleTouch } from "./menu";
import { PathBase, PolygonBase } from "./canvas/shape/base";
import { AnyCanvas } from "./anycanvas";

export class CircleCVSFunc extends PolygonBase {
    Name = 'Circle';
    HistoryName = 'polygon-circle';
    ImgName = 'circle';
    Tip = 'Circle';
    DrawFunction = (Ctx: AnyCanvas.Layer, _width: number, _height: number) => {

        let circle = Ctx.find(this.shapeID)
        if (circle === undefined) {
            circle = new AnyCanvas.Shape.Circle({
                name: this.shapeID
            });
            Ctx.add(circle)
        }

        if (!(circle instanceof AnyCanvas.Shape.Circle)) {
            throw new Error("Polygon should be `Circle`")
        }


        if (this.ifDrawing) {
            // Ctx.destroyChildren();

            //Get radius
            let dx = this.NextX - this.LastX;
            let dy = this.NextY - this.LastY;
            let dst = Math.sqrt(dx * dx + dy * dy);

            circle.x = this.LastX;
            circle.y = this.LastY;
            circle.radius = dst;
            circle.fill = this.CanFilled ? this.ContentColor : 'transparent';
            circle.stroke = this.BorderBrush;
            circle.strokeWidth = this.BorderWidth;
        }
    };
}


export class LineCVSFunc extends PathBase {
    Name = 'Line';
    HistoryName = 'line';
    ImgName = 'line';
    Tip = 'Line';
    Path = "M ${startX} ${startY} L ${endX} ${endY}";
};

export class TriangleCVSFunc extends PathBase {
    Name = 'Triangle';
    HistoryName = 'polygon-triangle';
    ImgName = 'triangle';
    Tip = 'Triangle';
    Path = "M ${endX} ${endY} L ${startX} ${endY} L ${endX/2} ${startY} Z";
}

export class RectangleCVSFunc extends PathBase {
    Name = 'Rectangle';
    HistoryName = 'polygon-rectangle';
    ImgName = 'rectangle';
    Tip = 'Rectangle'
    Path = "M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY} L ${startX} ${endY} Z";
}

class btnExitDrawing implements FunctionInterface {
    Name: string = "Exit";
    ImgName?: string = "exit";
    Tip = "Finish Drawing";
    StartFunction = (_cvs: CanvasBase) => {
        if (window.editorUI.CenterCanvas.Function !== undefined)
            if (window.editorUI.CenterCanvas.Function.RightPointerUp !== undefined) {
                const fake_ev: PaintEvent = { X: -1, Y: -1, type: "mouse", pressure: 0 }
                window.editorUI.CenterCanvas.Function.RightPointerUp(fake_ev);
            }
        return {
            isChangeTo: false,
            finishSubMode: false,//Because we exit subMode at RightPointerUp, we don't need to finish subMode here
        } as NextFunctionState;
    };
}

export class btnPolygon implements FunctionInterface {
    Name: string = "Polygon";
    ImgName = "polygon";
    Tip = "Polygon";

    private draw_func: PolygonCVSFunc;
    constructor() {
        this.draw_func = new PolygonCVSFunc();
    }

    StartFunction = async (cvs: CanvasBase) => {
        cvs.Function = this.draw_func;
        return {
            isChangeTo: true,
            subMode: {
                clearToolbar: true,
                MenuToolbarRight: [
                    new btnResetScale(),
                    new btnResetRotate(),
                    new btnToggleTouch(),
                    new btnExitDrawing()
                ],
                RightToolbarTop: [new SettingPageSidebar()],
                EndMode: () => {
                    cvs.Function = new NoOPCVSFunc();
                }
            } as SubModeFunction
        } as NextFunctionState;
    };
}

export class PolygonCVSFunc extends ClickDrawBase {
    CursorName = 'crosshair';
    BorderBrush = '#FF0000';//'rgb(255,0,0)';
    BorderWidth = 2;
    ContentColor = '#FF000025';//'rgb(0,0,255)';
    CanFilled = true;
    Name = 'Polygon';
    HistoryName = 'polygon-polygon';
    ImgName = 'polygon';


    DrawFunction = (Ctx: AnyCanvas.Layer, _width: number, _height: number, angle: number) => {
        let shape = Ctx.find(this.shapeID)
        if (shape === undefined) {
            shape = new AnyCanvas.Shape.Path({
                name: this.shapeID
            });
            Ctx.add(shape)
        }
        if (!(shape instanceof AnyCanvas.Shape.Path)) {
            throw new Error("Polygon should be `Path`")
        }

        let radian = (-angle) * Math.PI / 180;
        let newDelta = this.rotatedDelta(radian);
        let new_dx = newDelta[0];
        let new_dy = newDelta[1];

        let drawPath = "M 0 0 ";
        this.points.forEach((point) => {
            let newPtDelta = this.rotatedDelta(radian, point[0], point[1]);
            let new_pt_dx = newPtDelta[0];
            let new_pt_dy = newPtDelta[1];
            let newPt = this.rotatedPoint(new_pt_dx, new_pt_dy, radian);
            drawPath += `L ${newPt[0]} ${newPt[1]} `;
        })
        let newNextPt = this.rotatedPoint(new_dx, new_dy, radian);
        if (this.ifDrawing && !this.isPointOut)// Only preview need render point of pointer
            drawPath += `L ${newNextPt[0]} ${newNextPt[1]} `;
        drawPath += "Z";
        shape.x = this.LastX;
        shape.y = this.LastY;
        shape.pathData = drawPath;
        shape.fill = this.CanFilled ? this.ContentColor : 'transparent';
        shape.stroke = this.BorderBrush
        shape.strokeWidth = this.BorderWidth
    };

    public RightPointerUp(e: PaintEvent): void {
        super.RightPointerUp(e);
        returnMode();//TODO : Add a better way to stop drawing Polygon
    }

    get Settings() {
        let rtv: CanvasInterfaceSettings = {
            Name: this.Name,
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
                ["CanFilled", {
                    type: CanvasSettingType.Boolean,
                    label: "Filled the content",
                    value: this.CanFilled
                }],
                ["ContentColor", {
                    type: CanvasSettingType.Color,
                    label: "Filled Color",
                    value: this.ContentColor
                }],
            ])
        };
        return rtv;
    }
    set Settings(setting: CanvasInterfaceSettings) {
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
        if (setting.Settings.get("ContentColor") !== undefined) {
            this.ContentColor = setting.Settings.get("ContentColor")?.value;
            refreshWindow = true;
        }
        if (setting.Settings.get("CanFilled") !== undefined) {
            this.CanFilled = setting.Settings.get("CanFilled")?.value;
            refreshWindow = true;
        }
        if (refreshWindow)
            editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "SettingsPage", new_func: null }));
    }
}