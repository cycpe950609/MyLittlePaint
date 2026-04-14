import EditorUI from "../editorUI";
import {
    type CanvasBase
} from "../editorUI/canvas";

import { type NextFunctionState } from "../editorUI/interface/function";
import { EditorCanvas } from "./canvas";
import {
    btnClear,
    btnDownload,
    btnRedo,
    btnResetPosition,
    btnResetRotate,
    btnResetScale,
    btnSave,
    btnToggleTouch,
    btnUndo,
} from "./menu";
import SettingPageSidebar from "./setting";
// import LayerMgrSidebar from './test.layerMgr';


export class btnCanvas implements EditorUI.Interface.Function {
    Name: string;
    ImgName?: string | undefined;
    Tip?: string | (() => string) | undefined;

    private editor_module_name: string;
    constructor(name: string, imgName: string, tip: string, extName: string) {
        this.Name = name;
        this.ImgName = imgName;
        this.Tip = tip;
        this.editor_module_name = extName;
    }

    StartFunction = async (cvs: CanvasBase) => {
        if (!(cvs instanceof EditorCanvas))
            throw new Error(`Unexpected canvas type '${typeof cvs}'`);
        cvs.startEdit(this.editor_module_name);
        return { isChangeTo: true } as NextFunctionState;
    };
}

class modeEditor implements EditorUI.Interface.Mode {
    Enable = true;

    CenterCanvas = new EditorCanvas();

    MenuToolbarLeft = [
        // new btnUpload(),
        new btnUndo(),
        new btnRedo(),
        new btnClear(),
        new btnCanvas('Eraser', 'eraser', 'Eraser', "eraser"),
    ];

    MenuToolbarRight = [
        new btnResetPosition(),
        new btnResetScale(),
        new btnResetRotate(),
        new btnToggleTouch(),
        new btnSave(),
        new btnDownload()
    ];

    public get LeftToolbarTop(): EditorUI.Interface.Function[] {
        return this.CenterCanvas.ToolbarLeftTopList;
    }

    RightToolbarTop = [
        // new LayerMgrSidebar(),
        new SettingPageSidebar(),
    ];

    private unload: (event: BeforeUnloadEvent) => void = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = "";
    }

    StartMode() {
        if (process.env.NODE_ENV !== 'development') {
            window.addEventListener("beforeunload", this.unload, true);
        }
    }
    EndMode() {
        if (process.env.NODE_ENV !== 'development') {
            window.removeEventListener("beforeunload", this.unload);
        }
    }
}

export default modeEditor;
