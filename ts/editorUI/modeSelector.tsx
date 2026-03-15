import { editorUIData } from "./data";
import type Snabbdom from "@herp-inc/snabbdom-jsx";
import { Div, Input, Label } from "./util/Element";

export const bootstrap = async () => {
    console.log("[EUI] modeSelector bootstrapping");
}
export const ModeSelectorComp: Snabbdom.Component<{}> = () => {
    return <Div Id="editorui-menubar-middle" className="buttongroup">
        {
            Object.keys(editorUIData.getState()["mode"].data).map((key) => {
                //prettier-ignore
                let val = editorUIData.getState().mode.data[key]
                const btnName = val.def.ModeSelectorText;
                if (btnName === undefined) return <></>;

                return <Label className="buttongroup-item"
                    onclick={() => window.editorUI.Mode.changeTo(val.modeName)}
                >
                    <Input type="radio" className="button_input" name="modeSelector" defaultChecked={false} disabled={val.enable !== true} />
                    <Div className="button">
                        <Div>{btnName}</Div>
                    </Div>
                </Label>;
            })
        }
    </Div>
}
