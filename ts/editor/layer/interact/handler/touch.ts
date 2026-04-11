/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  TouchEvent Handler
 */

import { max } from "lodash";
import { radianToDegree } from "../../../utils/coordinate";
import type { Point } from "../../../utils/misc";
import { type InteractClickEvent, type InteractDragEvent, type PointEvent } from "../event";
import { ViewPoint, type ViewportConfig } from "../state/utils";
import { distance } from "../utils";
import { EventHandlerBase } from "./base";

export type TouchClickExtraEvent = {
    pointerId: number;
};
export type TouchClickHandler = (extra: TouchClickExtraEvent, e: InteractClickEvent) => void;

export type TouchLongPressEvent = {
    pointerId: number;
    point: Point;
    durationMs: number;
};
export type TouchLongPressHandler = (e: TouchLongPressEvent) => void;

export type TouchUpExtraEvent = {
    pointerId: number;
};
export type TouchUpHandler = (extra: TouchUpExtraEvent, e: InteractClickEvent) => void;

export type TouchDragExtraEvent = {
    pointerId: number;
};
export type TouchDragHandler = (extra: TouchDragExtraEvent, e: InteractDragEvent) => void;

export type TouchPinchEvent = {
    pointerIds: [number, number];
    centerPoint: Point;
    scale: number;
    rotDegree: number;
    delta: {
        scale: number;
        rotDegree: number;
        offset: Point;
    }
};
export type TouchPinchHandler = (e: TouchPinchEvent) => void;

export type TouchTwoFingerClickEvent = {
    pointerIds: [number, number];
    centerPoint: Point;
};
export type TouchTwoFingerClickHandler = (e: TouchTwoFingerClickEvent) => void;

export interface TouchHandlerMap {
    touchClick: TouchClickHandler;
    touchLongPress: TouchLongPressHandler;
    touchUp: TouchUpHandler;
    touchDrag: TouchDragHandler;
    touchPinch: TouchPinchHandler;
    touchTwoFingerClick: TouchTwoFingerClickHandler;
}

type TouchPointerData = {
    startOffset: Point;
    startTime: number;
    prevOffset: Point;
    currentOffset: Point;
    upTime: number;
    // For drag event
    isDragging: boolean;
};

export class TouchEventHandler extends EventHandlerBase {


    private event_handlers: {
        [K in keyof TouchHandlerMap]: TouchHandlerMap[K];
    } = {
            touchClick: (_extra: TouchClickExtraEvent, _e: InteractClickEvent) => { },
            touchLongPress: (_e: TouchLongPressEvent) => { },
            touchUp: (_extra: TouchUpExtraEvent, _e: InteractClickEvent) => { },
            touchDrag: (_extra: TouchDragExtraEvent, _e: InteractDragEvent) => { },
            touchPinch: (_e: TouchPinchEvent) => { },
            touchTwoFingerClick: (_e: TouchTwoFingerClickEvent) => { },
        };

    constructor() {
        super();
        this.current_viewport = {
            center: { x: 0, y: 0 },
            size: { width: 0, height: 0 },
            scale: 1.0,
            rotDeg: 0.0,
        };
    }


    protected on_pointer_down_handler(_prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        console.log("touch down", e.pointerId);
        this.current_viewport = structuredClone(viewport);
        this.activeAllTouches.set(e.pointerId, {
            startOffset: { x: e.offset.x, y: e.offset.y },
            prevOffset: { x: e.offset.x, y: e.offset.y },
            currentOffset: { x: e.offset.x, y: e.offset.y },
            startTime: Date.now(),
            upTime: 0,
            isDragging: false,
        });
        this.touchesOrder.set(e.pointerId, this.maxTouchOrder + 1);
        this.requestEventProcess();
    }

    protected on_pointer_move_handler(_prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.current_viewport = structuredClone(viewport);
        const touchData = this.get_touch_event(e.pointerId);
        if (touchData) {
            touchData.currentOffset = { x: e.offset.x, y: e.offset.y };
        }
        this.requestEventProcess();
    }

    protected on_pointer_up_handler(_prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.current_viewport = structuredClone(viewport);
        const touchData = this.get_touch_event(e.pointerId);
        if (touchData) {
            touchData.upTime = Date.now();
        }
        this.requestEventProcess();
    }

    protected on_pointer_leave_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.on_pointer_up_handler(prev_e, e, viewport);
    }

    /** Event processing */
    private is_process_requested: boolean = false;
    private requestEventProcess(): void {
        if (!this.is_process_requested) {
            this.is_process_requested = true;
            requestAnimationFrame(() => {
                this.is_process_requested = false;
                this.processEvents();
            });
        }
    }

    // private static readonly CLICK_MOVE_TOLERANCE_PX = 8;
    private static readonly DRAG_START_THRESHOLD_PX = 8;
    private static readonly CLICK_PRESS_THRESHOLD_MS = 250;
    private static readonly LONG_PRESS_THRESHOLD_MS = 1000;
    // private static readonly PINCH_START_THRESHOLD_PX = 4;
    // private static readonly TWO_FINGER_CLICK_THRESHOLD_MS = 300;

    private current_viewport: ViewportConfig;

    private touchesOrder: Map<number, number> = new Map();
    private get totalTouches() {
        return Array.from(this.touchesOrder.values()).length;
    }
    private get maxTouchOrder() {
        return max(Array.from(this.touchesOrder.values())) ?? 0;
    }
    private processEvents(): void {
        // Process event every frame
        this.process_and_emit_all_events();
        this.process_and_emit_drag_events();
        this.process_and_emit_pinch_events();
        this.process_and_emit_click_events();
    }

    private get_touch_event(pointerId: number): TouchPointerData | undefined {
        if (this.activeAllTouches.has(pointerId)) return this.activeAllTouches.get(pointerId)!;
        if (this.activeDragTouches.has(pointerId)) return this.activeDragTouches.get(pointerId)!;
        if (this.activePinchTouches.has(pointerId)) return this.activePinchTouches.get(pointerId)!;
        if (this.activeUpTouches.has(pointerId)) return this.activeUpTouches.get(pointerId)!;
        return undefined;
    }

    // Unclassified
    private activeAllTouches: Map<number, TouchPointerData> = new Map();
    private process_and_emit_all_events() {
        // Not classified event
        // NOTE: PointUp: move event to a `buffer`, process in `processClickEvent`
        // NOTE: PointMove: move event to a `buffer`, process in `processDragEvent`
        Array.from(this.activeAllTouches.keys()).forEach((pointerId: number) => {
            const data = this.activeAllTouches.get(pointerId);
            if (data === undefined) return; // already deleted
            const pointUp: boolean = data.startTime < data.upTime;
            const isDragging: boolean = distance(data.startOffset, data.currentOffset) > TouchEventHandler.DRAG_START_THRESHOLD_PX;
            if (pointUp) {
                this.activeUpTouches.set(pointerId, data);
                this.activeAllTouches.delete(pointerId);
            }
            else if (isDragging) {
                // If more than 1 touch, move first two event to pinch buffer
                if (this.totalTouches >= 2 && !this.hasPinchEvent) {
                    // Move first two touches to pinch buffer
                    let firstTwoTouches: number[] = [pointerId];
                    Array.from(this.activeAllTouches.keys()).forEach((pointerId: number) => {
                        if (firstTwoTouches.length < 2 && !firstTwoTouches.includes(pointerId)) {
                            firstTwoTouches.push(pointerId);
                        }
                    });

                    const touchData1 = this.activeAllTouches.get(firstTwoTouches[0])!;
                    const touchData2 = this.activeAllTouches.get(firstTwoTouches[1])!;

                    console.log("Start Pinch event", this.totalTouches, firstTwoTouches, Array.from(this.activeAllTouches.keys()));
                    this.activePinchTouches.set(firstTwoTouches[0], touchData1);
                    this.activePinchTouches.set(firstTwoTouches[1], touchData2);
                    this.activeAllTouches.delete(firstTwoTouches[0]);
                    this.activeAllTouches.delete(firstTwoTouches[1]);
                }
                else {
                    this.activeDragTouches.set(pointerId, {
                        ...data,
                        isDragging: false,
                        prevOffset: structuredClone(data.currentOffset),
                    });
                    this.activeAllTouches.delete(pointerId);
                }
            }
            data.prevOffset = structuredClone(data.currentOffset);
        });
    }
    // Drag-based events
    private activePinchTouches: Map<number, TouchPointerData> = new Map();
    private get hasPinchEvent() {
        return this.activePinchTouches.size > 0;
    }
    private get pinchEvents(): [TouchPointerData, TouchPointerData] {
        const touchData = Array.from(this.activePinchTouches.values());
        if (touchData.length !== 2) throw new Error(`Invalid pinch touch data length ${touchData.length}`);
        return touchData as [TouchPointerData, TouchPointerData];
    }
    private get pinchKeys(): [number, number] {
        const keys = Array.from(this.activePinchTouches.keys());
        if (keys.length !== 2) throw new Error(`Invalid pinch touch keys length ${keys.length}`);
        return keys as [number, number];
    }
    private process_and_emit_pinch_events() {
        if (this.hasPinchEvent) {
            if(this.activePinchTouches.size !== 2) throw new Error(`Invalid pinch touch data length ${this.activePinchTouches.size}`);
            const [touch1, touch2] = this.pinchEvents;
            const pointUp = touch1.startTime < touch1.upTime || touch2.startTime < touch2.upTime;
            if (pointUp) {
                Array.from(this.activePinchTouches.keys()).forEach((pointerId: number) => {
                    this.activePinchTouches.delete(pointerId);
                    this.touchesOrder.delete(pointerId);
                });
            }
            else {
                const origDistance = distance(touch1.startOffset, touch2.startOffset);
                const prevDistance = distance(touch1.prevOffset, touch2.prevOffset);
                const prev_scale = prevDistance / origDistance;
                const prev_degree = Math.atan2(
                    touch2.prevOffset.y - touch1.prevOffset.y,
                    touch2.prevOffset.x - touch1.prevOffset.x,
                );
                const curDistance = distance(touch1.currentOffset, touch2.currentOffset);
                const cur_scale = curDistance / origDistance;
                const cur_degree = Math.atan2(
                    touch2.currentOffset.y - touch1.currentOffset.y,
                    touch2.currentOffset.x - touch1.currentOffset.x,
                );
                const prevCenterPoint = {
                    x: (touch1.prevOffset.x + touch2.prevOffset.x) / 2,
                    y: (touch1.prevOffset.y + touch2.prevOffset.y) / 2,
                };
                const currentCenterPoint = {
                    x: (touch1.currentOffset.x + touch2.currentOffset.x) / 2,
                    y: (touch1.currentOffset.y + touch2.currentOffset.y) / 2,
                };
                this.event_handlers["touchPinch"]({
                    pointerIds: this.pinchKeys,
                    centerPoint: new ViewPoint(currentCenterPoint, this.current_viewport).cvsPoint,
                    scale: cur_scale,
                    rotDegree: radianToDegree(cur_degree),
                    delta: {
                        scale: cur_scale - prev_scale,
                        rotDegree: radianToDegree(cur_degree - prev_degree),
                        offset: {
                            x: currentCenterPoint.x - prevCenterPoint.x,
                            y: currentCenterPoint.y - prevCenterPoint.y,
                        }
                    }
                });
            }
            touch1.prevOffset = structuredClone(touch1.currentOffset);
            touch2.prevOffset = structuredClone(touch2.currentOffset);
        }
    }
    private activeDragTouches: Map<number, TouchPointerData> = new Map();
    private process_and_emit_drag_events() {
        // Drag
        Array.from(this.activeDragTouches.keys()).forEach((pointerId: number) => {
            const data: TouchPointerData = this.activeDragTouches.get(pointerId)!;
            const pointUp: boolean = data.startTime < data.upTime;
            if (pointUp) {
                this.event_handlers["touchUp"]({ pointerId: pointerId }, { point: new ViewPoint(data.currentOffset, this.current_viewport).cvsPoint, });
                this.activeDragTouches.delete(pointerId);
                this.touchesOrder.delete(pointerId);
            }
            else {
                this.event_handlers["touchDrag"]({ pointerId: pointerId }, {
                    isStart: !data.isDragging,
                    startPoint: new ViewPoint(data.startOffset, this.current_viewport).cvsPoint,
                    currentPoint: new ViewPoint(data.currentOffset, this.current_viewport).cvsPoint,
                    delta: {
                        x: data.currentOffset.x - data.prevOffset.x,
                        y: data.currentOffset.y - data.prevOffset.y,
                    },
                });
                data.isDragging = true;
            }
            data.prevOffset = structuredClone(data.currentOffset);
        });
    }
    // Up-base events
    private activeUpTouches: Map<number, TouchPointerData> = new Map();
    private process_and_emit_click_events() {
        // Click, LongPress
        // TODO: Add two finger click event
        Array.from(this.activeUpTouches.keys()).forEach((pointerId: number) => {
            const data: TouchPointerData = this.activeUpTouches.get(pointerId)!;
            const duration = data.upTime - data.startTime;
            if (duration <= TouchEventHandler.CLICK_PRESS_THRESHOLD_MS) {
                this.event_handlers["touchClick"]({ pointerId: pointerId }, { point: new ViewPoint(data.currentOffset, this.current_viewport).cvsPoint });
            }
            else if (duration >= TouchEventHandler.LONG_PRESS_THRESHOLD_MS) {
                this.event_handlers["touchLongPress"]({ pointerId: pointerId, point: new ViewPoint(data.currentOffset, this.current_viewport).cvsPoint, durationMs: duration });
            }
            this.activeUpTouches.delete(pointerId);
            this.touchesOrder.delete(pointerId);
        });
    }

    public on<K extends keyof TouchHandlerMap>(
        eventType: K,
        handler: TouchHandlerMap[K]
    ) {
        this.event_handlers[eventType] = handler;
    }
}
