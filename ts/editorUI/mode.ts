import { editorUIData, modeChangeTo } from "./data";
// import { DIV, LABEL } from "./util/HTMLElement";
import { NoOPFunc } from "./interface/function";
import { type SubModeFunction } from "./interface/mode";
// import { NoOPCanvas } from "./canvas";

//TODO : These should in EditorUI
let modeStack: SubModeFunction[] = [];

const setMode = (mode: SubModeFunction) => {
    let clear = mode.clearToolbar === true;
    if (clear) window.editorUI.Menubar.clear();
    window.editorUI.Menubar.Left.addButtonList(mode.MenuToolbarLeft);
    window.editorUI.Menubar.Right.addButtonList(mode.MenuToolbarRight);

    if (clear) window.editorUI.Toolbar.clear();
    console.log("[TBR] LeftToolbarTop", mode.LeftToolbarTop)
    console.log("[TBR] LeftToolbarBottom", mode.LeftToolbarBottom)
    window.editorUI.Toolbar.Top.addButtonList(mode.LeftToolbarTop);
    window.editorUI.Toolbar.Bottom.addButtonList(mode.LeftToolbarBottom);

    if (clear) window.editorUI.Sidebar.clear();
    window.editorUI.Sidebar.Top.addButtonList(mode.RightToolbarTop);
    window.editorUI.Sidebar.Bottom.addButtonList(mode.RightToolbarBottom);
}

export const returnMode = () => {
    if (modeStack[modeStack.length - 1].EndMode !== undefined) {
        modeStack[modeStack.length - 1].EndMode?.();
    }
    modeStack.pop();
    setMode(modeStack[modeStack.length - 1]);
    let funcNoop = new NoOPFunc(0);
    window.editorUI.Mode.changeFunction(funcNoop);
}

export const changeToSubMode = (mode: SubModeFunction) => {
    modeStack.push(mode);
    setMode(mode);
}

export const changeToMode = (modeName: string) => {

    let mode = editorUIData.getState().mode.data[modeName];
    let curMode = editorUIData.getState().mode.data[editorUIData.getState().mode.curMode];
    let isSubMode = mode.def.CenterCanvas === undefined;

    if (!isSubMode && curMode !== undefined && curMode.def.EndMode !== undefined) {
        curMode.def.EndMode()
    }

    if (mode.def.StartMode !== undefined) {
        mode.def.StartMode();
    }

    window.editorUI.CenterCanvas = mode.def.CenterCanvas;// Move before toolbar so we can get correct CenterCanvas when load the toolbar
    // let cnt = document.getElementById("canvas_group");
    // if(cnt === null) throw new Error("INTERNAL_ERROR: Container of CenterCanvas is not found");
    // mode.def.CenterCanvas.attachCanvas(cnt as HTMLDivElement);
    // console.log("[EUI] CenterCanvas",window.editorUIng.CenterCanvas)
    console.log("[MOD] mode.def", mode)

    let newMode: SubModeFunction = {
        clearToolbar: true,
        MenuToolbarLeft: mode.def.MenuToolbarLeft,
        MenuToolbarRight: mode.def.MenuToolbarRight,
        LeftToolbarTop: mode.def.LeftToolbarTop,
        LeftToolbarBottom: mode.def.LeftToolbarBottom,
        RightToolbarTop: mode.def.RightToolbarTop,
        RightToolbarBottom: mode.def.RightToolbarBottom
    };
    modeStack = [];
    changeToSubMode(newMode);
    editorUIData.dispatch(modeChangeTo(mode.modeName));

    let funcNoop = new NoOPFunc(0);
    window.editorUI.Mode.changeFunction(funcNoop);

    console.log(`[EUI] Mode ${mode.modeName} mounted`);
}
