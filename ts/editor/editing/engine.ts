/**
 * Created : 2026/03/26
 * Author  : Ting Fang, Tsai
 * About:
 *     EditingEngine  
 */
import EditorUI from "../../editorUI";
import { CanvasState } from "../state/canvas/canvas";
import { Layer } from "../state/canvas/data/layer";
import { NoOPEditable, type IEditable } from "./interface/editable";


export class EditingEngine {

    private editing_cvs_state?: CanvasState;
    constructor() {
        this.plugins = new Map<string, IEditable>();
        this.current_plugin = new NoOPEditable();
    }

    public reset() {
        this.editing_cvs_state = undefined;
        this.current_plugin = new NoOPEditable();
        this.on_cursor_changed_handler("default");
    }

    /** Plugins */
    private plugins: Map<string, IEditable>;
    private current_plugin: IEditable;
    public register(name: string, plugin: IEditable): void {
        /** Register plugins */
        this.plugins.set(name, plugin);
    }

    /** Edit */
    private current_editing_name: string = "noop";
    private current_editing_layer: string = "preview";
    public startEditWith(editLayer: Layer, name: string): void {
        // edit layer with plugin
        if (this.editing_cvs_state !== undefined) {
            if (this.current_plugin.StopEdit !== undefined)
                this.current_plugin.StopEdit(this.editing_cvs_state);
            this.stopEdit();
            if (this.current_plugin.StartEdit !== undefined)
                this.current_plugin.StartEdit(this.editing_cvs_state);
        }
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin with name '${name}' not found`);
        }
        this.current_editing_name = name;
        this.current_plugin = plugin;
        this.editing_cvs_state = new CanvasState({ name: "EditingCanvas" });
        this.current_editing_layer = editLayer.Name;
        this.editing_cvs_state.add(editLayer);
        this.editing_cvs_state.activate(editLayer.Name);

        this.on_cursor_changed_handler(plugin.CursorName || "default");
        // console.log("Changed cursor to", plugin.CursorName || "default");
    }
    public stopEdit(): void {
        if (this.editing_cvs_state === undefined) return;
        const preview_layer = this.editing_cvs_state.find(this.current_editing_layer);
        if (!preview_layer) throw new Error(`INTERNAL_ERROR: No preview layer in editing canvas state`);

        // Reset current editing session first. `finishEditing` handler may
        // immediately start a new session with the same tool.
        const current_editing_name = this.current_editing_name;
        this.current_editing_name = "noop";
        this.current_editing_layer = "preview";
        this.editing_cvs_state = undefined;
        this.current_plugin = new NoOPEditable();
        this.on_finish_editing_handler(current_editing_name, preview_layer);
    }
    public get currentEditingName(): string {
        return this.current_editing_name;
    }
    public set Settings(setting: EditorUI.Canvas.Setting) {
        if (this.editing_cvs_state === undefined) return;
        if (this.current_plugin.Settings !== undefined)
            this.current_plugin.Settings = setting;
        if (this.current_plugin.SettingsUpdate !== undefined)
            this.current_plugin.SettingsUpdate(this.editing_cvs_state, this.view_rot_degree);
    };
    public get Settings() {
        return this.current_plugin.Settings || {};
    };

    private view_rot_degree: number = 0;
    public pointDown(e: EditorUI.Canvas.PaintEvent): void {
        if (this.editing_cvs_state === undefined) return;
        this.view_rot_degree = e.rotDegree;
        if (this.current_plugin.PointerDown !== undefined) {
            // this.EventFired = true;
            this.current_plugin.PointerDown(this.editing_cvs_state, e);
        }
    }
    public pointMove(e: EditorUI.Canvas.PaintEvent): void {
        if (this.editing_cvs_state === undefined) return;
        this.view_rot_degree = e.rotDegree;
        if (this.current_plugin.PointerMove !== undefined) {
            this.current_plugin.PointerMove(this.editing_cvs_state, e);
        }
    }
    public pointUp(e: EditorUI.Canvas.PaintEvent): void {
        if (this.editing_cvs_state === undefined) return;
        this.view_rot_degree = e.rotDegree;
        if (this.current_plugin.PointerUp !== undefined) {
            this.current_plugin.PointerUp(this.editing_cvs_state, e);
        }
        if (this.editing_cvs_state === undefined) throw new Error(`No editing canvas state available`);
        if (this.current_plugin.CanFinishDrawing) {
            this.stopEdit();
        };
    }

    // properties
    public get editing(): boolean {
        // return if currently editing
        return this.editing_cvs_state !== undefined;
    }
    public get preview(): CanvasState {
        // throw new Error(`${this.constructor.name}.preview not implemented`);
        if (this.editing_cvs_state === undefined) throw new Error(`No editing canvas state available`);
        return this.editing_cvs_state;
    }

    // event
    private on_finish_editing_handler: FinishEditingEventHandler = () => { };
    private on_cursor_changed_handler: CursorChangedEventHandler = () => { };
    public on(eventType: "finishEditing", handler: FinishEditingEventHandler): void;
    public on(eventType: "cursorChanged", handler: CursorChangedEventHandler): void;
    public on(eventType: "finishEditing" | "cursorChanged", handler: FinishEditingEventHandler | CursorChangedEventHandler): void {
        if (eventType === "finishEditing") {
            this.on_finish_editing_handler = handler as FinishEditingEventHandler;
        }
        if (eventType === "cursorChanged") {
            this.on_cursor_changed_handler = handler as CursorChangedEventHandler;
        }
    }
};
type FinishEditingEventHandler = (editWith: string, ctx: Layer) => void;
type CursorChangedEventHandler = (cursor: string) => void;