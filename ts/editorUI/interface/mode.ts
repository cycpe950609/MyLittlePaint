import { type CanvasBase, NoOPCanvas } from "../canvas";
import type FunctionInterface from "./function";
import type SidebarInterface from "./sidebar";

export interface ModeFunctionBase {
    MenuToolbarLeft?: FunctionInterface[];
    // Middle is mode selector
    MenuToolbarRight?: FunctionInterface[];
    LeftToolbarTop?: FunctionInterface[];
    LeftToolbarBottom?: FunctionInterface[];

    RightToolbarTop?: SidebarInterface[];
    RightToolbarBottom?: SidebarInterface[];
    // triggered when click selector of this mode,
    StartMode?: () => void;
    // triggered when click selector of OTHER mode,
    EndMode?: () => void;
}

export interface SubModeFunction extends ModeFunctionBase {
    clearToolbar?: boolean;// if true, clear toolbar when change to subMode
}


export default interface ModeFunction extends ModeFunctionBase {
    ModeSelectorText?: string; //undefine if no need to show in selector
    Tips?: string;
    Enable: boolean; // Default status of Mode when created
    CenterCanvas: CanvasBase;
}

export class modeNoop implements ModeFunction {
    ModeName = "NoOP";
    Enable = false;
    CenterCanvas = new NoOPCanvas();
}
