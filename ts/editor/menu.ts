import { type CanvasBase } from "../editorUI/canvas";
import type FunctionInterface from "../editorUI/interface/function";
import { EditorCanvas } from "./modeEditor";


export class btnUpload implements FunctionInterface {
    Name = "btn_upload";
    ImgName = "upload";
    Tip = "Upload a image to edit";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).open();
    };
}

export class btnUndo implements FunctionInterface {
    Name = "btn_undo";
    ImgName = "undo";
    Tip = "Undo";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).undo();
    };
}

export class btnRedo implements FunctionInterface {
    Name = "btn_redo";
    ImgName = "redo";
    Tip = "Redo";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).redo();
    };
}

export class btnClear implements FunctionInterface {
    Name = "btn_clear";
    ImgName = "clear";
    Tip = "Clear the canvas";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).clear();
    };
}
export class btnSave implements FunctionInterface {
    Name = "btn_save";
    ImgName = "save";
    Tip = "Download a image";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).save();
    };
}

export class btnToggleTouch implements FunctionInterface {
    Name = "btn_touch";
    ImgName = "toggleTouch";
    Tip = "Toggle Touch / Pen";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).toggleTouch();
    };
}

export class btnResetScale implements FunctionInterface {
    Name = "btn_reset_scale";
    ImgName = "resetScale";
    Tip = "Reset scale to 100%";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).scaleTo(1);
    };
}

export class btnResetPosition implements FunctionInterface {
    Name = "btn_reset_pos";
    ImgName = "resetPos";
    Tip = "Reset position to (0, 0)";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).moveTo(0, 0);
    };
}

export class btnResetRotate implements FunctionInterface {
    Name = "btn_reset_rotate";
    ImgName = "resetRotate";
    Tip = "Reset rotate to 0°";

    constructor() { }

    StartFunction = (cvs: CanvasBase) => {
        (cvs as EditorCanvas).rotateTo(0);
    };
}