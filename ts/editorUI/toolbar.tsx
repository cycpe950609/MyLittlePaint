// import EditorUI from "./EditorUI";
import { v4 as uuidv4 } from "uuid";
import { type ToolbarStateType, editorUIData, editorUIActions } from "./data";
import type FunctionInterface from "./interface/function";
import createFunctionInterfaceButton from "./util/createFunctionInterfaceButton";
import type Snabbdom from "@herp-inc/snabbdom-jsx";
import { Div } from "./util/Element";

export interface ToolbarInterface {
    hide: () => void;
    show: () => void;
    size: () => number;
    hasChildren: () => boolean;
}

export type createFuncType<ButtonInfoType> = (listName: string, name: string, arg0: ButtonInfoType) => FunctionInterface

export class ToolbarPart<ButtonInfoType> {
    private name: string;

    constructor(
        name: string
    ) {
        this.name = name;
    }
    clear() {
        console.log(`[EUI] Toolbar ${this.name} clear`);
        // console.log(Object.id(this) + " is cleared");
        editorUIData.dispatch(editorUIActions[this.name].clear(undefined));
    }

    addButtonList(funcList?: ButtonInfoType[]): string[] {
        console.log('[TBR] AddButtonList', funcList)
        if (funcList === undefined || funcList.length === 0) return [];
        return funcList.map((func: ButtonInfoType) => {
            return this.addButton(func);
        });
    }

    addButton(func: ButtonInfoType): string {
        const btnID = uuidv4();
        console.log('[TBR] AddButton')
        editorUIData.dispatch(editorUIActions[this.name].add({ id: btnID, func: func }));
        return btnID;
    }

    removeButton(id: string): boolean {
        // @ts-ignore
        if (id in editorUIData.getState()[this.name]) {
            editorUIData.dispatch(editorUIActions[this.name].remove(id));
            return true;
        }
        return false;
    }

    size() {
        // @ts-ignore
        return Object.keys(editorUIData.getState()[this.name]).length;
    }
    hasChildren() {
        // @ts-ignore
        return Object.keys(editorUIData.getState()[this.name]).length > 0;
    }
}
class Toolbar<ButtonInfoType> {
    public Top: ToolbarPart<ButtonInfoType>;
    public Bottom: ToolbarPart<ButtonInfoType>;

    constructor(
        prefix: string,
        postfix: string,
        createFunc: createFuncType<ButtonInfoType>
    ) {
        createFuncList[prefix] = createFunc;
        this.Top = new ToolbarPart<ButtonInfoType>(
            `${prefix}_top_${postfix}`
        );
        this.Bottom = new ToolbarPart<ButtonInfoType>(
            `${prefix}_bottom_${postfix}`
        );
    }

    removeButton(id: string) {
        if (!this.Top.removeButton(id))
            this.Bottom.removeButton(id);
    }

    clear() {
        this.Top.clear();
        this.Bottom.clear();
    }

    size() {
        return this.Bottom.size() + this.Top.size();
    }
    hasChildren() {
        const bottomHasChildren = this.Bottom.hasChildren();
        const topHasChildren = this.Top.hasChildren();
        // console.log("Bottom : ",bottomHasChildren , "Top : " ,topHasChildren);
        return bottomHasChildren || topHasChildren;
    }
}

export default Toolbar;

let createFuncList: { [key: string]: createFuncType<any> } = {};
export type ToolbarPropsType = {
    type: string;
}

const renderToolPart = (type: string, partName: string, partListName: string, partList: ToolbarStateType<any>) => {
    console.log("[TBR] ToolbarPart render", partListName, Object.keys(partList).length)
    return <Div className={partName}>
        {
            Object.keys(partList).map((key: string) => {
                return createFunctionInterfaceButton(createFuncList[type](partListName, key, partList[key]));
            })
        }
    </Div>
}

export type ToolbarCompPropsType = {
    type: string;
}

export const ToolbarComp: Snabbdom.Component<ToolbarCompPropsType> = (props: ToolbarCompPropsType) => {
    let type = props.type;
    let name = `editorui-${type}`;

    let underscore = type.replace('-', '_');
    // @ts-ignore
    let dataTop = editorUIData.getState()[`${underscore}_top_`].data;
    // @ts-ignore
    let dataTopPerm = editorUIData.getState()[`${underscore}_top_perm`].data;
    // @ts-ignore
    let dataBottom = editorUIData.getState()[`${underscore}_bottom_`].data;
    // @ts-ignore
    let dataBottomPerm = editorUIData.getState()[`${underscore}_bottom_perm`].data;
    // <div class="toolbar-vertical" style="display: flex;">
    //      <div class="toolbar-perm"></div>
    //      <div class="toolbar-top">
    //          <div class="toolbar-item" style="background-image: url(&quot;img/brush.png&quot;);"><span class="tooltip-text"></span></div>
    //      </div>
    //      <div class="toolbar-bottom"></div>
    //      <div class="toolbar-perm"></div>
    // </div>
    console.log("[DEB] ToolbarComp", editorUIData.getState());
    if (
        Object.keys(dataTop).length +
        Object.keys(dataTopPerm).length +
        Object.keys(dataBottom).length +
        Object.keys(dataBottomPerm).length
        === 0
    ) {
        return <Div />;
    }
    return <Div className="toolbar-vertical" >
        {renderToolPart(type, "toolbar-perm", `${underscore}_top_perm`, dataTopPerm)}
        {renderToolPart(type, "toolbar-top", `${underscore}_top_`, dataTop)}
        {renderToolPart(type, "toolbar-bottom", `${underscore}_bottom_`, dataBottom)}
        {renderToolPart(type, "toolbar-perm", `${underscore}_bottom_perm`, dataBottomPerm)}
    </Div>


}
