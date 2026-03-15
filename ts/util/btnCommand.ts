import { type CanvasBase } from "../editorUI/canvas";
import Dialog from "../editorUI/dialog";
import type FunctionInterface from "../editorUI/interface/function";
import { BUTTON, DIV, TEXT } from "../editorUI/util/HTMLElement";
import Alert from "../editorUI/util/alert";
import axios from "axios";

class btnCommand implements FunctionInterface {
    Name = "Send Command Tester";
    Tip = "Send Command Tester";
    ImgName = "command";
    constructor() {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    StartFunction(_cvs: CanvasBase) {
        let btnSend = BUTTON("ok_btn", "Send");
        let txtCommand = TEXT("w-full");
        btnSend.onclick = async (_e: MouseEvent) => {
            if (txtCommand.value.length == 0) Alert("Please enter command");
            let url = "/" + (txtCommand.value.split('.').join("/"));
            console.log("Command url :", url);
            await axios.get(url);
        }
        let dia = new Dialog("Send a command to the server",
            DIV("w-full h-fit flex flex-row",
                [
                    txtCommand,
                    btnSend,
                ]
            )
        )
        dia.show();
    }
}

export default btnCommand;
