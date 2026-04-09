/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  TouchEvent Handler
 */

import type { Point } from "../../../utils/misc";
import { type InteractClickEvent, type InteractDragEvent, type PointEvent } from "../event";
import { ViewPoint, type ViewportConfig } from "../state/utils";
import { distanceSquare } from "../utils";
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
    distance: number;
    scale: number;
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
    currentOffset: Point;
    isDragging: boolean;
    isLongPressed: boolean;
};

type PinchData = {
    pointerIds: [number, number];
    startDistance: number;
    lastDistance: number;
};

type TwoFingerClickData = {
    pointerIds: [number, number];
    startOffsets: [Point, Point];
    latestOffsets: [Point, Point];
    startTime: number;
    maxMoveSquare: number;
    hasPinched: boolean;
};

export class TouchEventHandler extends EventHandlerBase {
    private static readonly CLICK_MOVE_TOLERANCE_PX = 8;
    private static readonly DRAG_START_THRESHOLD_PX = 4;
    private static readonly LONG_PRESS_THRESHOLD_MS = 500;
    private static readonly PINCH_START_THRESHOLD_PX = 4;
    private static readonly TWO_FINGER_CLICK_THRESHOLD_MS = 300;

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

    private activeTouches: Map<number, TouchPointerData> = new Map();
    private longPressTimer: ReturnType<typeof setTimeout> | undefined;
    private singleTouchPointerId: number | undefined;
    private pinchData: PinchData | undefined;
    private twoFingerClickData: TwoFingerClickData | undefined;
    private lastViewportConfig: ViewportConfig = {
        center: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        scale: 1,
        rotDeg: 0,
    };

    protected on_pointer_down_handler(_prev_e: PointEvent, e: PointEvent, _viewport: ViewportConfig): void {
        this.lastViewportConfig = structuredClone(_viewport);
        if (e.type !== "touch") throw new Error(`Unexpect event type '${e.type}'`);

        const now = Date.now();
        const offset = clonePoint(e.offset);
        this.activeTouches.set(e.pointerId, {
            startOffset: offset,
            currentOffset: offset,
            isDragging: false,
            isLongPressed: false,
        });

        if (this.activeTouches.size === 1) {
            this.singleTouchPointerId = e.pointerId;
            this.startLongPressTimer(e.pointerId);
            return;
        }

        this.stopLongPressTimer();
        this.singleTouchPointerId = undefined;

        if (this.activeTouches.size === 2) {
            const pair = this.getFirstTwoTouches();
            if (pair === undefined) return;

            const [a, b] = pair;
            const startDistance = Math.sqrt(distanceSquare(a.currentOffset, b.currentOffset));
            this.pinchData = {
                pointerIds: [a.pointerId, b.pointerId],
                startDistance,
                lastDistance: startDistance,
            };
            this.twoFingerClickData = {
                pointerIds: [a.pointerId, b.pointerId],
                startOffsets: [clonePoint(a.startOffset), clonePoint(b.startOffset)],
                latestOffsets: [clonePoint(a.currentOffset), clonePoint(b.currentOffset)],
                startTime: now,
                maxMoveSquare: 0,
                hasPinched: false,
            };
        }
    }

    protected on_pointer_move_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.lastViewportConfig = structuredClone(viewport);
        if (e.type !== "touch") throw new Error(`Unexpect event type '${e.type}'`);

        const data = this.activeTouches.get(e.pointerId);
        if (data === undefined) return;

        data.currentOffset = clonePoint(e.offset);
        const moveDistanceSquare = distanceSquare(data.startOffset, data.currentOffset);
        const exceeds_drag_threshold = moveDistanceSquare > TouchEventHandler.DRAG_START_THRESHOLD_PX ** 2;
        const isStart = !data.isDragging && exceeds_drag_threshold;

        if (moveDistanceSquare > TouchEventHandler.DRAG_START_THRESHOLD_PX ** 2) {
            data.isDragging = true;
            this.stopLongPressTimer();
        }

        if (
            this.singleTouchPointerId === e.pointerId
            && this.activeTouches.size === 1
            && data.isDragging
        ) {
            this.event_handlers["touchDrag"]({ pointerId: e.pointerId }, {
                isStart: isStart,
                startPoint: new ViewPoint(data.startOffset, viewport).cvsPoint,
                currentPoint: new ViewPoint(data.currentOffset, viewport).cvsPoint,
                delta: {
                    x: e.offset.x - prev_e.offset.x,
                    y: e.offset.y - prev_e.offset.y,
                },
            });
            return;
        }

        if (this.activeTouches.size >= 2) {
            const pair = this.getFirstTwoTouches();
            if (pair === undefined) return;

            const [a, b] = pair;
            const distance = Math.sqrt(distanceSquare(a.currentOffset, b.currentOffset));

            if (this.pinchData === undefined || !samePair(this.pinchData.pointerIds, [a.pointerId, b.pointerId])) {
                this.pinchData = {
                    pointerIds: [a.pointerId, b.pointerId],
                    startDistance: distance,
                    lastDistance: distance,
                };
            }

            if (this.twoFingerClickData !== undefined) {
                const firstMoveSquare = distanceSquare(this.twoFingerClickData.startOffsets[0], a.currentOffset);
                const secondMoveSquare = distanceSquare(this.twoFingerClickData.startOffsets[1], b.currentOffset);
                this.twoFingerClickData.maxMoveSquare = Math.max(
                    this.twoFingerClickData.maxMoveSquare,
                    firstMoveSquare,
                    secondMoveSquare,
                );
                this.twoFingerClickData.latestOffsets = [clonePoint(a.currentOffset), clonePoint(b.currentOffset)];
            }

            if (
                Math.abs(distance - this.pinchData.startDistance) >= TouchEventHandler.PINCH_START_THRESHOLD_PX
                || this.pinchData.lastDistance !== distance
            ) {
                if (this.twoFingerClickData !== undefined
                    && Math.abs(distance - this.pinchData.startDistance) >= TouchEventHandler.PINCH_START_THRESHOLD_PX) {
                    this.twoFingerClickData.hasPinched = true;
                }

                const centerPoint = new ViewPoint(midpoint(a.currentOffset, b.currentOffset), viewport).cvsPoint;
                const scale = this.pinchData.startDistance > 0
                    ? distance / this.pinchData.startDistance
                    : 1;

                this.event_handlers["touchPinch"]({
                    pointerIds: [a.pointerId, b.pointerId],
                    centerPoint,
                    distance,
                    scale,
                });
                this.pinchData.lastDistance = distance;
            }
        }
    }

    protected on_pointer_up_handler(_prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.lastViewportConfig = structuredClone(viewport);
        if (e.type !== "touch") throw new Error(`Unexpect event type '${e.type}'`);

        const data = this.activeTouches.get(e.pointerId);
        if (data === undefined) return;

        this.stopLongPressTimer();

        this.event_handlers["touchUp"]({ pointerId: e.pointerId }, { point: new ViewPoint(e.offset, viewport).cvsPoint, });

        const wasSingleTouch = this.singleTouchPointerId === e.pointerId && this.activeTouches.size === 1;
        if (wasSingleTouch) {
            const moveDistanceSquare = distanceSquare(data.startOffset, e.offset);
            const isClick = moveDistanceSquare <= TouchEventHandler.CLICK_MOVE_TOLERANCE_PX ** 2;
            if (isClick && !data.isDragging && !data.isLongPressed) {
                this.event_handlers["touchClick"]({ pointerId: e.pointerId, }, { point: new ViewPoint(e.offset, viewport).cvsPoint });
            }
        }

        this.activeTouches.delete(e.pointerId);

        if (this.activeTouches.size === 0) {
            this.finalizeTwoFingerClick();
            this.singleTouchPointerId = undefined;
            this.pinchData = undefined;
            return;
        }

        if (this.activeTouches.size === 1) {
            const first = this.activeTouches.values().next().value as TouchPointerData | undefined;
            const pointerId = this.activeTouches.keys().next().value as number | undefined;
            if (first !== undefined && pointerId !== undefined) {
                this.singleTouchPointerId = pointerId;
                if (!first.isDragging) this.startLongPressTimer(pointerId);
            }
            this.pinchData = undefined;
            return;
        }

        this.singleTouchPointerId = undefined;
        this.pinchData = undefined;
    }

    protected on_pointer_leave_handler(prev_e: PointEvent, e: PointEvent, viewport: ViewportConfig): void {
        this.lastViewportConfig = structuredClone(viewport);
        this.on_pointer_up_handler(prev_e, e, viewport);
    }

    public on<K extends keyof TouchHandlerMap>(
        eventType: K,
        handler: TouchHandlerMap[K]
    ) {
        this.event_handlers[eventType] = handler;
    }

    private startLongPressTimer(pointerId: number): void {
        this.stopLongPressTimer();
        this.longPressTimer = setTimeout(() => {
            const data = this.activeTouches.get(pointerId);
            if (data === undefined) return;
            if (this.activeTouches.size !== 1) return;
            if (this.singleTouchPointerId !== pointerId) return;

            const moveDistanceSquare = distanceSquare(data.startOffset, data.currentOffset);
            if (data.isDragging || moveDistanceSquare > TouchEventHandler.CLICK_MOVE_TOLERANCE_PX ** 2) return;

            data.isLongPressed = true;
            this.event_handlers["touchLongPress"]({
                pointerId,
                point: new ViewPoint(data.currentOffset, this.lastViewportConfig).cvsPoint,
                durationMs: TouchEventHandler.LONG_PRESS_THRESHOLD_MS,
            });
        }, TouchEventHandler.LONG_PRESS_THRESHOLD_MS);
    }

    private stopLongPressTimer(): void {
        if (this.longPressTimer !== undefined) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = undefined;
        }
    }

    private finalizeTwoFingerClick(): void {
        const data = this.twoFingerClickData;
        this.twoFingerClickData = undefined;
        if (data === undefined) return;

        const duration = Date.now() - data.startTime;
        const isQuick = duration <= TouchEventHandler.TWO_FINGER_CLICK_THRESHOLD_MS;
        const isStable = data.maxMoveSquare <= TouchEventHandler.CLICK_MOVE_TOLERANCE_PX ** 2;
        if (!isQuick || !isStable || data.hasPinched) return;

        this.event_handlers["touchTwoFingerClick"]({
            pointerIds: data.pointerIds,
            centerPoint: new ViewPoint(midpoint(data.latestOffsets[0], data.latestOffsets[1]), this.lastViewportConfig).cvsPoint,
        });
    }

    private getFirstTwoTouches(): [
        { pointerId: number } & TouchPointerData,
        { pointerId: number } & TouchPointerData,
    ] | undefined {
        const iterator = this.activeTouches.entries();
        const a = iterator.next();
        const b = iterator.next();
        if (a.done || b.done) return undefined;

        return [
            { pointerId: a.value[0], ...a.value[1] },
            { pointerId: b.value[0], ...b.value[1] },
        ];
    }
}

const clonePoint = (p: Point): Point => ({ x: p.x, y: p.y });

const midpoint = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
});

const samePair = (a: [number, number], b: [number, number]): boolean => {
    return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
};
