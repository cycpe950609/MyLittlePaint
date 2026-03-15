import type { CanvasBase } from "../editorUI/canvas";
import type FunctionInterface from "../editorUI/interface/function";

class btnToggleMode implements FunctionInterface {
    Name = "Toggle Mode";
    Tip = "";
    private toggleModeName: string;

    constructor(modeName: string) {
        this.Tip = "Toggle Mode " + modeName;
        this.toggleModeName = modeName;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    StartFunction(_cvs: CanvasBase) { }
}

export default btnToggleMode;
