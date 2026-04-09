/**
 * Created : 2026/03/26
 * Author  : Ting Fang, Tsai
 * About:
 *  InteractLayer     
 */

import { createPointEvent, WheelDirection, type InteractWheelEvent } from "./event";
import { MouseEventHandler, type MouseHandlerMap } from "./handler/mouse";
import { StylusEventHandler, type StylusHandlerMap } from "./handler/stylus";
import { TouchEventHandler, type TouchHandlerMap } from "./handler/touch";
import { ViewPoint, type ViewportConfig } from "./state/utils";
import { ViewState, type ViewChangedHandler } from "./state/view";

type EventHandlerLookup = {
    mouse: MouseEventHandler;
    pen: StylusEventHandler;
    touch: TouchEventHandler;
};
// TODO: GestureEvent
export class InteractViewLayer {

    private event_cnt !: HTMLDivElement;
    private view_state: ViewState;

    private event_handlers: EventHandlerLookup;
    private on_view_changed_handler: ViewChangedHandler = () => { };

    constructor() {
        this.event_cnt = document.createElement("div");
        this.event_cnt.style.width = "100%";
        this.event_cnt.style.height = "100%";
        this.event_cnt.style.position = "fixed";
        this.event_cnt.style.left = "0";
        this.event_cnt.style.top = "0";
        this.event_cnt.style.touchAction = "none";
        this.event_cnt.style.userSelect = "none";

        this.event_cnt.addEventListener("contextmenu", (e) => { e.preventDefault(); });
        this.event_cnt.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        this.event_cnt.addEventListener("pointermove", (e) => this.onPointerMove(e));
        this.event_cnt.addEventListener("pointerup", (e) => this.onPointerUp(e));
        this.event_cnt.addEventListener("pointerleave", (e) => this.onPointerLeave(e));
        this.event_cnt.addEventListener("wheel", (e) => this.onMouseWheelChanged(e));


        this.event_handlers = {
            "mouse": new MouseEventHandler(),
            "pen": new StylusEventHandler(),
            "touch": new TouchEventHandler(),
        }

        this.view_state = new ViewState({ viewChangedCallback: (viewport) => this.onViewChanged(viewport) });
    }

    private onViewChanged(viewport: ViewportConfig) {
        this.event_handlers["mouse"].emitOnViewChanged(viewport);
        this.on_view_changed_handler(viewport);
    }

    /** Private EventHandler */
    private onPointerDown(e: PointerEvent) {
        const event = createPointEvent(e);
        const viewport = this.view_state.ViewportConfig;
        this.event_handlers[event.type].processPointerDown(event, viewport);
        (e.target as Element).setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
    }
    private onPointerMove(e: PointerEvent) {
        const event = createPointEvent(e);
        const viewport = this.view_state.ViewportConfig;
        this.event_handlers[event.type].processPointerMove(event, viewport);
        e.preventDefault();
        e.stopPropagation();
    }
    private onPointerUp(e: PointerEvent) {
        const event = createPointEvent(e);
        const viewport = this.view_state.ViewportConfig;
        this.event_handlers[event.type].processPointerUp(event, viewport);
        e.preventDefault();
        e.stopPropagation();
    }
    private onPointerLeave(e: PointerEvent) {
        const event = createPointEvent(e);
        const viewport = this.view_state.ViewportConfig;
        this.event_handlers[event.type].processPointerLeave(event, viewport);
        e.preventDefault();
        e.stopPropagation();
    }
    /** Wheel */
    private on_mouse_wheel_handler: (e: InteractWheelEvent) => void = (_e) => { };
    private onMouseWheelChanged(e: WheelEvent) {
        const viewport = this.view_state.ViewportConfig;
        const point = new ViewPoint({ x: e.offsetX, y: e.offsetY }, viewport).cvsPoint;
        const direction = (e.deltaY < 0) ? WheelDirection.Front : WheelDirection.Back;
        this.on_mouse_wheel_handler({
            point,
            direction: direction,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
        });
        e.preventDefault();
        e.stopPropagation();
    }

    public get element(): HTMLDivElement {
        return this.event_cnt;
    }

    public get View(): ViewState {
        return this.view_state;
    }

    /** Cursor Name */
    private _cursorName: string = "default";
    public get cursorName(): string {
        return this._cursorName;
    }
    public set cursorName(name: string) {
        this._cursorName = name;
        const browserCursor = [
            "alias", "all-scroll", "auto", "cell", "col-resize", "context-menu",
            "copy", "crosshair", "default", "e-resize", "ew-resize", "grab",
            "grabbing", "help", "move", "n-resize", "ne-resize", "nesw-resize",
            "ns-resize", "nw-resize", "nwse-resize", "no-drop", "none", "not-allowed",
            "pointer", "progress", "row-resize", "s-resize", "se-resize",
            "sw-resize", "text", "w-resize", "wait", "zoom-in", "zoom-out"
        ];

        if (browserCursor.includes(name)) {
            console.log(`CursorName ${name} in list`);
            this.event_cnt.style.cursor = name;
        } else {
            console.log(`CursorName ${name} not in list`);
            this.event_cnt.style.cursor = `url(img/cursor/${name}.cur), auto`;
        }
    }

    /** Event Handlers */
    public on(
        eventType: "mouseWheel",
        handler: (e: InteractWheelEvent) => void
    ): void;
    public on(
        eventType: "viewChanged",
        handler: ViewChangedHandler
    ): void;
    public on<K extends keyof MouseHandlerMap>(
        eventType: K,
        handler: MouseHandlerMap[K]
    ): void;
    public on<K extends keyof StylusHandlerMap>(
        eventType: K,
        handler: StylusHandlerMap[K]
    ): void;
    public on<K extends keyof TouchHandlerMap>(
        eventType: K,
        handler: TouchHandlerMap[K]
    ): void;
    public on(
        eventType: "mouseWheel" | "viewChanged" | keyof MouseHandlerMap | keyof StylusHandlerMap | keyof TouchHandlerMap,
        handler: any
    ) {
        if (["mouseWheel"].includes(eventType as string)) {
            this.on_mouse_wheel_handler = handler;
        }
        if (["viewChanged"].includes(eventType as string)) {
            this.on_view_changed_handler = handler;
        }
        if (["mouseClick", "mouseDoubleClick", "mouseDrag", "mouseMove", "mouseUp"].includes(eventType as string)) {
            this.event_handlers["mouse"].on(eventType as keyof MouseHandlerMap, handler);
        }
        if (["stylusUp", "stylusDrag"].includes(eventType as string)) {
            this.event_handlers["pen"].on(eventType as keyof StylusHandlerMap, handler);
        }
        if (["touchClick", "touchLongPress", "touchUp", "touchDrag", "touchPinch", "touchTwoFingerClick"].includes(eventType as string)) {
            this.event_handlers["touch"].on(eventType as keyof TouchHandlerMap, handler);
        }
    }
};
