/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  MouseEvent Handler     
 */

import type { Point } from "../../../utils/misc";
import { ButtonIndex, type InteractClickEvent, type InteractDragEvent, type InteractMoveEvent, type PointEvent } from "../event";
import { ViewPoint, type ViewportConfig } from "../state/utils";
import { distanceSquare } from "../utils";
import { EventHandlerBase } from "./base";

export type MouseClickExtraEvent = {
    // Click, DoubleClick, Up
    buttonId: ButtonIndex;
}
export type MouseClickHandler = (extra: MouseClickExtraEvent, e: InteractClickEvent) => void;
export type MouseDragExtraEvent = {
    buttonId: ButtonIndex;
}
export type MouseDragHandler = (extra: MouseDragExtraEvent, e: InteractDragEvent) => void;
export type MouseMoveExtraEvent = {}
export type MouseMoveHandler = (extra: MouseMoveExtraEvent, e: InteractMoveEvent) => void;

export type MouseInteractEvent = MouseClickExtraEvent | MouseDragExtraEvent | MouseMoveExtraEvent;
export type MouseInteractHandler = MouseClickHandler | MouseDragHandler | MouseMoveHandler;

export interface MouseHandlerMap {
    mouseClick: MouseClickHandler;
    mouseDoubleClick: MouseClickHandler;
    mouseDrag: MouseDragHandler;
    mouseMove: MouseMoveHandler;
    mouseUp: MouseClickHandler;
}

type EventData = {
    downOffset?: Point; // Point down offset, undefined if not point down.
    isDragging: boolean;
    clickedTime?: number; // last click time, undefined if not clicked yet  
};


export class MouseEventHandler extends EventHandlerBase {
    private static readonly DOUBLE_CLICK_THRESHOLD_MS = 300;
    private static readonly CLICK_MOVE_TOLERANCE_PX = 4;
    private static readonly DRAG_START_THRESHOLD_PX = 2;

    private event_handlers: {
        [K in keyof MouseHandlerMap]: MouseHandlerMap[K];
    } = {
            mouseClick: (_e: MouseClickExtraEvent, _click_e: InteractClickEvent) => { },
            mouseDoubleClick: (_e: MouseClickExtraEvent) => { },
            mouseDrag: (_e: MouseDragExtraEvent) => { },
            mouseMove: (_e: MouseMoveExtraEvent) => { },
            mouseUp: (_e: MouseClickExtraEvent) => { },
        };

    private mouse_event_data: Record<ButtonIndex, EventData>;
    private last_mouse_offset?: Point;

    constructor() {
        super();

        const default_event_data: EventData = {
            isDragging: false,
        };

        this.mouse_event_data = {
            [ButtonIndex.Primary]: structuredClone(default_event_data),
            [ButtonIndex.MiddleWheel]: structuredClone(default_event_data),
            [ButtonIndex.Secondary]: structuredClone(default_event_data),
            [ButtonIndex.BrowserBackward]: structuredClone(default_event_data),
            [ButtonIndex.BrowserForward]: structuredClone(default_event_data),
        }

        this.last_mouse_offset = undefined;
    }

    protected on_pointer_down_handler(_prev_e: PointEvent, e: PointEvent, _viewport: ViewportConfig): void {
        if (e.type !== "mouse") throw new Error(`Unexpect event type '${e.type}'`);
        let event_data = this.mouse_event_data[e.button];

        event_data.downOffset = structuredClone(e.offset);
        event_data.isDragging = false;
        this.last_mouse_offset = structuredClone(e.offset);

    }
    protected on_pointer_move_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        if (e.type !== "mouse") throw new Error(`Unexpect event type '${e.type}'`);
        let event_data = this.mouse_event_data[e.button];
        this.last_mouse_offset = structuredClone(e.offset);
        // const isDown = event_data.downOffset !== undefined;
        if (event_data.downOffset !== undefined) {
            const move_distance_square = distanceSquare(event_data.downOffset, e.offset);
            const exceeds_drag_threshold = move_distance_square > MouseEventHandler.DRAG_START_THRESHOLD_PX ** 2;
            const isStart = !event_data.isDragging && exceeds_drag_threshold;
            if (exceeds_drag_threshold) event_data.isDragging = true;
            if (event_data.isDragging) {
                this.event_handlers["mouseDrag"](
                    { buttonId: e.button },
                    {
                        isStart: isStart,
                        startPoint: new ViewPoint(event_data.downOffset, viewport).cvsPoint,
                        currentPoint: new ViewPoint(e.offset, viewport).cvsPoint,
                        delta: {
                            x: e.offset.x - prev_e.offset.x,
                            y: e.offset.y - prev_e.offset.y,
                        },
                    })
            }
        }
        else {
            this.event_handlers["mouseMove"]({}, { point: new ViewPoint(e.offset, viewport).cvsPoint })
        }
    }
    protected on_pointer_up_handler(_prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        if (e.type !== "mouse") throw new Error(`Unexpect event type '${e.type}'`);
        let event_data = this.mouse_event_data[e.button];
        this.last_mouse_offset = structuredClone(e.offset);

        if (event_data.downOffset === undefined) return;

        if (event_data.isDragging) {
            this.event_handlers["mouseUp"]({ buttonId: e.button }, { point: new ViewPoint(e.offset, viewport).cvsPoint })
        }
        else {
            const move_distance_square = distanceSquare(event_data.downOffset, e.offset);
            const is_click = move_distance_square <= MouseEventHandler.CLICK_MOVE_TOLERANCE_PX ** 2;

            if (is_click) {
                const now = Date.now();
                const time_since_last_click = event_data.clickedTime ? now - event_data.clickedTime : Infinity;

                if (time_since_last_click <= MouseEventHandler.DOUBLE_CLICK_THRESHOLD_MS) {
                    this.event_handlers["mouseDoubleClick"]({ buttonId: e.button }, { point: new ViewPoint(e.offset, viewport).cvsPoint });
                } else {
                    this.event_handlers["mouseClick"]({ buttonId: e.button }, { point: new ViewPoint(e.offset, viewport).cvsPoint });
                }
                event_data.clickedTime = now;
            }

        }
        event_data.downOffset = undefined;
        event_data.isDragging = false;

    }
    protected on_pointer_leave_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.on_pointer_up_handler(prev_e, e, viewport);
    }

    public emitOnViewChanged(viewport: ViewportConfig): void {
        if (this.last_mouse_offset === undefined) return;

        const drag_entry = (Object.entries(this.mouse_event_data) as Array<[ButtonIndex, EventData]>).find(([, data]) => data.downOffset !== undefined);
        if (drag_entry !== undefined) {
            const [buttonId, event_data] = drag_entry;
            const isStart = !event_data.isDragging;
            event_data.isDragging = true;
            this.event_handlers["mouseDrag"](
                { buttonId },
                {
                    isStart,
                    startPoint: new ViewPoint(event_data.downOffset!, viewport).cvsPoint,
                    currentPoint: new ViewPoint(this.last_mouse_offset, viewport).cvsPoint,
                    delta: { x: 0, y: 0 },
                }
            );
            return;
        }

        this.event_handlers["mouseMove"]({}, { point: new ViewPoint(this.last_mouse_offset, viewport).cvsPoint });
    }

    public on<K extends keyof MouseHandlerMap>(
        eventType: K,
        handler: MouseHandlerMap[K]
    ) {
        this.event_handlers[eventType] = handler;
    }

};
