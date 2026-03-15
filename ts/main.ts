import data from "./storage";
export { data };


import addID2Object from "./ObjectID";
// import modeEditor from "./editor/modeEditor";
import { enableMapSet } from 'immer'
enableMapSet()

addID2Object();

document.addEventListener("DOMContentLoaded", async () => {

    const isTouchCapable = 'ontouchstart' in window;
    if (process.env.NODE_ENV === 'development' && isTouchCapable) {
        // Only show eruda on touch capable devices, e.g. iPad
        let eruda = import(/* webpackChunkName: "eruda" */"eruda");
        (await eruda).default.init();
    }

    // __webpack_public_path__ = process.env.ASSET_PATH as string;
    // let eui = await import( /* webpackChunkName: "editorUI" */ './editorUI-ng/');
    // let editor = await import( /* webpackChunkName: "modeEditor" */ './editor/modeEditor');
    // // console.log("[DEB] dynamic loaded : ", typeof eui, eui.default)
    // window.editorUI = new eui.default();
    // window.editorUIng.Mode.add("editor", new editor.default());
    // window.editorUIng.Mount("editorUI_container");
    // window.editorUIng.Mode.changeTo("editor");

    let eui = await import( /* webpackChunkName: "editorUI" */ './editorUI');
    let editor = await import( /* webpackChunkName: "modeEditor" */ './editor/modeEditor');
    // console.log("[DEB] dynamic loaded : ", typeof eui, eui.default)
    window.editorUI = new eui.default();
    window.editorUI.Mode.add("editor", new editor.default());
    window.editorUI.Mount("editorUI_container");
    window.editorUI.Mode.changeTo("editor");
});