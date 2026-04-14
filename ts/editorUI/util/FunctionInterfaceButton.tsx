import type FunctionInterface from "../interface/function";
import { Div, Span } from "./Element";


export type FunctionInterfaceButtonProps = {
    func: FunctionInterface
}
const FunctionInterfaceButton = (
    props: FunctionInterfaceButtonProps
) => {
    const func = props.func;
    let start_time = 0;
    return <Div className="toolbar-item">
        <Div className="toolbar-button"
            onpointerdown={() => {start_time = Date.now() }}
            onpointerup={() => {
                const now = Date.now();
                if (now - start_time < 500) {
                    window.editorUI.Mode.changeFunction(func);
                }
                start_time = 0;
            }}
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