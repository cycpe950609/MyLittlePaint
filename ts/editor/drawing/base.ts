import { CanvasSettingType, DrawBase, type CanvasInterfaceSettings, type CanvasSettingEntry } from "../../editorUI/canvas";
import { editorUIActions, editorUIData } from "../../editorUI/data";
import Mexp from "math-expression-evaluator";
import AnyCanvas from "../anycanvas";

export class PolygonBase extends DrawBase {
    CursorName = 'crosshair';
    BorderBrush = '#FF0000';//'rgb(255,0,0)';
    BorderWidth = 5;
    ContentColor = '#0000FF';//'rgb(0,0,255)';
    CanFilled = false;
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


/* Path base polygon */
export class PathBase extends PolygonBase {
    Path = "";

    private isVar(entry: string): boolean {
        if (entry[0] === "$" && entry[1] === "{" && entry[entry.length - 1] === "}")
            return true;
        return false;
    }
    private validPath = () => {
        let splittedPath = this.Path.split(" ");
        let len = splittedPath.length;
        if (len <= 4)// at least "M ptX ptY Z"
            throw new Error("INTERNAL_ERROR: Path is too short");
        if (!(splittedPath[0] === "m" || splittedPath[0] === "M"))
            throw new Error("INTERNAL_ERROR: Path should start with M/m");
        if ((!this.isVar(splittedPath[1])) || (!this.isVar(splittedPath[2])))
            throw new Error("INTERNAL_ERROR: Start point is wrong");
        let idx = 3
        while (idx <= len - 2) {
            if (splittedPath[idx] === "L" || splittedPath[idx] === 'l') { // Line to
                if ((!this.isVar(splittedPath[idx + 1])) || (!this.isVar(splittedPath[idx + 2])))
                    throw new Error("INTERNAL_ERROR: LineTo point is wrong");
                idx += 3;
                continue;
            }
        }
    }

    DrawFunction = (Ctx: AnyCanvas.Layer, rotate: number) => {
        let path = Ctx.find(this.shapeID)
        if (path === undefined) {
            path = new AnyCanvas.Shape.Path({
                name: this.shapeID
            });
            Ctx.add(path)
        }

        if (!(path instanceof AnyCanvas.Shape.Path)) {
            throw new Error("Polygon should be `Path`")
        }

        this.validPath();

        if (this.ifDrawing) {
            let radian = (-rotate) * Math.PI / 180;
            let newDelta = this.rotatedDelta(radian);
            let new_dx = newDelta[0];
            let new_dy = newDelta[1];

            let operationParser = (operator: string, var1Str: string, var2Str: string): string => {
                let varname1 = var1Str.slice(2, var1Str.length - 1);
                let varname2 = var2Str.slice(2, var2Str.length - 1);
                let ptX = null, ptY = null;

                let oper2value = (varname: string) => {
                    const mexp = new Mexp();
                    let tokens = [
                        { type: 1/* tokenTypes.NUMBER */, value: 0, token: "startX", show: "startX", precedence: 0 /* preced[tokenTypes.NUMBER]*/ },
                        { type: 1/* tokenTypes.NUMBER */, value: 0, token: "startY", show: "startY", precedence: 0 /* preced[tokenTypes.NUMBER]*/ },
                        { type: 1/* tokenTypes.NUMBER */, value: new_dx, token: "endX", show: "endX", precedence: 0 /* preced[tokenTypes.NUMBER]*/ },
                        { type: 1/* tokenTypes.NUMBER */, value: new_dy, token: "endY", show: "endY", precedence: 0 /* preced[tokenTypes.NUMBER]*/ },
                    ];
                    let lexed = mexp.lex(varname, tokens);
                    let postfixed = mexp.toPostfix(lexed);
                    return mexp.postfixEval(postfixed, {});
                }

                ptX = oper2value(varname1)
                ptY = oper2value(varname2)
                let newPt = this.rotatedPoint(ptX, ptY, radian);

                return `${operator} ${newPt[0]} ${newPt[1]} `;
            }

            let drawPath = "";
            let splittedPath = this.Path.split(" ");
            let idx = 0
            while (idx <= splittedPath.length - 1) {
                switch (splittedPath[idx]) {
                    case "m": case "M":
                        drawPath += operationParser("M", splittedPath[idx + 1], splittedPath[idx + 2]);
                        idx += 3
                        break;
                    case "l": case "L":
                        drawPath += operationParser("L", splittedPath[idx + 1], splittedPath[idx + 2]);
                        idx += 3
                        break;
                    case "z": case "Z":
                        drawPath += "Z"
                        idx += 1;
                        break;
                    default:
                        break;
                }
            }

            path.x = this.LastX;
            path.y = this.LastY;
            path.pathData = drawPath;
            path.fill = this.CanFilled ? this.ContentColor : 'transparent';
            path.stroke = this.BorderBrush
            path.strokeWidth = this.BorderWidth
        }
    }

    get Settings() {
        let settings: ([string, CanvasSettingEntry<any>])[] = [
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
        ]
        const isPathClosed: boolean = this.Path.includes(' z') || this.Path.includes(' Z');
        if (isPathClosed) {
            settings.push(["CanFilled", {
                type: CanvasSettingType.Boolean,
                label: "Filled the content",
                value: this.CanFilled,
            }])
            settings.push(
                ["ContentColor", {
                    type: CanvasSettingType.Color,
                    label: "Filled Color",
                    value: this.ContentColor
                }]
            )
        }

        let rtv: CanvasInterfaceSettings = {
            Name: this.Name,
            Settings: new Map<string, CanvasSettingEntry<any>>(settings)
        };
        return rtv;
    }
    set Settings(setting: CanvasInterfaceSettings) {
        super.Settings = setting;
    }
}
