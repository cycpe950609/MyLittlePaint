function SetPropertyTitle(title)
{
    let tit = document.getElementById('pb_Property_title');
    tit.innerText = title;
}

function SetPropertyBodyContext(body)
{
    let bdy = document.getElementById('pb_Property_bdy');
    bdy.textContent = '';
    bdy.appendChild(body);
}

function getPropertybarWidth()
{
    let pdy = document.getElementById('pb_Property_bdy');
    let style = pdy.currentStyle || window.getComputedStyle(pdy);
    
    let width = pdy.offsetWidth;
    let margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    let padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    let border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    
    let real_width = width + margin - padding + border;
    //console.log(real_width);
    return real_width;
}