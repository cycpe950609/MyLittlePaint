import { type CanvasBase } from "../canvas";
import { type SubModeFunction } from "./mode";

export enum PropertyType {
    String = "string",
    Integer = "integer",
    Float = "float",
    Color = "color",

    StringList = "stringList",
    IntegerList = "integerList",
    FloatList = "floatList",
    ColorList = "colorList",
}
export type PropertyItem = {
    ID: string; //ID store in global state
    Label: string; // Text show in PropertiesBox
    Type: PropertyType;
    Info: string; //TODO : add infos of specific Type
    Value: string | number | string[] | number[];
};

// How about if Tool Button clicked in StartFunction ?
//     Change = return true,
//     Remain = return false
export type NextFunctionState = {
    isChangeTo: boolean;
    finishSubMode?: boolean;
    subMode?: SubModeFunction;
}
export default interface FunctionInterface {
    Name: string; // Tips of ToolButton
    ImgName?: string;
    Tip?: string | (() => string); // Tip showed on StatusBar
    HistoryName?: string; // Undefined if don't want to store in redo/undo history
    StartFunction: (cvs: CanvasBase) => void | Promise<void> | NextFunctionState | Promise<NextFunctionState>; // triggered when click ToolButton of this function
    EndFunction?: (cvs: CanvasBase) => void; // triggered when click ToolButton of OTHER function
}

export class NoOPFunc implements FunctionInterface {
    constructor(idx: number) {
        // console.log(idx);
        this.Tip =
            "This is a example of using FunctionInterface " + idx.toString();
    }
    Name = "no_op";
    ImgName = "text";
    Tip = "";
    StartFunction(_cvs: CanvasBase) { }
    MouseDown = (_e: UIEvent) => {
        // console.log("MouseDown event trigger");
    };
}
