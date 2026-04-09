/**
 * Created : 2026/03/30
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass for Event Handler     
 */

import { ButtonIndex, type PointEvent } from "../event";
import type { ViewportConfig } from "../state/utils";


export class EventHandlerBase {
    private is_enable: boolean = true;
    private prev_event: PointEvent; // previous event

    constructor() {
        this.prev_event = {
            pointerId: -1,
            offset: { x: 0, y: 0 },
            type: "mouse",
            pressure: 0,
            button: ButtonIndex.Primary,
        }
    }

    public enable(): void {
        this.is_enable = true;
    }
    public disable(): void {
        this.is_enable = false;
    }

    public processPointerDown(e: PointEvent, viewport: ViewportConfig): void {
        if (this.is_enable)
            this.on_pointer_down_handler(this.prev_event, e, viewport);
        this.prev_event = structuredClone(e);
    }
    public processPointerMove(e: PointEvent, viewport: ViewportConfig): void {
        if (this.is_enable)
            this.on_pointer_move_handler(this.prev_event, e, viewport);
        this.prev_event = structuredClone(e);
    }
    public processPointerUp(e: PointEvent, viewport: ViewportConfig): void {
        if (this.is_enable)
            this.on_pointer_up_handler(this.prev_event, e, viewport);
        this.prev_event = structuredClone(e);
    }
    public processPointerLeave(e: PointEvent, viewport: ViewportConfig): void {
        if (this.is_enable)
            this.on_pointer_leave_handler(this.prev_event, e, viewport);
        this.prev_event = structuredClone(e);
    }

    /** Private process handler */
    protected on_pointer_down_handler(_prev_e: PointEvent, _e: PointEvent, _viewport: ViewportConfig): void {
        throw new Error(`${typeof this}.onPointerDownHandler`);
    };
    protected on_pointer_move_handler(_prev_e: PointEvent, _e: PointEvent, _viewport: ViewportConfig): void {
        throw new Error(`${typeof this}.onPointerMoveHandler`);
    };
    protected on_pointer_up_handler(_prev_e: PointEvent, _e: PointEvent, _viewport: ViewportConfig): void {
        throw new Error(`${typeof this}.onPointerUpHandler`);
    };
    protected on_pointer_leave_handler(_prev_e: PointEvent, _e: PointEvent, _viewport: ViewportConfig): void {
        throw new Error(`${typeof this}.onPointerLeaveHandler`);
    };

};