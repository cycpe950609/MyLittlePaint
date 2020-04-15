//Source for Canvas
var prev_canvas ;
var prev_ctx    ;

var bg_canvas ;
var bg_ctx    ;



function InitialCanvas()
{
    //Source for Canvas
    prev_canvas = document.getElementById('prev_canvas');
    prev_ctx    = prev_canvas.getContext('2d');
    prev_canvas.addEventListener('mousedown', (e) =>{
        ifDrawing = true;
        ifMouseMove = false;
        [func.LastX, func.LastY] = [e.offsetX, e.offsetY];
        //console.log('Mouse Down');
    });
    prev_canvas.addEventListener('mousemove', CanvasDraw);	
    prev_canvas.addEventListener('mouseup', FinishDrawing);
    prev_canvas.addEventListener('mouseout', FinishDrawing);
    prev_canvas.width=800;
    prev_canvas.height=450;
    
    
    
    bg_canvas   = document.getElementById('bg_canvas');
    bg_ctx      = bg_canvas.getContext('2d');    
    bg_canvas.width=800;
    bg_canvas.height=450;


}

function ClearCanvas()
{
    prev_ctx.clearRect(0, 0, prev_canvas.width, prev_canvas.height);
    bg_ctx.clearRect(0, 0, bg_canvas.width, bg_canvas.height);
}

function SaveCanvas(name)
{
    let dwn = document.createElement('a'),e;

    dwn.download = name;

    dwn.href = bg_canvas.toDataURL("image/png;base64");

    var simulateClick = function (elem) {
        // Create our event (with options)
        var evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        // If cancelled, don't dispatch our event
        var canceled = !elem.dispatchEvent(evt);
    };

    simulateClick(dwn);
}


var func;
function LoadCanvasFunctionList(FunctionList)
{
    func = FunctionList;
    //console.log(func);
    
    //Change mice
    prev_canvas.style.cursor = 'url(img/cursor/' + func.CursorName +'.cur), auto';
    //bg_canvas.style.cursor = 'url(img/brush.png), pointer';
}


let ifDrawing = false;
let ifMouseMove = false;
function CanvasDraw(mouse_event) {
    if(!ifDrawing) return;
    
    ifMouseMove = true;
    //console.log('Mouse Move');

    //let draw = func.DrawFunction();//(prev_ctx,mouse_event.offsetX, mouse_event.offsetY);   
    //draw(prev_ctx,mouse_event.offsetX, mouse_event.offsetY);
    
    func.DrawFunction(prev_ctx,mouse_event.offsetX, mouse_event.offsetY);
    
    prev_ctx.stroke();    
}

function FinishDrawing(mouse_event)
{
    ifDrawing = false;
    if(ifMouseMove == true) 
    {
        bg_ctx.globalCompositeOperation = func.CompositeOperation;
        bg_ctx.drawImage(prev_canvas,0,0);
        prev_ctx.clearRect(0, 0, prev_canvas.width, prev_canvas.height);
        //Add Redo Undo stack
    }
    ifMouseMove = false;
}





function LoadImage(file)
{

    
    let img = new Image();
    
    img.onload = function () {
        ClearCanvas();

        console.log(img.width);
        console.log(img.height);
        
        prev_canvas.width = img.width;
        prev_canvas.height = img.height;
        
        bg_canvas.width = img.width;
        bg_canvas.height = img.height;
        bg_ctx.drawImage(img, 0, 0, img.width, img.height);
        URL.revokeObjectURL(src);
    }


    let src = URL.createObjectURL(file);
    
    img.src = src;
}