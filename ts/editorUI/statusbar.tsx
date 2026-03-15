import { type StatusBarStateType as StatusbarStateType, editorUIData, editorUIActions } from "./data";
import type Snabbdom from "@herp-inc/snabbdom-jsx";
import { Div, Span } from "./util/Element";

export class TipComponent {
    private idx: number;
    private side: string;
    constructor(defaultTip: string, side: string, idx: number) {
        this.idx = idx;
        this.side = side;
        console.log(`[EUI] ${idx} tip component created`);
        editorUIData.dispatch(editorUIActions[`statusbar_${this.side}_`].update(
            {
                id: this.idx,
                new_func: {
                    tip: defaultTip,
                    showed: true,
                }
            }
        ));
    }
    public updateTip(tip: string) {
        editorUIData.dispatch(editorUIActions[`statusbar_${this.side}_`].update(
            {
                id: this.idx,
                new_func: {
                    tip: tip,
                    showed: true,
                }
            }
        ));
    }
    public hide() {
        editorUIData.dispatch(editorUIActions[`statusbar_${this.side}_`].update(
            {
                id: this.idx,
                new_func: {
                    // @ts-ignore
                    tip: editorUIData.getState()[`statusbar_${this.side}_`][this.idx].tip,
                    showed: false,
                }
            }
        ));

    }
    public show() {
        editorUIData.dispatch(editorUIActions[`statusbar_${this.side}_`].update(
            {
                id: this.idx,
                new_func: {
                    // @ts-ignore
                    tip: editorUIData.getState()[`statusbar_${this.side}_`][this.idx].tip,
                    showed: true,
                }
            }
        ));

    }
}

class StatusBar {
    constructor() { }

    // @ts-ignore
    private defaultTip!: TipComponent;
    private __createTipComponent__(defaultTip: string, right: boolean = false) {
        if (right) {
            let count = Object.keys(editorUIData.getState()[`statusbar_right_`].data).length;
            return new TipComponent(defaultTip, "right", count + 1);
        }
        else {
            let count = Object.keys(editorUIData.getState()[`statusbar_left_`].data).length;
            return new TipComponent(defaultTip, "left", count + 1);
        }
    }
    public addTip(defaultTip: string, atRight: boolean = false): TipComponent {
        return this.__createTipComponent__(defaultTip, atRight);
    }

    public clear(): void {
        editorUIData.dispatch(editorUIActions[`statusbar_left_`].clear(undefined));
        editorUIData.dispatch(editorUIActions[`statusbar_right_`].clear(undefined));
    }
}

export default StatusBar;

export type StatusbarPropsType = {
    side: string,
}

const renderTipComponent = (tip: string) => {
    return <Div className="status-bar">
        <Span className="status_help_tip">
            {tip}
        </Span>
    </Div>
}
const renderStatusPart = (partListName: string, partList: StatusbarStateType) => {
    return Object.keys(partList).map((key: string) => {
        return partList[key].showed ? renderTipComponent(partList[key].tip) : <Span />;
    })
}

export const StatusBarComp: Snabbdom.Component<StatusbarPropsType> = (props: StatusbarPropsType) => {
    let side = props.side;
    let name = `editorui-statusbar-${side}`

    // console.log("[DEB] Statusbar data : ",data.getState()[`statusbar_${side}_`]);
    return <Div className={name}>
        {
            // @ts-ignore
            renderStatusPart(`statusbar_${side}_`, editorUIData.getState()[`statusbar_${side}_`].data)
        }
    </Div>

}