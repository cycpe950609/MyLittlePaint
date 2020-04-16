//Source for Canvas
var prev_canvas ;
var prev_ctx    ;

var bg_canvas ;
var bg_ctx    ;


let EventFired = false;
function InitialCanvas()
{
    //Source for Canvas
    prev_canvas = document.getElementById('prev_canvas');
    prev_ctx    = prev_canvas.getContext('2d');
    
    
    
    
    prev_canvas.addEventListener('mousedown', function(e){
        if(func.hasOwnProperty('MouseDown'))
        {
            EventFired = true;
            //console.log('Mouse Down');
            func.MouseDown(e);
            func.DrawFunction(prev_ctx);
            if(func.CanFinishDrawing)
                FinishDrawing();
        }
        
        //console.log('Mouse Down');
    });
    
    prev_canvas.addEventListener('mousemove', function(e){
        if(func.hasOwnProperty('MouseMove'))
        {
            //console.log('Mouse Move');
            func.MouseMove(e);
            func.DrawFunction(prev_ctx);
            if(func.CanFinishDrawing)
                FinishDrawing();
        }
    });	
    prev_canvas.addEventListener('mouseup', function(e){
        if(func.hasOwnProperty('MouseUp'))
        {
            //console.log('Mouse Up');
            func.MouseUp(e);
            func.DrawFunction(prev_ctx);
            if(func.CanFinishDrawing == true)
                FinishDrawing();
        }
    });
    prev_canvas.addEventListener('mouseout', function(e){
        if(func.hasOwnProperty('MouseOut'))
        {
            //console.log('Mouse Out');
            func.MouseOut(e);
            func.DrawFunction(prev_ctx);
            if(func.CanFinishDrawing)
                FinishDrawing();
        }
    });

    prev_canvas.width=1280;
    prev_canvas.height=720;
    
    bg_canvas   = document.getElementById('bg_canvas');
    bg_ctx      = bg_canvas.getContext('2d');    
    bg_canvas.width=1280;
    bg_canvas.height=720;

    PushStateCanvas();
}

function CanvasKeyDown(e)
{
    //console.log('Canvas KeyDown');
    if(func.hasOwnProperty('KeyDown'))
    {

        EventFired = true;
        func.KeyDown(e);
        func.DrawFunction(prev_ctx);
        if(func.CanFinishDrawing)
            FinishDrawing();
    }
}

function CanvasKeyUp(e)
{
     if(func.hasOwnProperty('KeyUp'))
    {
        func.KeyUp(e);
        func.DrawFunction(prev_ctx);
        if(func.CanFinishDrawing)
            FinishDrawing();
    }
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
    if(func != null && func.CanFinishDrawing == false)
    {
        let ekey = {};
        ekey['key'] = 'Enter';
        let e = new KeyboardEvent('CanvasKeyDown', ekey);
        CanvasKeyDown(e); 
        
        console.log('Enter Emulate');
        // 假裝按了Enter以結束正在做的事（目前只有 Text Input 需要）
        // 因為在LoadCanvasFunctionList 之前不會有Canvas的MouseUp，MouseOut會更早Trigger
    }
    
    func = FunctionList;
    //console.log(func);
    
    //Change mice
    prev_canvas.style.cursor = 'url(img/cursor/' + func.CursorName +'.cur), auto';
    //bg_canvas.style.cursor = 'url(img/brush.png), pointer';
}



function FinishDrawing()
{
    if(EventFired)//only mousedown and keydown can fire the event
    {
        //console.log('Finish Drawing ...');
        bg_ctx.globalCompositeOperation = func.CompositeOperation;
        bg_ctx.drawImage(prev_canvas,0,0);
        prev_ctx.clearRect(0, 0, prev_canvas.width, prev_canvas.height);
        EventFired = false;
        PushStateCanvas();
        bg_ctx.globalCompositeOperation = "source-over";
    }
    
    //Add Redo Undo stack

}
let stk_history = new Array();
let his_step = -1;
function UndoCanvas()
{
    
    if(his_step > 0)
    {
        
        his_step--;
        let img = new Image();
        img.src = stk_history[his_step];
        img.onload = ()=>{
            bg_ctx.clearRect(0,0,bg_canvas.width,bg_canvas.height);
            bg_ctx.drawImage(img,0,0);  
        };
        
        console.log('Undo : ' + his_step);
    }
}
function RedoCanvas()
{
    
    if(his_step < stk_history.length-1)
    {
        console.log('Redo');
        his_step++;
        let img = new Image();
        img.src = stk_history[his_step];
        img.onload = ()=>{
            bg_ctx.clearRect(0,0,bg_canvas.width,bg_canvas.height);
            bg_ctx.drawImage(img,0,0);  
        };
    }
}
function PushStateCanvas()
{
    //console.log('Push State');
    his_step++;
    if(his_step < stk_history.length)
    {
        stk_history.length = his_step;
    }
    stk_history.push(bg_canvas.toDataURL());
    
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