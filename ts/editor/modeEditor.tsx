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
import LayerMgrSidebar, { LayerManager, Layer, LayerInfo } from './layer';
import SettingPageSidebar from "./setting";
import HistoryManager from "./historyLogger";
import { type setValueFunctionType, useProvider } from "../editorUI/util/useHook";
import { type NextFunctionState } from "../editorUI/interface/function";
import { btnPolygon } from "./polygon";


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

    // private scrollDiv: HTMLDivElement = DIV(
    //     "w-full h-full overflowX-scroll overflowY-scroll relative disable-touch"
    // );
    // private scaleElement: HTMLDivElement = DIV("absolute w-fit h-fit transform-center")
    private backgroundDiv: HTMLDivElement = DIV("absolute disable-mouse");
    private cnt !: HTMLDivElement;
    // private containerVNode: VNode;
    // private cvs !: Konva.Stage;
    // private ctx !:Konva.Layer;
    // private prev_ctx = () => this.LayerManager.Layer.prev;
    // private render_ctx = () => this.LayerManager.Layer.render;
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
            let polygon = this.LayerManager.Canvas.find(`.${entry.shapeName}`)
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
            let polygon = this.LayerManager.Canvas.find(`.${entry.shapeName}`)
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
                let polygon = this.LayerManager.Canvas.find(`.${entry.shapeName}`)
                if (polygon.length === 0) throw new Error("INTERNAL_ERROR: Shape not found");
                polygon.forEach((shape) => {
                    shape.destroy();
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
    };
    private angleScalePos = {
        angle: 0,
        scale: 1,
        pos: {
            x: 0,
            y: 0
        }
    };
    private dragMoveListener = (event: Interact.GestureEvent, _target: HTMLElement, angleScale: { angle: number, scale: number }) => {
        // console.log("[DEB] dragMoveListener : ",event)
        // keep the dragged position in the data-x/data-y attributes
        this.angleScalePos.pos.x = this.angleScalePos.pos.x + event.dx;
        this.angleScalePos.pos.y = this.angleScalePos.pos.y + event.dy;

        // translate the element
        this.rotateTo(angleScale.angle)
        this.scaleTo(angleScale.scale);
        this.moveTo(this.angleScalePos.pos.x, this.angleScalePos.pos.y);

        this.refreshScaleTip(angleScale.angle, angleScale.scale);
    }
    private isDrawing: boolean = false;
    private isDrawRotate: boolean = true;
    // @ts-ignore
    private layerInfoList: LayerInfo[] = [];
    private setLayerInfoList: setValueFunctionType = () => { }
    attachCanvas(container: HTMLDivElement) {
        // this.containerVNode = <Div className="w-full h-full" />;
        // let container = this.containerVNode.elm as HTMLDivElement;
        // console.log("[HOK] attachCanvas : ", this.containerVNode)
        console.log("[HOK] Canvas Size ", this.width, this.height);
        // this.backgroundDiv.style.position = "fixed";
        this.backgroundDiv.id = "backgroundDiv";

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
            startAngle = angleScale.angle - e.angle;
            startScale = e.scale;
            this.cnt.classList.remove("reset");
        }
        let gestureMove = (e: Interact.GestureEvent) => {
            console.log(`[DEB] isDrawing GestureMove ${isDrawing}`)
            if (isDrawing) return;
            console.log(
                `[CVS] Gesture move scale:${e.ds}, angle: ${e.da}`
            );
            angleScale.angle = this.normalizeRotate(e.angle + startAngle);
            angleScale.scale = e.scale * startScale;
            dragMoveListener(e, this.cnt, angleScale);
            e.preventDefault();
            e.stopPropagation();
        }
        let gestureEnd = (e: Interact.GestureEvent) => {
            if (isDrawing) return;
            console.log(
                `[CVS] Gesture end scale:${e.scale}, angle: ${e.angle}`
            );
            angleScale.angle = this.normalizeRotate(startAngle + e.angle);
            angleScale.scale = e.scale * startScale;
            e.preventDefault();
            e.stopPropagation();
        }
        let dragMove = (e: Interact.GestureEvent) => {
            if (!isDrawing && this.isPointOut === undefined)
                dragMoveListener(e, this.cnt, angleScale)
        }
        let pointOut = (e: Interact.PointerEvent) => {
            let new_x_wo_rot = (e.offsetX - this.angleScalePos.pos.x) / this.angleScalePos.scale;
            let new_y_wo_rot = (e.offsetY - this.angleScalePos.pos.y) / this.angleScalePos.scale;
            let rot_deg = -angleScale.angle / 180 * Math.PI;
            let new_x = new_x_wo_rot * Math.cos(rot_deg) - new_y_wo_rot * Math.sin(rot_deg);
            let new_y = new_x_wo_rot * Math.sin(rot_deg) + new_y_wo_rot * Math.cos(rot_deg);
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

        // var scaleElement = this.scaleElement;
        var angleScale = this.angleScalePos;
        var dragMoveListener = this.dragMoveListener;
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

                let new_x_wo_rot = (e.offsetX - this.angleScalePos.pos.x) / this.angleScalePos.scale;
                let new_y_wo_rot = (e.offsetY - this.angleScalePos.pos.y) / this.angleScalePos.scale;
                let rot_deg = -angleScale.angle / 180 * Math.PI;
                let new_x = new_x_wo_rot * Math.cos(rot_deg) - new_y_wo_rot * Math.sin(rot_deg);
                let new_y = new_x_wo_rot * Math.sin(rot_deg) + new_y_wo_rot * Math.cos(rot_deg);
                let mouseEvent: PaintEvent = {
                    X: new_x,
                    Y: new_y,
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
                let new_x_wo_rot = (e.offsetX - this.angleScalePos.pos.x) / this.angleScalePos.scale;
                let new_y_wo_rot = (e.offsetY - this.angleScalePos.pos.y) / this.angleScalePos.scale;
                let rot_deg = -angleScale.angle / 180 * Math.PI;
                let new_x = new_x_wo_rot * Math.cos(rot_deg) - new_y_wo_rot * Math.sin(rot_deg);
                let new_y = new_x_wo_rot * Math.sin(rot_deg) + new_y_wo_rot * Math.cos(rot_deg);
                let mouseEvent: PaintEvent = {
                    X: new_x,
                    Y: new_y,
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

                let new_x_wo_rot = (e.offsetX - this.angleScalePos.pos.x) / this.angleScalePos.scale;
                let new_y_wo_rot = (e.offsetY - this.angleScalePos.pos.y) / this.angleScalePos.scale;
                let rot_deg = -angleScale.angle / 180 * Math.PI;
                let new_x = new_x_wo_rot * Math.cos(rot_deg) - new_y_wo_rot * Math.sin(rot_deg);
                let new_y = new_x_wo_rot * Math.sin(rot_deg) + new_y_wo_rot * Math.cos(rot_deg);
                let mouseEvent: PaintEvent = {
                    X: new_x,
                    Y: new_y,
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

        container.appendChild(this.backgroundDiv);
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
            let angle = this.isDrawRotate ? this.angleScalePos.angle : 0;
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
        // this.ctx.clearRect(0, 0, this.width, this.height);
        // this.ctx.drawImage(this.render_cvs.element, 0, 0, this.width, this.height);
        // return this.containerVNode;
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
    public get scaleFactor() { return this.angleScalePos.scale; }
    private scaleTip: TipComponent;
    private normalizeRotate = (rotate: number) => {
        let angle = rotate % 360;
        if (angle > 0)
            return angle > 180 ? -360 + angle : angle;
        return angle < -180 ? 360 + angle : angle;
    }
    private refreshScaleTip = (angle: number, scale: number) => {
        this.scaleTip.updateTip(
            "Rotate : " + (angle).toFixed(0) + "°, " +
            "Scale : " + (scale * 100).toFixed(0) + "%"
        );
    }
    // private isCtlKeyDown: boolean = false;
    // private isShiftDown: boolean = false;
    // private isAltDown: boolean = false;
    public scaleTo = (scale: number) => {
        let new_scale = scale;
        if (new_scale >= 4) new_scale = 4;
        if (new_scale <= 0.1) new_scale = 0.1;
        this.angleScalePos.scale = new_scale;
        this.refreshScaleTip(this.angleScalePos.angle, this.angleScalePos.scale);
        // console.log("Next scale factor = " + this.angleScalePos.scale);
        this.backgroundDiv.style.setProperty("--bgDiv-img-scale", `${new_scale}`);

        this.LayerManager.scaleTo(new_scale);
    };
    public rotateTo = (rotate: number) => {
        let new_rotate = this.normalizeRotate(rotate);
        this.angleScalePos.angle = new_rotate;
        this.refreshScaleTip(this.angleScalePos.angle, this.angleScalePos.scale);
        // console.log("Next rotate factor = " + this.angleScalePos.scale);
        this.backgroundDiv.style.setProperty("--bgDiv-transform-rotate", `${new_rotate}deg`);
        this.LayerManager.rotateTo(new_rotate);
    };

    public moveTo = (moveX: number, moveY: number) => {
        this.angleScalePos.pos.x = moveX;
        this.angleScalePos.pos.y = moveY;
        this.backgroundDiv.style.setProperty("--bgDiv-transform-translate-x", `${moveX}px`);
        this.backgroundDiv.style.setProperty("--bgDiv-transform-translate-y", `${moveY}px`);
        this.LayerManager.moveTo(moveX, moveY);
    };
    private cvsMouseWheelHandler = (ev: WheelEvent) => {

        if (ev.ctrlKey && !ev.shiftKey && !ev.altKey) {// Zoom in/out
            ev.preventDefault();
            if (ev.deltaY < 0) {
                // ZOOM IN
                this.scaleTo(this.angleScalePos.scale + 0.1);
            } else if (ev.deltaY > 0) {
                // zoom out
                this.scaleTo(this.angleScalePos.scale - 0.1);
            }
            this.render();
            return;
        }
        if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey) { // No Key: Up/Down
            ev.preventDefault();
            if (ev.deltaY < 0) {
                this.moveTo(this.angleScalePos.pos.x, this.angleScalePos.pos.y + 30);
            } else if (ev.deltaY > 0) {
                this.moveTo(this.angleScalePos.pos.x, this.angleScalePos.pos.y - 30);
            }
            this.render();
            return;
        }
        if (!ev.ctrlKey && ev.shiftKey && !ev.altKey) {// Shift: Left/Right
            ev.preventDefault();
            if (ev.deltaY < 0) {
                this.moveTo(this.angleScalePos.pos.x + 30, this.angleScalePos.pos.y);
            } else if (ev.deltaY > 0) {
                this.moveTo(this.angleScalePos.pos.x - 30, this.angleScalePos.pos.y);
            }
            this.render();
            return;
        }
        if (!ev.ctrlKey && !ev.shiftKey && ev.altKey) { // Alt: Rotate Left/Right
            ev.preventDefault();
            if (ev.deltaY < 0) {
                // ZOOM IN
                this.rotateTo(this.angleScalePos.angle + 2);
            } else if (ev.deltaY > 0) {
                // zoom out
                this.rotateTo(this.angleScalePos.angle - 2);
            }
            this.render();
            return;
        }
    };
    private docKeydownHandler = (ev: KeyboardEvent) => {
        // console.log("docKeydown", ev.key);
        if (ev.key === "+" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.scaleTo(this.scaleFactor + 0.1); }
        if (ev.key === "-" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.scaleTo(this.scaleFactor - 0.1); }
        if (ev.key === "0" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.scaleTo(1.0); }
        if (ev.key === "z" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.undo(); }
        if (ev.key === "y" && ev.ctrlKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); this.redo(); }
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
        // new btnCanvas(new EraserCVSFunc()),
        new btnCanvas('Eraser', 'eraser', 'Eraser', async () => new (await import(/* webpackChunkName: "paint-eraser" */"./eraser")).default()),
    ];

    MenuToolbarRight = [
        new btnResetPosition(),
        new btnResetScale(),
        new btnResetRotate(),
        new btnToggleTouch(),
        new btnSave()
    ];

    LeftToolbarTop = [
        new btnCanvas('Brush', 'brush', 'Brush', async () => new (await import(/* webpackChunkName: "paint-brush" */"./brush")).default()),
        new btnCanvas('Line', 'line', 'Line', async () => new (await import(/* webpackChunkName: "paint-line" */"./line")).default()),
        new btnCanvas('Circle', 'circle', 'Circle', async () => new (await import(/* webpackChunkName: "paint-polygon" */"./polygon")).CircleCVSFunc()),
        new btnCanvas('Triangle', 'triangle', 'Triangle', async () => new (await import(/* webpackChunkName: "paint-polygon" */"./polygon")).TriangleCVSFunc()),
        new btnCanvas('Rectangle', 'rectangle', 'Rectangle', async () => new (await import(/* webpackChunkName: "paint-polygon" */"./polygon")).RectangleCVSFunc()),
        new btnPolygon(),
    ];

    RightToolbarTop = [
        new LayerMgrSidebar(),
        new SettingPageSidebar(),
    ];

    StartMode() { }
    EndMode() { }
}

export default modeEditor;
