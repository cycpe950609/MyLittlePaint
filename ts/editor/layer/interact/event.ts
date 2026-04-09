/**
 * Created : 2026/03/28
 * Author  : Ting Fang, Tsai
 * About:
 *  Events    
 */

import type { Point } from "../../utils/misc";

export enum ButtonIndex {
    Primary = "primary_0_left",
    MiddleWheel = "middle_1_wheel",
    Secondary = "second_2_right",
    BrowserBackward = "backward_3_fourth",
    BrowserForward = "forward_4_fifth",
}

export type PointType = "touch" | "mouse" | "pen";
export type PointEvent = {
    pointerId: number;
    offset: Point;
    type: PointType;
    pressure: number;
    button: ButtonIndex;
}
export const createPointEvent = (e: PointerEvent): PointEvent => {
    const pointerType = (type: string): "touch" | "mouse" | "pen" => {
        return (type === "touch" || type === "mouse" || type === "pen") ? type as "touch" | "mouse" | "pen" : "mouse";
    }
    const buttonType = (button: number): ButtonIndex => {
        switch (button) {
            case 0: return ButtonIndex.Primary;
            case 1: return ButtonIndex.MiddleWheel;
            case 2: return ButtonIndex.Secondary;
            case 3: return ButtonIndex.BrowserBackward;
            case 4: return ButtonIndex.BrowserForward;
            default: return ButtonIndex.Primary;
        }
    }

    const rect = (e.target as Element).getBoundingClientRect();
    const event: PointEvent = {
        pointerId: e.pointerId,
        offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        type: pointerType(e.pointerType),
        pressure: e.pressure,
        button: buttonType(e.button),
    }
    return event;
}

export type InteractDragEvent = {
    isStart: boolean;
    startPoint: Point;
    currentPoint: Point;
    delta: Point;
};

export type InteractClickEvent = {
    point: Point;
};

export type InteractMoveEvent = {
    point: Point;
};

export enum WheelDirection {
    Front,
    Back,
};
export type InteractWheelEvent = {
    point: Point;
    direction: WheelDirection;
    /** Keys */
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
};