import type Snabbdom from "@herp-inc/snabbdom-jsx";
import { editorUIData, modeChangeTo } from "./data";
import { Div, Span } from "./util/Element";


export const ErrorHandlerPage: Snabbdom.Component<any> = (_props: any) => {
    setTimeout(() => {
        editorUIData.dispatch(modeChangeTo(editorUIData.getState().mode.root))
    }, 1000);
    return <>
        <Div className="w-full h-full"
            $style={{
                backgroundColor: "black",
                color: "red"
            }}
        >
            <Div className="flex flex-row"
                $style={{
                    height: "100%",
                    position: "relative",
                    top: "50%",
                }}
            >
                <Span className="horiz-center">Oops! Something went wrong.</Span>
                <Span className="horiz-center">Jump to HomePage in 1 second.</Span>
            </Div>
        </Div>
    </>
}