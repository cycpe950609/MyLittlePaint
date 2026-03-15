import { DIV, SPAN } from "./util/HTMLElement";

class Dialog {
    private dialog: HTMLDivElement;
    constructor(title: string, body: DocumentFragment | HTMLElement, closing?: EventListener) {
        //prettier-ignore
        this.dialog = DIV(
            "TD_Background",
            DIV("Top_Dialog",
                [
                    DIV("TD_Header",
                        [
                            SPAN("TD_Title", title),
                            (() => {
                                const sp = SPAN("TD_BtnDialogClose", "X");
                                sp.addEventListener("click", closing !== undefined ? (e) => { closing(e); this.close() } : () => this.close());
                                // console.log(sp);
                                return sp;
                            })()
                        ]
                    ),
                    DIV("TD_Body", body)
                ]
            )
        );
    }

    private ShowDialog() {
        //TODO : How to pass container of dialog without using id
        const dia = document.body;
        this.dialog.style.display = "flex";
        dia.appendChild(this.dialog);
    }

    private CloseDialog() {
        this.dialog.style.display = "none";
    }

    show() {
        this.ShowDialog();
    }

    close() {
        this.CloseDialog();
    }
}

export default Dialog;
