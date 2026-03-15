// import { CanvasBase } from "../canvas";

import { type VNode } from "snabbdom";
import { Span } from "../util/Element";

/* Sidebar */
export default interface SidebarInterface {
    Name: string; // Tips of ToolButton
    ImgName?: string;
    Tip?: string; // Tip showed on StatusBar
    HistoryName?: string; // Undefined if dont want to store in redo/undo hostory
    Visible: boolean;
    Title: () => string;
    Body: () => VNode;
}

export class NoOPSidebar implements SidebarInterface {
    constructor(visible = true, showText = "This is a sidebar example.") {
        this.Visible = visible;
        this.showedText = showText;
    }
    private showedText: string;
    Name = "NoOPSidebar";
    ImgName = "brush";
    Tip = "No OP Sidebar example";
    Visible = true;
    Title = () => "NoOpSidebar Example";
    Body = () => {
        return <Span>{this.showedText}</Span>;
    };
}
