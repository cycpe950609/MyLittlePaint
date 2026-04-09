/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  StylusEvent Handler 
 */

import type { Point } from "../../../utils/misc";
import { type InteractClickEvent, type InteractDragEvent, type PointEvent } from "../event";
import { ViewPoint, type ViewportConfig } from "../state/utils";
import { distanceSquare } from "../utils";
import { EventHandlerBase } from "./base";

export type StylusClickExtraEvent = {}
export type StylusClickHandler = (extra: StylusClickExtraEvent, e: InteractClickEvent) => void;
export type StylusDragExtraEvent = {}
export type StylusDragHandler = (extra: StylusDragExtraEvent, e: InteractDragEvent) => void;

export interface StylusHandlerMap {
    stylusDrag: StylusDragHandler;
    stylusUp: StylusClickHandler;
}

type EventData = {
    downOffset?: Point;
    isDragging: boolean;
};

export class StylusEventHandler extends EventHandlerBase {
    private static readonly DRAG_START_THRESHOLD_PX = 2;

    private event_handlers: {
        [K in keyof StylusHandlerMap]: StylusHandlerMap[K];
    } = {
            stylusDrag: (_e: StylusDragExtraEvent) => { },
            stylusUp: (_extra: StylusClickExtraEvent, _e: InteractClickEvent) => { },
        };

    private stylus_event_data: EventData;

    constructor() {
        super();

        this.stylus_event_data = {
            isDragging: false,
        };
    }

    protected on_pointer_down_handler(_prev_e: PointEvent, e: PointEvent, _viewport: ViewportConfig): void {
        if (e.type !== "pen") throw new Error(`Unexpect event type '${e.type}'`);
        const event_data = this.stylus_event_data;
        event_data.downOffset = structuredClone(e.offset);
        event_data.isDragging = false;
    }

    protected on_pointer_move_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        if (e.type !== "pen") throw new Error(`Unexpect event type '${e.type}'`);
        const event_data = this.stylus_event_data;
        if (event_data.downOffset === undefined) return;

        const move_distance_square = distanceSquare(event_data.downOffset, e.offset);
        const exceeds_drag_threshold = move_distance_square > StylusEventHandler.DRAG_START_THRESHOLD_PX ** 2;
        const isStart = !event_data.isDragging && exceeds_drag_threshold;
        if (exceeds_drag_threshold) event_data.isDragging = true;
        if (event_data.isDragging) {
            this.event_handlers["stylusDrag"]({}, {
                isStart: isStart,
                startPoint: new ViewPoint(event_data.downOffset, viewport).cvsPoint,
                currentPoint: new ViewPoint(e.offset, viewport).cvsPoint,
                delta: {
                    x: e.offset.x - prev_e.offset.x,
                    y: e.offset.y - prev_e.offset.y,
                },
            });
        }
    }

    protected on_pointer_up_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        if (e.type !== "pen") throw new Error(`Unexpect event type '${e.type}'`);
        const event_data = this.stylus_event_data;
        if (event_data.downOffset === undefined) return;

        if (!event_data.isDragging) {
            // This happened when stylus tap/click without dragging
            this.event_handlers["stylusDrag"]({}, {
                isStart: true,
                startPoint: new ViewPoint(event_data.downOffset, viewport).cvsPoint,
                currentPoint: new ViewPoint(e.offset, viewport).cvsPoint,
                delta: {
                    x: e.offset.x - prev_e.offset.x,
                    y: e.offset.y - prev_e.offset.y,
                },
            });
        }
        this.event_handlers["stylusUp"]({}, { point: new ViewPoint(e.offset, viewport).cvsPoint });

        event_data.downOffset = undefined;
        event_data.isDragging = false;
    }

    protected on_pointer_leave_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.on_pointer_up_handler(prev_e, e, viewport);
    }

    public on<K extends keyof StylusHandlerMap>(
        eventType: K,
        handler: StylusHandlerMap[K]
    ) {
        this.event_handlers[eventType] = handler;
    }
}
