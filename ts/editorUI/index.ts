/**
 * Modified : 2026/04/04
 * Author  : Ting Fang, Tsai
 * About:
 *     Index of EditorUI, export EditorUI and related types
 */


import { type CanvasBase } from "./canvas";
import Dialog from "./dialog";
import { default as Main } from "./EditorUI";
import type FunctionInterface from "./interface/function";
import type ModeFunction from "./interface/mode";
import type { SubModeFunction } from "./interface/mode";
import type SidebarInterface from "./interface/sidebar";
import { BUTTON, CANVAS, DIV, LABEL, LI, SPAN, TEXT } from "./util/HTMLElement";



const EditorUI = {
    Main,
    // Interface: {
    //     Canvas: CanvasBase
    // },
    UIComp: {
        Dialog: Dialog,
        HTML: {
            Div: DIV,
            Label: LABEL,
            Span: SPAN,
            Canvas: CANVAS,
            Text: TEXT,
            Button: BUTTON,
            Li: LI,
        }
    }
};

namespace EditorUI {
    export type Main = typeof Main;

    export namespace Interface {
        export type Canvas = CanvasBase;
        export type Function = FunctionInterface;
        export type Mode = ModeFunction;
        export type SubMode = SubModeFunction;
        export type Sidebar = SidebarInterface;
    }
    export namespace UIComp {
        export type Dialog = typeof import("./dialog").default;
        export namespace HTML {
            export type Div = typeof import("./util/HTMLElement").DIV;
            export type Label = typeof import("./util/HTMLElement").LABEL;
            export type Span = typeof import("./util/HTMLElement").SPAN;
            export type Canvas = typeof import("./util/HTMLElement").CANVAS;
            export type Text = typeof import("./util/HTMLElement").TEXT;
            export type Button = typeof import("./util/HTMLElement").BUTTON;
            export type Li = typeof import("./util/HTMLElement").LI;
        }
    }
    export namespace Canvas {
        export type Entry<DATATYPE> = import("./canvas").CanvasSettingEntry<DATATYPE>;
        export type Setting = import("./canvas").CanvasInterfaceSettings
        export type Type = import("./canvas").CanvasSettingType;
        export type PaintEvent = import("./canvas").PaintEvent;
    }
};

export default EditorUI;

