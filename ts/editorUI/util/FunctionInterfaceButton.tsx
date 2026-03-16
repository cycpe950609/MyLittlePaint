import type FunctionInterface from "../interface/function";
import { Div, Span } from "./Element";


export type FunctionInterfaceButtonProps = {
    func: FunctionInterface
}
const FunctionInterfaceButton = (
    props: FunctionInterfaceButtonProps
) => {
    const func = props.func;
    return <Div className="toolbar-item">
        <Div className="toolbar-button"
            onclick={
                () => window.editorUI.Mode.changeFunction(func)
            }
            $style={{
                backgroundImage: "url(img/" + (func.ImgName !== undefined ? func.ImgName : "color_selector") + ".svg)"
            }}
        />

        {
            func.Tip !== undefined &&
            <Span className="tooltip-text">
                {typeof func.Tip === "string" ? func.Tip : func.Tip()}
            </Span>
        }
    </Div >
}

export default FunctionInterfaceButton;