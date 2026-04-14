/**
 * Created : 2026/03/31
 * Author  : Ting Fang, Tsai
 * About:
 *  Next-Generation EditorCanvas     
 */
import EditorUI from "../editorUI";

import Layer from "./layer";
import State from "./state";

import { ButtonIndex, WheelDirection, type InteractClickEvent, type InteractDragEvent, type InteractMoveEvent, type InteractWheelEvent } from "./layer/interact/event";
import type { ObjectRender } from "./layer/render/render";

import type { GroupHistoryDiff } from "./state/canvas/data/group";
import { Layer as LayerData } from "./state/canvas/data/layer";
import type { ObjectBase } from "./state/canvas/data/object";

import { EditingEngine } from "./editing/engine";
import type { IEditable } from "./editing/interface/editable";
import { Exporter } from "./export/exporter";
import type { ViewportConfig } from "./layer/interact/state/utils";

import { btnCanvas } from "./modeEditor";

import { ShapeExtension as shp } from "./extension/shape";
import type { TouchPinchEvent } from "./layer/interact/handler/touch";

type HistoryLogEntry<DATATYPE> = {
    layerID: string;
    objectName: string;
    data: DATATYPE;
}

const IMAGE_LOCAL_STORAGE_KEY: string = "my_little_paint-image-data";
const SAVE_TIME_LOCAL_STORAGE_KEY: string = "my_little_paint-save-time";

export class EditorCanvas implements EditorUI.Interface.Canvas {
    name = "EditorCanvas";

    /** Layers */
    private interact_layer: Layer.Interact;
    private render_layer: Layer.Render;
    private background_layer: Layer.Background;

    /** State */
    // private history_state: State.History;
    private canvas_state: State.Canvas;

    /** EditingEngine */
    private editing_engine: EditingEngine;

    /** Exporter */
    private exporter: Exporter;

    constructor() {
        // const cvsSize = { width: 800, height: 400 };
        const cvsSize = { width: Infinity, height: Infinity };
        this.interact_layer = new Layer.Interact();
        this.render_layer = new Layer.Render();
        this.background_layer = new Layer.Background(cvsSize);
        this.exporter = new Exporter();

        this.interact_layer.on("viewChanged", (viewport) => this.view_changed_handler(viewport));
        // this.history_state = new State.History();
        this.canvas_state = new State.Canvas({ name: "DefaultCanvas", size: cvsSize });


        this.editing_engine = new EditingEngine();
        this.editing_engine.on("finishEditing", (editWith, ctx) => this.finish_editing_handler(editWith, ctx));
        this.editing_engine.on("cursorChanged", (cursor) => { this.interact_layer.cursorName = cursor });

        this.initBuiltInExtensions();
        if (this.loadFromLocalStorage()) {
            this.background_layer.cvsSize = this.canvas_state.Size;
        } else {
            this.resetCanvas();
        }
    }
    private resetCanvas() {
        this.undo_stk_history = new Array();
        this.redo_stk_history = new Array();
        this.canvas_state.clear();

        this.editing_engine.reset();
        this.canvas_state.add(new LayerData("Layer1", { globalCompositeOperation: "source-over" }));

        this.background_layer.cvsSize = this.canvas_state.Size;

        // NOTE: `viewAt` should be called after add() since it will trigger rendering and we need to make sure the canvas has at least one layer to render
        this.interact_layer.View.viewAt({ x: 0, y: 0 }, 0, 1.0);
    };


    /** Extension Manage */
    private initBuiltInExtensions() {
        this.registerObject(shp.Circle.Data, new shp.Circle.Render());
        this.registerObject(shp.Ellipse.Data, new shp.Ellipse.Render());
        this.registerObject(shp.Line.Data, new shp.Line.Render());
        this.registerObject(shp.Path.Data, new shp.Path.Render());
        this.registerObject(shp.Rect.Data, new shp.Rect.Render());
        this.registerObject(shp.Text.Data, new shp.Text.Render());

        this.editing_engine.register("eraser", new shp.Eraser.Editable());
        this.registerTool("brush", new shp.Brush.Editable());
        this.registerTool("line", new shp.Line.Editable());
        this.registerTool("circle", new shp.Circle.Editable());
        this.registerTool("triangle", new shp.Triangle.Editable());
        this.registerTool("rectangle", new shp.Rect.Editable());

        this.toolbar_left_top_list.push(new shp.Polygon.ToolButton());
        this.editing_engine.register("polygon", new shp.Polygon.Editable());
    }

    public registerObject(data: typeof ObjectBase<any>, render: ObjectRender<ObjectBase<any>>): void {
        this.canvas_state.register(data.name, data);
        this.render_layer.register(data.name, render);
        this.exporter.register(data.name, render);
    }
    private toolbar_left_top_list: EditorUI.Interface.Function[] = [];
    public get ToolbarLeftTopList(): EditorUI.Interface.Function[] {
        return this.toolbar_left_top_list;
    }
    public registerTool(name: string, plugin: IEditable): void {
        this.editing_engine.register(name, plugin);
        this.toolbar_left_top_list.push(
            new btnCanvas(
                name, // name
                name || "brush", // imgName
                name || "", // TODO: Tip
                name // plugin name
            )
        );
    }

    /** EventHandler */
    private dragging_draw_handler(e: InteractDragEvent) {
        // Drawing (drag) Handler
        if (this.editing_engine.editing === false) return;
        let paintEvent: EditorUI.Canvas.PaintEvent = {
            X: e.currentPoint.x,
            Y: e.currentPoint.y,
            type: "mouse",
            pressure: 1.0,
            rotDegree: this.interact_layer.View.RotationDegree,
        };
        if (e.isStart) {
            this.editing_engine.pointDown(paintEvent);
        }
        this.editing_engine.pointMove(paintEvent);
    }
    private mouse_move_handler(e: InteractMoveEvent) {
        let paintEvent: EditorUI.Canvas.PaintEvent = {
            X: e.point.x,
            Y: e.point.y,
            type: "mouse",
            pressure: 0.0,
            rotDegree: this.interact_layer.View.RotationDegree,
        };
        this.editing_engine.pointMove(paintEvent);
    }
    private pointer_up_handler(e: InteractClickEvent) {
        // Mouse/Pen/Stylus Up Handler
        if (this.editing_engine.editing === false) return;
        let paintEvent: EditorUI.Canvas.PaintEvent = {
            X: e.point.x,
            Y: e.point.y,
            type: "mouse",
            pressure: 1.0,
            rotDegree: this.interact_layer.View.RotationDegree,
        };
        this.editing_engine.pointUp(paintEvent);
    }
    private click_draw_handler(e: InteractClickEvent) {
        // Drawing (click) handler for non-drag interactions
        if (this.editing_engine.editing === false) return;
        const paintEvent: EditorUI.Canvas.PaintEvent = {
            X: e.point.x,
            Y: e.point.y,
            type: "mouse",
            pressure: 1.0,
            rotDegree: this.interact_layer.View.RotationDegree,
        };
        this.editing_engine.pointDown(paintEvent);
        this.editing_engine.pointUp(paintEvent);
    }
    private mouse_wheel_changed_handler(e: InteractWheelEvent) {
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {// Zoom in/out
            if (e.direction === WheelDirection.Front) { // ZOOM IN
                this.interact_layer.View.viewZoomIn(0.05, 8.0, e.point);
            } else if (e.direction === WheelDirection.Back) { // ZOOM OUT
                this.interact_layer.View.viewZoomOut(0.05, 0.5, e.point);
            }
        }
        if (!e.ctrlKey && !e.shiftKey && !e.altKey) { // No Key: Up/Down
            if (e.direction === WheelDirection.Front) { // Wheel up, content Move down
                this.interact_layer.View.viewUp(15);
            } else if (e.direction === WheelDirection.Back) {
                this.interact_layer.View.viewDown(15);
            }
        }
        if (!e.ctrlKey && e.shiftKey && !e.altKey) {// Shift: Left/Right
            if (e.direction === WheelDirection.Front) { // Wheel up, content Move right
                this.interact_layer.View.viewLeft(15);
            } else if (e.direction === WheelDirection.Back) {
                this.interact_layer.View.viewRight(15);
            }
        }
        if (!e.ctrlKey && !e.shiftKey && e.altKey) { // Alt: Rotate Left/Right
            if (e.direction === WheelDirection.Front) { // Rotate counter-clockwise
                this.interact_layer.View.viewRotate(2, e.point);
            } else if (e.direction === WheelDirection.Back) { // Rotate clockwise
                this.interact_layer.View.viewRotate(-2, e.point);
            }
        }
    };
    private drag_view_handler(e: InteractDragEvent) {
        // Touch drag handler for view moving
        const dx: number = e.delta.x;
        const dy: number = e.delta.y;
        // console.log(`touch drag move dx: ${dx}, dy: ${dy}, scale: ${this.LayerManager.Canvas.View.Scale}`);
        this.interact_layer.View.viewUp(dy / this.interact_layer.View.Scale);
        this.interact_layer.View.viewLeft(dx / this.interact_layer.View.Scale);
    }
    private key_down_handler(e: KeyboardEvent) {
        // console.log("docKeydown", ev.key);
        // Zoom
        if (e.key === "+" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewZoomIn(0.1); }
        if (e.key === "-" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewZoomOut(0.1); }
        if (e.key === "0" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewScaleAt(1.0); }
        if (e.key === "ArrowUp" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewZoomIn(0.1); }
        if (e.key === "ArrowDown" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewZoomOut(0.1); }
        // move up/down/left/right: note that we need to move view in opposite direction of key
        if (e.key === "ArrowUp" && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewDown(15); }
        if (e.key === "ArrowDown" && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewUp(15); }
        if (e.key === "ArrowLeft" && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewRight(15); }
        if (e.key === "ArrowRight" && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.interact_layer.View.viewLeft(15); }
        // rotation ←: counter-clockwise, →: clockwise
        if (e.key === "ArrowLeft" && !e.ctrlKey && !e.shiftKey && e.altKey) { e.preventDefault(); this.interact_layer.View.viewRotate(-2); }
        if (e.key === "ArrowRight" && !e.ctrlKey && !e.shiftKey && e.altKey) { e.preventDefault(); this.interact_layer.View.viewRotate(2); }
        // redo/undo
        if (e.key === "z" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.undo(); }
        if (e.key === "y" && e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); this.redo(); }
        this.requestRender();
    };
    private view_changed_handler(viewport: ViewportConfig) {
        this.background_layer.viewAt(viewport.center, viewport.rotDeg, viewport.scale);
        this.render_layer.viewAt(viewport.center, viewport.rotDeg, viewport.scale);
        this.requestRender();
    }
    private finish_editing_handler(editWith: string, ctx: LayerData) {
        // Trigger when finish editing (pointer up, etc)
        const patch_diff = ctx.diff();

        const activated_layer = this.canvas_state.activateLayer;
        const applied_patch = activated_layer.patch(patch_diff);
        const logs: HistoryLogEntry<GroupHistoryDiff> = {
            layerID: activated_layer.Name,
            objectName: activated_layer.Name,
            data: applied_patch,
        };
        this.undo_stk_history.push(logs);
        this.redo_stk_history = new Array();
        this.startEdit(editWith); // Keep current editing tool for next edit
        this.requestRender();
    }
    private touch_pinch_handler(e: TouchPinchEvent) {
        const scale = e.delta.scale;
        if (scale > 0) {
            this.interact_layer.View.viewZoomIn(e.delta.scale, 8.0, e.centerPoint);
        }
        else {
            this.interact_layer.View.viewZoomOut(-e.delta.scale, 0.5, e.centerPoint);
        }
        this.interact_layer.View.viewRotate(e.delta.rotDegree, e.centerPoint);
        this.interact_layer.View.viewRight(-e.delta.offset.x);
        this.interact_layer.View.viewDown(-e.delta.offset.y);
    }

    /** Implement of CanvasBase */
    public attach(container: HTMLDivElement): void {
        this.interact_layer.on("mouseDrag", (extra, e) => { (extra.buttonId === ButtonIndex.Primary) && this.dragging_draw_handler(e) });
        this.interact_layer.on("mouseClick", (extra, e) => { (extra.buttonId === ButtonIndex.Primary) && this.click_draw_handler(e) });
        this.interact_layer.on("mouseUp", (extra, e) => { (extra.buttonId === ButtonIndex.Primary) && this.pointer_up_handler(e) });
        this.interact_layer.on("mouseWheel", (e) => { this.mouse_wheel_changed_handler(e) });
        this.interact_layer.on("mouseMove", (_extra, e) => this.mouse_move_handler(e));

        this.interact_layer.on("stylusDrag", (_extra, e) => this.dragging_draw_handler(e));
        this.interact_layer.on("stylusUp", (_extra, e) => this.pointer_up_handler(e));

        this.interact_layer.on("touchDrag", (_extra, e) => { (this.touch_drag_enabled) ? this.drag_view_handler(e) : this.dragging_draw_handler(e); })
        this.interact_layer.on("touchUp", (_extra, e) => { (this.touch_drag_enabled) ? {} : this.pointer_up_handler(e); })
        this.interact_layer.on("touchClick", (_extra, e) => { (this.touch_drag_enabled) ? {} : this.pointer_up_handler(e); })
        this.interact_layer.on("touchPinch", (e) => { (this.touch_drag_enabled) ? this.touch_pinch_handler(e) : {} })

        window.addEventListener("keydown", (e) => this.key_down_handler(e));

        // Attach to container
        container.appendChild(this.background_layer.element);
        container.appendChild(this.render_layer.element);
        container.appendChild(this.interact_layer.element);

        this.resize(); // Force resize to fit the view size
        setInterval(() => { this.saveToLocalStorage() }, 60 * 1000);
        // setInterval(() => { this.saveToLocalStorage() }, 1000);
    };

    public resize(_e?: UIEvent): void {
        const view_width = window.innerWidth;
        const view_height = window.innerHeight;
        this.background_layer.viewSize = { width: view_width, height: view_height };
        this.render_layer.viewSize = { width: view_width, height: view_height };

        this.interact_layer.View.viewSize = { width: view_width, height: view_height };
        this.requestRender();
        // TODO: Resize other state
    }
    public detach(): void { }

    private is_render_requested: boolean = false;
    private requestRender(): void {
        if (!this.is_render_requested) {
            this.is_render_requested = true;
            requestAnimationFrame(() => {
                this.is_render_requested = false;
                this.render();
            });
        }
    }
    public render(): void {
        // TODO: Update layers from CanvasState
        const prev_zIdx = this.canvas_state.activateLayer.zIndex;
        let render_layers: LayerData[] = []

        const below_or_equal_layers = this.canvas_state.orderedLayers({ endZIndex: prev_zIdx });
        const above_layers = this.canvas_state.orderedLayers({ startZIndex: prev_zIdx + 1 });
        render_layers = [...below_or_equal_layers];
        // TODO: How about when modified exist shape ?
        if (this.editing_engine.editing) {
            render_layers.push(...this.editing_engine.preview.orderedLayers());
        }
        render_layers.push(...above_layers);
        this.render_layer.render(render_layers);

        render_layers.forEach(layer => layer.rendered());

        if (this.editing_engine.editing) {
            this.requestRender();
        }
    }

    /** EditorCanvas specified interface */
    private touch_drag_enabled: boolean = true;
    public toggleTouch(): void {
        this.touch_drag_enabled = !this.touch_drag_enabled;
    };
    public resetScale = () => {
        this.interact_layer.View.viewScaleAt(1.0);
        // this.refreshScaleTip(this.view_state.RotationDegree, this.view_state.Scale);
    }
    public resetRotate = () => {
        this.interact_layer.View.viewRotDegAt(0);
        // this.refreshScaleTip(this.view_state.RotationDegree, this.view_state.Scale);
    }
    public resetPosition = () => {
        this.interact_layer.View.viewCenterAt({ x: 0, y: 0 });
    }
    public clear() {
        let btnCancel = EditorUI.UIComp.HTML.Button("w-full mx-2rem my-2rem p-2", "Cancel");
        btnCancel.onclick = () => {
            dia.close();
        };
        let btnOK = EditorUI.UIComp.HTML.Button("w-full mx-2rem my-2rem p-2", "OK");
        btnOK.onclick = () => {
            localStorage.removeItem(IMAGE_LOCAL_STORAGE_KEY);
            this.resetCanvas();
            dia.close();
            window.editorUI.forceRerender();
        };
        let dia = new EditorUI.UIComp.Dialog(
            "Do you want to clear the canvas ?",
            EditorUI.UIComp.HTML.Div("w-full flex flex-row", [btnCancel, btnOK])
        );
        dia.show();
    }

    private async saveToImage(ctx: OffscreenCanvasRenderingContext2D, name: string): Promise<void> {

        let blob: Blob | null = null;
        if (typeof ctx.canvas.convertToBlob === "function") {
            blob = await ctx.canvas.convertToBlob({ type: "image/png" });
        } else {
            const fallback = document.createElement("canvas");
            fallback.width = ctx.canvas.width;
            fallback.height = ctx.canvas.height;
            const fallback_ctx = fallback.getContext("2d");
            if (fallback_ctx === null) throw new Error("Failed to get fallback export context");
            fallback_ctx.drawImage(ctx.canvas, 0, 0);
            blob = await new Promise<Blob | null>((resolve) => fallback.toBlob(resolve, "image/png"));
        }

        if (blob === null) throw new Error("Failed to generate export blob");

        const url = URL.createObjectURL(blob);
        try {
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    public save(): void {
        if (this.editing_engine.editing) this.editing_engine.stopEdit();
        let btnOK = EditorUI.UIComp.HTML.Button("w-full mx-2rem p-2", "OK");
        let txtName = EditorUI.UIComp.HTML.Text("w-full");
        let dia = new EditorUI.UIComp.Dialog(
            "Enter the name of image",
            EditorUI.UIComp.HTML.Div("w-fit flex flex-row", [
                txtName,
                EditorUI.UIComp.HTML.Span("whitespace", "  .png "),
                btnOK
            ])
        );
        btnOK.onclick = async () => {
            const export_layers = this.canvas_state.orderedLayers();
            const export_ctx = this.exporter.render(export_layers, this.canvas_state.Size);
            await this.saveToImage(export_ctx, `${txtName.value}.png`);
            dia.close();
        };
        dia.show();
    }

    public saveToLocalStorage(): void {
        const json = this.canvas_state.toJSON();
        console.log("Saving canvas state to localStorage", json);
        localStorage.setItem(IMAGE_LOCAL_STORAGE_KEY, JSON.stringify(json));
        localStorage.setItem(SAVE_TIME_LOCAL_STORAGE_KEY, new Date().toISOString());
    };
    public loadFromLocalStorage(): boolean {
        const raw = localStorage.getItem(IMAGE_LOCAL_STORAGE_KEY);
        if (!raw) return false;

        try {
            const json = JSON.parse(raw);
            if (!json || Object.keys(json).length === 0) return false;
            this.canvas_state.restoreFromJSON(json);
            return true;
        } catch (error) {
            console.warn("Failed to load canvas state from localStorage", error);
            return false;
        }
    };

    /** History */
    private undo_stk_history: HistoryLogEntry<GroupHistoryDiff>[] = new Array();
    private redo_stk_history: HistoryLogEntry<GroupHistoryDiff>[] = new Array();
    public undo(): void {
        // Get undo list and patch canvas_state
        if (this.undo_stk_history.length === 0) return;
        let undo_entry = this.undo_stk_history.pop();
        if (undo_entry === undefined) throw new Error("Unexpected undefined undo_entry");
        // Patch canvas state with undo_entry
        const layer = this.canvas_state.find(undo_entry.layerID);
        if (!layer) throw new Error(`Layer ${undo_entry.layerID} not found for undo`);
        const inverse_undo = layer.patch(undo_entry.data);
        this.redo_stk_history.push({
            layerID: undo_entry.layerID,
            objectName: undo_entry.layerID,
            data: inverse_undo,
        });
        // console.log("undo", this.undo_stk_history, "redo", this.redo_stk_history);
        this.requestRender();
    }
    public redo(): void {
        // Get redo list and patch canvas_state
        if (this.redo_stk_history.length === 0) return;
        let redo_entry = this.redo_stk_history.pop();
        if (redo_entry === undefined) throw new Error("Unexpected undefined redo_entry");
        // Patch canvas state with redo_entry
        const layer = this.canvas_state.find(redo_entry.layerID);
        if (!layer) throw new Error(`Layer ${redo_entry.layerID} not found for redo`);
        const inverse_redo = layer.patch(redo_entry.data);
        this.undo_stk_history.push({
            layerID: redo_entry.layerID,
            objectName: redo_entry.layerID,
            data: inverse_redo,
        });
        // console.log("undo", this.undo_stk_history, "redo", this.redo_stk_history);
        this.requestRender();
    }

    /** Editing */
    public startEdit(name: string): void {
        console.log("[DEB] Start Edit with tool", name);
        const preview_layer = new LayerData("preview", { globalCompositeOperation: "source-over" });
        // NOTE: The `diff` and `flush` is required, so that after editing, diff will always return action "update" with correct patch, even if the editing tool does not modify the preview layer (e.g. move tool)
        preview_layer.diff();
        preview_layer.flush();
        this.editing_engine.startEditWith(preview_layer, name);
        window.editorUI.forceRerender();
    }
    public stopEdit(): void {
        this.editing_engine.stopEdit();
        // window.editorUI.forceRerender();
    }
    public get editingName(): string {
        return this.editing_engine.currentEditingName;
    }
    public get settings(): EditorUI.Canvas.Setting {
        const rtv = this.editing_engine.Settings;
        console.log("Getting settings from EditorCanvas", rtv);
        return rtv;
    }
    public set settings(setting: EditorUI.Canvas.Setting) {
        this.editing_engine.Settings = setting;
    }

}
