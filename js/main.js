document.addEventListener('DOMContentLoaded',()=>{
    let btnUndo = document.getElementById('btnUndo');
    btnUndo.disable = true;
    let btnRedo = document.getElementById('btnRedo');
    btnRedo.disable = true;
    InitialCanvas();
    UpdateFunction(Brush);
    
});
function btnUpload_onClick(btn)
{
    console.log('Upload');

    SetDialogTitle('Upload A Image');

    let upload = document.createElement('input');
    upload.setAttribute('type','file');
    upload.setAttribute('accept','image/*')
    upload.setAttribute('onchange','UploadFileHandler(this.files)');
    SetDialogBodyContext(upload);


    ShowDialog();
}

function UploadFileHandler(files)
{
    let opened_file = files[0];
    LoadImage(opened_file);
    CloseDialog();
}

/* Clear Canvas */
function btnClear_onClick(btn)
{
    console.log('Clear');
    SetDialogTitle('Do ypu want to clear the canvas ?');

    let bdy = document.createDocumentFragment();

    //BtnClose
    let close = document.createElement('input');
    close.setAttribute('type','button');
    close.setAttribute('value','No');
    close.setAttribute('onclick','CloseDialog()')
    close.style.width = '50%';
    bdy.appendChild(close);
    //btnClear
    let clear = document.createElement('input');
    clear.setAttribute('type','button');
    clear.setAttribute('value','Yes');
    clear.setAttribute('onclick','btnClear_onclick(this)');
    clear.style.width = '50%';
    bdy.appendChild(clear);

    SetDialogBodyContext(bdy);
    ShowDialog();
}


function btnClear_onclick(btn)
{
    ClearCanvas();
    CloseDialog();
}


/* Save Canvas */
function btnSave_onClick(btn)
{
    SetDialogTitle('Enter the name of image');

    let bdy = document.createDocumentFragment();
    

    let txtbox = document.createElement("input");
    txtbox.setAttribute('id','my_image_name');
    txtbox.setAttribute("type", "text");
    txtbox.setAttribute("value", "MyImage");
    bdy.appendChild(txtbox);

    let lbl = document.createElement('label');
    lbl.innerText = '  .png ';
    lbl.setAttribute('margin-left','5px');
    lbl.setAttribute('margin-right','5px');
    bdy.appendChild(lbl);

    let save = document.createElement("input");
    save.setAttribute("type", "button");
    save.setAttribute("value", "OK");
    save.setAttribute('onclick','btnSave_onclick(this)');
    bdy.appendChild(save);

    SetDialogBodyContext(bdy);
    ShowDialog();
}
function btnSave_onclick(btn)
{
    let name = document.getElementById('my_image_name').value;
    SaveCanvas(name + '.png');
    CloseDialog();
}

function UpdateTip(tip)
{
    let help = document.getElementById('status_help_tip');
    help.innerText = tip;
    //console.log(tip);
}


function UpdateFunction(FunctionObject)
{
    //console.log('Load : ' + FunctionObject.Name);
    LoadCanvasFunctionList(FunctionObject);
    
    SetPropertyTitle(FunctionObject.Name);
    
    SetPropertyBodyContext( FunctionObject.LoadProperty(getPropertybarWidth()) );
}

let ctrl_down = false;
function BodyKeyDown(event)
{
    if(event.key == 'Control')
    {
        ctrl_down = true;
        return;
    }
    if(event.key == 'z' && ctrl_down)
    {
        UndoCanvas();
        return;
    }
        
    if(event.key == 'y' && ctrl_down)
    {
        RedoCanvas();
        return;
    }
    CanvasKeyDown(event);
        
}
function BodyKeyUp(event)
{
    if(event.key == 'Control')
    {
        ctrl_down = false;
        return;
    }
    CanvasKeyUp(event);
        
}
