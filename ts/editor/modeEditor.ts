import {
    NoOPCVSFunc,
    type CanvasBase,
    type CanvasInterface,
    type PaintEvent,
    type CanvasInterfaceSettings,
} from "../editorUI/canvas";
import Dialog from "../editorUI/dialog";
import type { ModeFunction, FunctionInterface } from "../editorUI";
import {
    BUTTON,
    DIV,
    SPAN,
    TEXT
} from "../editorUI/util/HTMLElement";
import {
    btnClear,
    btnRedo,
    btnResetPosition as btnResetPosition,
    btnResetRotate,
    btnResetScale,
    btnSave,
    btnToggleTouch,
    btnUndo,
} from "./menu";
import { TipComponent } from "../editorUI/statusbar";
import interact from "interactjs";
import LayerMgrSidebar, { LayerManager, LayerInfo } from './layer';
import SettingPageSidebar from "./setting";
import HistoryManager from "./historyLogger";
import { type setValueFunctionType, useProvider } from "../editorUI/util/useHook";
import { type NextFunctionState } from "../editorUI/interface/function";
import { btnPolygon } from "./drawing/polygon";
import { convertViewToCanvas, degreeToRadian } from "./anycanvas/cvs/coordinate";


export class btnCanvas implements FunctionInterface {
    Name: string;
    ImgName?: string | undefined;
    Tip?: string | (() => string) | undefined;

    private loadModule: () => Promise<CanvasInterface>;
    constructor(name: string, imgName: string, tip: string, loadModule: () => Promise<CanvasInterface>) {
        this.Name = name;
        this.ImgName = imgName;
        this.Tip = tip;
        this.loadModule = loadModule;
    }

    private draw_func?: CanvasInterface;
    StartFunction = async (cvs: CanvasBase) => {
        if (this.draw_func == undefined)
            this.draw_func = await this.loadModule();
        cvs.Function = this.draw_func;
        return { isChangeTo: true } as NextFunctionState;
    };
}

declare global {
    interface Touch {
        touchType: string;
    }
}

export class EditorCanvas implements CanvasBase {
    name = "EditorCanvas";

    private cnt !: HTMLDivElement;
    public LayerManager: LayerManager;
    private draw_func: CanvasInterface = new NoOPCVSFunc();
    private EventFired: boolean = false;
    private isPointOut?: PaintEvent = undefined;

    private width: number;
    private height: number;

    public isUpdate: boolean = false;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.scaleTip = window.editorUI.Statusbar.addTip("", true);
        this.refreshScaleTip(0, 1);
        this.cnt = DIV("w-full h-full");
        this.LayerManager = new LayerManager(this.cnt, window.innerWidth, window.innerHeight);

        //NOTE : Testing
        this.LayerManager.addLayerAfter();
        this.LayerManager.addLayerAfter();
        this.LayerManager.addLayerAfter();
        this.LayerManager.addLayerAfter();
    }
    update?: ((time: number) => void) | undefined;

    private historyMgr: HistoryManager = new HistoryManager();
    public undo = () => {// Ctrl-Z
        let undoLst = this.historyMgr.undo();
        if (undoLst.length === 0) throw new Error("INTERNAL_ERROR: Undo list is empty");
        undoLst.forEach((entry) => {
            if (entry.paintToolName === "noop") return;
            let polygon = this.LayerManager.Canvas.find(entry.shapeName)
            if (polygon.length === 0) throw new Error("INTERNAL_ERROR: Shape not found");
            polygon.forEach((shape) => {
                shape.hide();
            })
        })
        // editorUIData.dispatch(editorUIActions.sidebar_window.update({id: "LayerMgrSidebar", new_func: null}));
    };
    public redo = () => { // Ctrl-Y
        let redoLst = this.historyMgr.redo();
        if (redoLst.length === 0) throw new Error("INTERNAL_ERROR: Redo list is empty");
        redoLst.forEach((entry) => {
            if (entry.paintToolName === "noop") return;
            let polygon = this.LayerManager.Canvas.find(entry.shapeName)
            if (polygon.length === 0) throw new Error("INTERNAL_ERROR: Shape not found");
            polygon.forEach((shape) => {
                shape.show();
            })
        })
        // editorUIData.dispatch(editorUIActions.sidebar_window.update({id: "LayerMgrSidebar", new_func: null}));
    };
    private finishDrawing() {
        // console.log("[DEB] Finish Drawing ...");
        const diff = this.LayerManager.Layer.diff();
        const neededRemoveShapeLst = this.historyMgr.redoList;//Redo List is a list of HistoryLogEntry<any>[]
        console.log("[DEB] Needed Remove Shape List: ", neededRemoveShapeLst)
        neededRemoveShapeLst.forEach((shapeList) => {
            shapeList.forEach((entry) => {
                // console.log("[DEB] Needed Remove Shape : ", entry.shapeName)
                let polygon = this.LayerManager.Canvas.find(entry.shapeName)
                if (polygon.length === 0) throw new Error("INTERNAL_ERROR: Shape not found");
                polygon.forEach((shape) => {
                    shape.clear();
                })
            })
        })
        this.historyMgr.add(diff);

        this.LayerManager.Layer.flush();
        this.EventFired = false;
        this.isDrawing = false;
        this.isPointOut = undefined;
        this.setLayerInfoList(this.LayerManager.LayerList);
    }
    private initCanvas = () => {
        this.LayerManager.clear();
        this.LayerManager.Canvas.View.viewAt({ x: 0, y: 0 }, 0, 1.0);
    };
    private dragMoveListener = (event: Interact.GestureEvent, _target: HTMLElement, angleScale: { angle: number, scale: number }) => {
        // console.log("[DEB] dragMoveListener : ",event)
        // keep the dragged position in the data-x/data-y attributes
        this.LayerManager.Canvas.View.viewUp(event.dx);
        this.LayerManager.Canvas.View.viewRight(event.dy);
        this.refreshScaleTip(angleScale.angle, angleScale.scale);
    }
    private isDrawing: boolean = false;
    private isDrawRotate: boolean = true;
    // @ts-ignore
    private layerInfoList: LayerInfo[] = [];
    private setLayerInfoList: setValueFunctionType = () => { }
    attachCanvas(container: HTMLDivElement) {
        this.LayerManager.resize(window.innerWidth, window.innerHeight);
        console.log("[HOK] Canvas Size ", this.width, this.height);

        let interactCVS = interact(this.cnt, {
            styleCursor: false
        });

        var startAngle = 0;
        var startScale = 1;
        let gestureStart = (e: Interact.GestureEvent) => {
            console.log(`[DEB] isDrawing GestureStart ${isDrawing}`)
            if (isDrawing) return;
            console.log(
                `[CVS] Gesture start scale:${e.scale}, angle: ${e.angle}`
            );
            e.preventDefault();
            e.stopPropagation();
            startAngle = this.LayerManager.Canvas.View.RotationDegree - e.angle;
            startScale = e.scale;
            this.cnt.classList.remove("reset");
        }
        let gestureMove = (e: Interact.GestureEvent) => {
            console.log(`[DEB] isDrawing GestureMove ${isDrawing}`)
            if (isDrawing) return;
            console.log(
                `[CVS] Gesture move scale:${e.ds}, angle: ${e.da}`
            );
            this.LayerManager.Canvas.View.viewRotDegAt(e.angle + startAngle);
            this.LayerManager.Canvas.View.viewScaleAt(e.scale * startScale);
            this.dragMoveListener(e, this.cnt, { angle: this.LayerManager.Canvas.View.RotationDegree, scale: this.LayerManager.Canvas.View.Scale });
            e.preventDefault();
            e.stopPropagation();
        }
        let gestureEnd = (e: Interact.GestureEvent) => {
            if (isDrawing) return;
            console.log(
                `[CVS] Gesture end scale:${e.scale}, angle: ${e.angle}`
            );
            this.LayerManager.Canvas.View.viewRotDegAt(e.angle + startAngle);
            this.LayerManager.Canvas.View.viewScaleAt(e.scale * startScale);
            e.preventDefault();
            e.stopPropagation();
        }
        let dragMove = (e: Interact.GestureEvent) => {
            if (!isDrawing && this.isPointOut === undefined)
                this.dragMoveListener(e, this.cnt, { angle: this.LayerManager.Canvas.View.RotationDegree, scale: this.LayerManager.Canvas.View.Scale })
        }
        let pointOut = (e: Interact.PointerEvent) => {
            let new_x_wo_rot = (e.offsetX - this.LayerManager.Canvas.View.Center.x) / this.LayerManager.Canvas.View.Scale;
            let new_y_wo_rot = (e.offsetY - this.LayerManager.Canvas.View.Center.y) / this.LayerManager.Canvas.View.Scale;
            let rot_rad = -degreeToRadian(this.LayerManager.Canvas.View.RotationDegree);
            let new_x = new_x_wo_rot * Math.cos(rot_rad) - new_y_wo_rot * Math.sin(rot_rad);
            let new_y = new_x_wo_rot * Math.sin(rot_rad) + new_y_wo_rot * Math.cos(rot_rad);
            let ev: PaintEvent = {
                X: new_x,
                Y: new_y,
                type: e.pointerType as PaintEvent["type"] || "mouse",
                pressure: e.pressure
            };
            if (this.draw_func.PointerMove !== undefined) {
                this.draw_func.PointerMove(ev);
            }
            this.isDrawing = false;
            this.isPointOut = ev;
            return;
        }

        var isDrawing = this.isDrawing;
        interactCVS
            .gesturable({
                listeners: {
                    start: gestureStart,
                    move: gestureMove,
                    end: gestureEnd
                }
            })
            .draggable({
                listeners: {
                    move: dragMove
                }
            })
            .on("down", (e: Interact.PointerEvent) => {
                // We MUST need the following line, so that we wont trigger pointLeave accidentally (WHY?)
                this.isPointOut = undefined;
                if (
                    e.pointerType === "touch" &&
                    (window.editorUI.CenterCanvas as EditorCanvas)
                        .canDrawWithTouch === false
                ) {
                    // console.log("pointerdown");
                    container.style.touchAction = "auto";
                    isDrawing = false;
                    return;
                }
                container.style.touchAction = "none";
                e.preventDefault();
                e.stopPropagation();

                // Convert mouse position to canvas coordinate
                const newPts = convertViewToCanvas({
                    center: this.LayerManager.Canvas.View.Center,
                    size: { "width": (e.target as HTMLCanvasElement).width, "height": (e.target as HTMLCanvasElement).height },
                    scale: this.LayerManager.Canvas.View.Scale,
                    rotDeg: this.LayerManager.Canvas.View.RotationDegree,
                }, {
                    "x": e.offsetX,
                    "y": e.offsetY
                });
                let mouseEvent: PaintEvent = {
                    X: newPts.x,
                    Y: newPts.y,
                    type: "mouse",
                    pressure: 1.0
                };
                if (e.button === 0) {
                    if (this.draw_func.PointerDown !== undefined) {
                        this.EventFired = true;
                        this.draw_func.PointerDown(mouseEvent);
                        requestAnimationFrame(this.render);
                    }
                }
                else if (e.button === 2) { }
                isDrawing = true;
                // console.log(`Mouse Down`);
            })
            .on("move", (e: Interact.PointerEvent) => {
                // console.log("pointermove");
                if (
                    e.pointerType === "touch" &&
                    (window.editorUI.CenterCanvas as EditorCanvas)
                        .canDrawWithTouch === false
                ) {
                    return
                }
                e.preventDefault();
                e.stopPropagation();
                if (e.offsetX < 0 || e.offsetX > this.width ||
                    e.offsetY < 0 || e.offsetY > this.height
                ) {
                    // pointLeave wont triggered when we draw with finger, so we need call it manually
                    pointOut(e);
                }
                // Convert mouse position to canvas coordinate
                const newPts = convertViewToCanvas({
                    center: this.LayerManager.Canvas.View.Center,
                    size: { "width": (e.target as HTMLCanvasElement).width, "height": (e.target as HTMLCanvasElement).height },
                    scale: this.LayerManager.Canvas.View.Scale,
                    rotDeg: this.LayerManager.Canvas.View.RotationDegree,
                }, {
                    "x": e.offsetX,
                    "y": e.offsetY
                });
                let mouseEvent: PaintEvent = {
                    X: newPts.x,
                    Y: newPts.y,
                    type: "mouse",
                    pressure: 1.0
                };
                if (this.draw_func.PointerMove !== undefined) {
                    // console.log('Mouse Move');
                    this.draw_func.PointerMove(mouseEvent);
                }
            })
            .on("up", (e: Interact.PointerEvent) => {
                // console.log("pointerup");
                if (
                    e.pointerType === "touch" &&
                    (window.editorUI.CenterCanvas as EditorCanvas)
                        .canDrawWithTouch === false
                ) {
                    // console.log("pointerup");
                    container.style.touchAction = "none";
                    return;
                }
                container.style.touchAction = "none";
                e.preventDefault();
                e.stopPropagation();

                // Convert mouse position to canvas coordinate
                const newPts = convertViewToCanvas({
                    center: this.LayerManager.Canvas.View.Center,
                    size: { "width": (e.target as HTMLCanvasElement).width, "height": (e.target as HTMLCanvasElement).height },
                    scale: this.LayerManager.Canvas.View.Scale,
                    rotDeg: this.LayerManager.Canvas.View.RotationDegree,
                }, {
                    "x": e.offsetX,
                    "y": e.offsetY
                });
                let mouseEvent: PaintEvent = {
                    X: newPts.x,
                    Y: newPts.y,
                    type: "mouse",
                    pressure: 1.0
                };
                if (e.button === 0) {
                    if (this.draw_func.PointerUp !== undefined) {
                        // console.log("Mouse Up");
                        this.draw_func.PointerUp(mouseEvent);
                    }
                }
                else if (e.button === 2) {
                    if (this.draw_func.RightPointerUp !== undefined) {
                        // console.log("Mouse Out");
                        this.draw_func.RightPointerUp(mouseEvent);
                    }
                }
                isDrawing = false;

            })
            .on('pointerleave', pointOut);

        container.addEventListener("wheel", this.cvsMouseWheelHandler);

        window.addEventListener("keydown", this.docKeydownHandler);
        window.addEventListener("keyup", this.docKeyupHandler);
        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        container.appendChild(this.cnt);

        this.initCanvas();

        [this.layerInfoList, this.setLayerInfoList] = useProvider("editor.layer.info.list", []);
        this.setLayerInfoList(this.LayerManager.LayerList);
    }

    public enableDrag() {
        this.cnt.style.touchAction = "auto";
    }
    public disableDrag() {
        this.cnt.style.touchAction = "none";
    }

    public get Function() {
        return this.draw_func;
    }

    public set Function(func: CanvasInterface) {
        console.log("setFunction", func);
        this.draw_func = func;
        const browserCursor = [
            "alias",
            "all-scroll",
            "auto",
            "cell",
            "col-resize",
            "context-menu",
            "copy",
            "crosshair",
            "default",
            "e-resize",
            "ew-resize",
            "grab",
            "grabbing",
            "help",
            "move",
            "n-resize",
            "ne-resize",
            "nesw-resize",
            "ns-resize",
            "nw-resize",
            "nwse-resize",
            "no-drop",
            "none",
            "not-allowed",
            "pointer",
            "progress",
            "row-resize",
            "s-resize",
            "se-resize",
            "sw-resize",
            "text",
            "w-resize",
            "wait",
            "zoom-in",
            "zoom-out"
        ];

        if (func.CursorName === undefined) return;
        if (browserCursor.includes(func.CursorName)) {
            console.log(`CursorName ${func.CursorName} in list`);
            this.cnt.style.cursor = func.CursorName;
        } else {
            console.log(`CursorName ${func.CursorName} not in list`);
            this.cnt.style.cursor =
                "url(img/cursor/" + func.CursorName + ".cur), auto";
        }
        window.editorUI.forceRerender();
    }
    resizeCanvas = (_e?: UIEvent) => {
        this.LayerManager.resize(window.innerWidth, window.innerHeight);
    };
    removeCanvas = () => { };

    render = () => {
        // [this.layerInfoList, this.setLayerInfoList] = useProvider("editor.layer.info.list", []);
        if (this.EventFired) {
            let angle = this.isDrawRotate ? this.LayerManager.Canvas.View.RotationDegree : 0;
            this.draw_func.DrawFunction(this.LayerManager.Layer.prev, this.width, this.height, angle);
            if (this.isPointOut !== undefined) {
                if (this.draw_func.PointerOut !== undefined) {
                    this.draw_func.PointerOut(this.isPointOut);
                    this.isPointOut = undefined;
                    requestAnimationFrame(this.render);
                }
                this.draw_func.DrawFunction(this.LayerManager.Layer.prev, this.width, this.height, angle);
                this.isPointOut = undefined;
            }
            if (this.draw_func.CanFinishDrawing) this.finishDrawing();
            requestAnimationFrame(this.render);
        }
        this.isPointOut = undefined;

        this.LayerManager.viewAt(this.LayerManager.Canvas.View.Center, this.LayerManager.Canvas.View.RotationDegree, this.LayerManager.Canvas.View.Scale);

    };

    private drawWithTouch = false;
    public get canDrawWithTouch() {
        return this.drawWithTouch;
    }
    public toggleTouch = () => {
        this.drawWithTouch = !this.drawWithTouch;
    };

    public open = () => {
        let upload = document.createElement("input");
        upload.setAttribute("type", "file");
        upload.setAttribute("accept", "image/*");
        upload.onchange = (event: Event) => {
            const element = event.currentTarget as HTMLInputElement;
            let fileList: FileList | null = element.files;
            if (fileList === null) {
                dia.close();
                return;
            }

            let img = new Image();
            let src = URL.createObjectURL(fileList[0]);
            img.src = src;
        };
        let dia = new Dialog("Upload A Image", upload);
        dia.show();
    };

    public save() {
        let btnOK = BUTTON("ok_btn", "OK")
        let txtName = TEXT("txt")
        let dia = new Dialog(
            "Enter the name of image",
            DIV("w-fit flex flex-row", [
                txtName,
                SPAN("whitespace", "  .png "),
                btnOK
            ])
        );
        btnOK.onclick = () => {
            // function from https://stackoverflow.com/a/15832662/512042
            let downloadURI = (uri: string, name: string) => {
                var link = document.createElement('a');
                link.download = name;
                link.href = uri;
                // document.body.appendChild(link);
                link.click();
                // document.body.removeChild(link);
            }
            downloadURI(this.LayerManager.Canvas.toDataURL(), txtName.value);
            dia.close();
        };
        dia.show();
    }
    public clear() {
        let btnCancel = BUTTON("w-full mx-2rem", "Cancel");
        btnCancel.onclick = () => {
            dia.close();
        };
        let btnOK = BUTTON("w-full mx-2rem", "OK");
        btnOK.onclick = () => {
            // console.log(`Clear ${this.width}, ${this.height}`, this.ctx);
            this.initCanvas();
            this.setLayerInfoList(this.LayerManager.LayerList);
            dia.close();
        };
        let dia = new Dialog(
            "Do you want to clear the canvas ?",
            DIV("w-full flex flex-row", [btnCancel, btnOK])
        );
        dia.show();
    }
    /* Scaling of Canvas */
    private scaleTip: TipComponent;
    private refreshScaleTip = (angle: number, scale: number) => {
        // Refresh status tip, this will cause re-render
        this.scaleTip.updateTip(
            "Rotate : " + (angle).toFixed(0) + "°, " +
            "Scale : " + (scale * 100).toFixed(0) + "%"
        );
    }


    public resetScale = () => {
        this.LayerManager.Canvas.View.viewScaleAt(1.0);
        this.refreshScaleTip(this.LayerManager.Canvas.View.RotationDegree, this.LayerManager.Canvas.View.Scale);
    }
    public resetRotate = () => {
        this.LayerManager.Canvas.View.viewRotDegAt(0);
        this.refreshScaleTip(this.LayerManager.Canvas.View.RotationDegree, this.LayerManager.Canvas.View.Scale);
    }
    public resetPosition = () => {
        this.LayerManager.Canvas.View.viewCenterAt({ x: 0, y: 0 });
    }

    private cvsMouseWheelHandler = (ev: WheelEvent) => {

        if (ev.ctrlKey && !ev.shiftKey && !ev.altKey) {// Zoom in/out
            ev.preventDefault();
            if (ev.deltaY < 0) {
                // ZOOM IN
                this.LayerManager.Canvas.View.viewZoomIn(0.05);
            } else if (ev.deltaY > 0) {
                // zoom out
                this.LayerManager.Canvas.View.viewZoomOut(0.05);
            }
            this.refreshScaleTip(this.LayerManager.Canvas.View.RotationDegree, this.LayerManager.Canvas.View.Scale);
            return;
        }
        if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey) { // No Key: Up/Down
            ev.preventDefault();
            if (ev.deltaY < 0) { // Wheel up, content Move down
                this.LayerManager.Canvas.View.viewUp(15);
            } else if (ev.deltaY > 0) {
                this.LayerManager.Canvas.View.viewDown(15);
            }
            this.render();
            return;
        }
        if (!ev.ctrlKey && ev.shiftKey && !ev.altKey) {// Shift: Left/Right
            ev.preventDefault();
            if (ev.deltaY < 0) { // Wheel up, content Move right
                this.LayerManager.Canvas.View.viewLeft(15);
            } else if (ev.deltaY > 0) {
                this.LayerManager.Canvas.View.viewRight(15);
            }
            this.render();
            return;
        }
        if (!ev.ctrlKey && !ev.shiftKey && ev.altKey) { // Alt: Rotate Left/Right
            ev.preventDefault();
            const rotCenter = convertViewToCanvas({
                center: this.LayerManager.Canvas.View.Center,
                size: { "width": (ev.target as HTMLCanvasElement).width, "height": (ev.target as HTMLCanvasElement).height },
                scale: this.LayerManager.Canvas.View.Scale,
                rotDeg: this.LayerManager.Canvas.View.RotationDegree,
            }, {
                "x": ev.offsetX,
                "y": ev.offsetY
            });
            if (ev.deltaY < 0) {
                // Rotate counter-clockwise
                this.LayerManager.Canvas.View.viewRotate(2, rotCenter);
            } else if (ev.deltaY > 0) {
                // Rotate clockwise
                this.LayerManager.Canvas.View.viewRotate(-2, rotCenter);
            }
            this.refreshScaleTip(this.LayerManager.Canvas.View.RotationDegree, this.LayerManager.Canvas.View.Scale);
            return;
        }
    };
    private docKeydownHandler = (ev: KeyboardEvent) => {
        // console.log("docKeydown", ev.key);
        if (ev.key === "+" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.LayerManager.Canvas.View.viewZoomIn(0.1); }
        if (ev.key === "-" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.LayerManager.Canvas.View.viewZoomOut(- 0.1); }
        if (ev.key === "0" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.LayerManager.Canvas.View.viewScaleAt(1.0); }
        if (ev.key === "z" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.undo(); }
        if (ev.key === "y" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.redo(); }
        this.render();
    };
    private docKeyupHandler = (_ev: KeyboardEvent) => { };

    public get settings() {
        if (this.draw_func.Settings === undefined)
            return {} as CanvasInterfaceSettings;
        return this.draw_func.Settings;
    }
    public set settings(setting: CanvasInterfaceSettings) {
        if (this.draw_func.Settings !== undefined)
            this.draw_func.Settings = setting;
    }
}

class modeEditor implements ModeFunction {
    Enable = true;

    CenterCanvas = new EditorCanvas(1920, 1080);

    MenuToolbarLeft = [
        // new btnUpload(),
        new btnUndo(),
        new btnRedo(),
        new btnClear(),
        new btnCanvas('Eraser', 'eraser', 'Eraser', async () => new (await import("./drawing/eraser")).default()),
    ];

    MenuToolbarRight = [
        new btnResetPosition(),
        new btnResetScale(),
        new btnResetRotate(),
        new btnToggleTouch(),
        new btnSave()
    ];

    LeftToolbarTop = [
        new btnCanvas('Brush', 'brush', 'Brush', async () => new (await import("./drawing/brush")).default()),
        new btnCanvas('Line', 'line', 'Line', async () => new (await import("./drawing/line")).LineCVSFunc()),
        new btnCanvas('Circle', 'circle', 'Circle', async () => new (await import("./drawing/circle")).CircleCVSFunc()),
        new btnCanvas('Triangle', 'triangle', 'Triangle', async () => new (await import("./drawing/triangle")).TriangleCVSFunc()),
        new btnCanvas('Rectangle', 'rectangle', 'Rectangle', async () => new (await import("./drawing/rectangle")).RectangleCVSFunc()),
        new btnPolygon(),
    ];

    RightToolbarTop = [
        new LayerMgrSidebar(),
        new SettingPageSidebar(),
    ];

    private unload: (event: BeforeUnloadEvent) => void = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = "";
    }

    StartMode() {
        if (process.env.NODE_ENV !== 'development') {
            window.addEventListener("beforeunload", this.unload, true);
        }
    }
    EndMode() {
        if (process.env.NODE_ENV !== 'development') {
            window.removeEventListener("beforeunload", this.unload);
        }
    }
}

export default modeEditor;
