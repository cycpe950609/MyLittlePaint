export const DIV = (
    className: string,
    children?: HTMLElement[] | HTMLElement | DocumentFragment
) => {
    const dv = document.createElement("div");
    className.trim().split(' ').map((clsNme : string)=>dv.classList.add(clsNme))
    if (children === undefined) return dv;
    if (children instanceof HTMLElement || children instanceof DocumentFragment)
        dv.appendChild(children);
    else
        children.map((child) => {
            dv.appendChild(child);
        });
    return dv;
};

// export const TABLE = (
//     className: string,
//     thead?: HTMLElement[] | HTMLElement | DocumentFragment,
//     tbody?: HTMLElement[] | HTMLElement | DocumentFragment
// ):[HTMLTableElement,HTMLTableSectionElement] => {
//     const tb = document.createElement("table");
//     className.split(' ').map((clsNme : string)=>tb.classList.add(clsNme))
//     const head = document.createElement('thead');
//     if (thead !== undefined)
//     {
//         if (thead instanceof HTMLElement || thead instanceof DocumentFragment)
//         {
//             head.appendChild(thead);
//         }
//         else
//         {
//             thead.map((child) => {
//                 head.appendChild(child);
//             });
//         }
//     }
//     tb.appendChild(head);
//     const body = document.createElement("tbody");
//     tb.appendChild(body);
//     if (tbody === undefined) return [tb,body];
//     if (tbody instanceof HTMLElement || tbody instanceof DocumentFragment)
//         body.appendChild(tbody);
//     else
//         tbody.map((child) => {
//             body.appendChild(child);
//         });
//     return [tb,body];
// };

// export const TR = (
//     className: string,
//     children?: HTMLElement[] | HTMLElement | DocumentFragment
// ) => {
//     const tr = document.createElement("tr");
//     if(className.split(' ').length > 0)
//         className.split(' ').map((clsNme : string)=>tr.classList.add(clsNme))

//     if (children === undefined) return tr;
//     if (children instanceof HTMLElement || children instanceof DocumentFragment)
//         tr.appendChild(children);
//     else
//         children.map((child) => {
//             tr.appendChild(child);
//         });
//     return tr;
// }

// export const TD = (
//     children?: HTMLElement[] | HTMLElement | DocumentFragment | string
// ) => {
//     const td = document.createElement("td");
//     if (children === undefined) return td;
//     if (children instanceof HTMLElement || children instanceof DocumentFragment)
//         td.appendChild(children);
//     else if(typeof children === 'string')
//         td.append(children)
//     else
//         children.map((child) => {
//             td.appendChild(child);
//         });
//     return td;
// };

export const LABEL = (
    className: string,
    children?: HTMLElement[] | HTMLElement | DocumentFragment | string
) => {
    const lbl = document.createElement("label");
    className.trim().split(' ').map((clsNme : string)=>lbl.classList.add(clsNme))
    if (children === undefined) return lbl;
    if (children instanceof HTMLElement || children instanceof DocumentFragment)
        lbl.appendChild(children);
    else if(typeof children === 'string')
        lbl.append(children)
    else
        children.map((child) => {
            lbl.appendChild(child);
        });
    return lbl;
};

export const SPAN = (className: string, children: string) => {
    const span = document.createElement("span");
    className.trim().split(' ').map((clsNme : string)=>span.classList.add(clsNme))
    span.append(children);
    return span;
};

export const CANVAS = (className: string) => {
    const cvs = document.createElement("canvas");
    className.trim().split(" ").map((clsNme: string) => cvs.classList.add(clsNme));
    return cvs;
};

export const TEXT = (
    className: string
) => {
    const txt = document.createElement("input")
    className.trim().split(' ').map((clsNme : string) => txt.classList.add(clsNme))
    txt.required = true;
    return txt
}

export const BUTTON = (
    className: string,
    children?: HTMLElement[] | HTMLElement | DocumentFragment | string
) : HTMLElement => {
    const btn = document.createElement('input')
    btn.classList.add('button')
    className.trim().split(' ').map((clsNme : string) => btn.classList.add(clsNme))
    btn.type = 'button'
    if (children === undefined) return btn;
    if (children instanceof HTMLElement || children instanceof DocumentFragment)
    {
        btn.appendChild(children);
        return btn;
    }
    if (typeof children === 'string'){
        // console.log("[EUI] create button with string")
        btn.value = children
        return btn;
    }
    children.map((child) => {
        btn.appendChild(child);
    });
    return btn
}

export const LI = (text: string) => {
    const li = document.createElement("li");
    li.append(text);
    return li;
}