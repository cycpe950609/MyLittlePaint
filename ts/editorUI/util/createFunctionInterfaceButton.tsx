import type FunctionInterface from "../interface/function";
import { Div, Span } from "./Element";

const createFunctionInterfaceButton = (
    func: FunctionInterface
) => {
    // const [tip, setTip] = useState("");

    return <Div className="toolbar-item"
        // onmouseover={
        //     () =>{ 
        //         if(func.Tip === undefined) return;
        //         setTip( typeof func.Tip === "string" ? func.Tip : func.Tip() );           
        //     }
        // }
        onclick={
            () => window.editorUI.Mode.changeFunction(func)
        }
        $style={{
            backgroundImage: "url(img/" + (func.ImgName !== undefined ? func.ImgName : "color_selector") + ".png)"
        }}
    >
        {
            func.Tip !== undefined &&
            <Span className="tooltip-text">
                {typeof func.Tip === "string" ? func.Tip : func.Tip()}
            </Span>
        }
    </Div>
}

export default createFunctionInterfaceButton;