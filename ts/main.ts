import data from "./storage";
export { data };
import EditorUI from "./editorUI";
import modeEditor from "./editor/modeEditor";

import addID2Object from "./ObjectID";
// import modeEditor from "./editor/modeEditor";
// import { enableMapSet } from 'immer'
// enableMapSet()

addID2Object();

document.addEventListener("DOMContentLoaded", async () => {

    const isTouchCapable = 'ontouchstart' in window;
    if (process.env.NODE_ENV === 'development' && isTouchCapable) {
        // Only show eruda on touch capable devices, e.g. iPad
        let eruda = import(/* webpackChunkName: "eruda" */"eruda");
        (await eruda).default.init({
            useShadowDom: true,
        });
    }

    window.editorUI = new EditorUI.Main();
    window.editorUI.Mode.add("editor", new modeEditor());
    window.editorUI.Mount("editorUI_container");
    window.editorUI.Mode.changeTo("editor");
});