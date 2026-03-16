import { type Unsubscribe } from "@reduxjs/toolkit";
import { type ToolbarStateType, editorUIData } from "./data";
import FunctionInterfaceButton from "./util/FunctionInterfaceButton";
import type Snabbdom from "@herp-inc/snabbdom-jsx";
import { Div } from "./util/Element";


let unsubscribe: { [key: string]: Unsubscribe } = {};
let rendered: { [key: string]: boolean } = {};

export type MenubarPropsType = {
    side: string;
}
export const bootstrap = async (props: MenubarPropsType) => {
    console.log("[EUI] Toolbar bootstrapping");
    rendered[`menubar_${props.side}_`] = false;
    rendered[`menubar_${props.side}_perm`] = false;
}
const renderMenuPart = (partListName: string, partList: ToolbarStateType<any>) => {
    return <Div className="menu-perm">
        {
            Object.keys(partList).map((key: string) => {
                rendered[partListName] = true;
                return <FunctionInterfaceButton func={partList[key]} />
            })
        }
    </Div>
}

export type MenuboxPropsType = {
    side: string;
}
export const MenuboxComp: Snabbdom.Component<MenubarPropsType> = (props: MenubarPropsType) => {
    let side = props.side;
    let name = `editorui-menubar-${side}`;

    const state = editorUIData.getState() as Record<string, { data: any }>;
    let dataMode = state[`menubar_${side}_`]?.data ?? {};
    let dataPerm = state[`menubar_${side}_perm`]?.data ?? {};

    if (
        Object.keys(dataMode).length +
        Object.keys(dataPerm).length
        === 0
    ) {
        return <Div />
    }
    // <div class="menu-box" style="display: flex;">
    //      <div class="menu-perm">
    //          <div class="toolbar-item" style="background-image: url(&quot;img/eraser.png&quot;);"><span
    //                  class="tooltip-text">Eraser</span></div>
    //      </div>
    //      <div class="menu-perm"></div>
    // </div>
    return <Div Id={name} className="menu-box">
        {renderMenuPart(`menubar_${side}_perm`, dataPerm)}
        {renderMenuPart(`menubar_${side}_`, dataMode)}
    </Div>
}