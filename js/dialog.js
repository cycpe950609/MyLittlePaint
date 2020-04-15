function btnDialogCloss_onClick(btn)
{
    console.log('Dialog Close');
    let dia = document.getElementById('td_dialog_bg');
    dia.style.display = "none";
}

function SetDialogTitle(title)
{
    let tit = document.getElementById('td_title');
    tit.innerText = title;
}

function SetDialogBodySize(Height,Width)
{
    let bdy = document.getElementById('td_dialog_body');
    bdy.style.height    = Height;
    bdy.style.width     = Width;
}

function SetDialogBodyContext(body)
{
    let bdy = document.getElementById('td_dialog_body');
    bdy.textContent = '';
    bdy.appendChild(body);
    //bdy.innerHTML = body;
}

function ShowDialog()
{
    let dia = document.getElementById('td_dialog_bg');
    dia.style.display = "flex";
}

function CloseDialog()
{
    let dia = document.getElementById('td_dialog_bg');
    dia.style.display = "none";
}