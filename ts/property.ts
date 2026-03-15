export function SetPropertyTitle(title: string) {
    const tit = document.getElementById("pb_Property_title");
    if (tit === null) throw new Error("PROPERTY_BOX_NOT_FOUND");
    tit.innerText = title;
}

export function SetPropertyBodyContext(body: DocumentFragment) {
    const bdy = document.getElementById("pb_Property_bdy");
    if (bdy === null) throw new Error("PROPERTY_BOX_NOT_FOUND");
    bdy.textContent = "";
    bdy.appendChild(body);
}

export function getPropertyBarWidth() {
    const pdy = document.getElementById("pb_Property_bdy") as HTMLElement;
    const style = window.getComputedStyle(pdy);

    const width = pdy.offsetWidth;
    const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    const padding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const border =
        parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);

    const real_width = width + margin - padding + border;
    // console.log(real_width);
    return real_width;
}
