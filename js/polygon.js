var DrawCircle =
{
    Name : 'Circle',
    CursorName:'cross',
    LastX:0,
    LastY:0,
    BorderBrush: 'rgb(255,0,0)',
    BorderWidth: 4,
    ContentColor: 'rgb(0,0,255)',
    CanFilled: false,
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 
        Ctx.clearRect(0, 0, Ctx.canvas.clientWidth, Ctx.canvas.clientHeight);
        Ctx.strokeStyle = DrawCircle.BorderBrush;
        Ctx.lineWidth = DrawCircle.BorderWidth;
        Ctx.beginPath();
        
        //Get radius
        let dx = OffsetX - DrawCircle.LastX;
        let dy = OffsetY - DrawCircle.LastY;
        let dst = Math.sqrt(dx * dx + dy * dy);
        
        Ctx.arc(DrawCircle.LastX, DrawCircle.LastY, dst, 0, 2*Math.PI);
        if(DrawCircle.CanFilled)
        {
            Ctx.fillStyle = DrawCircle.ContentColor;
            Ctx.fill();
        }
        
    },
    LoadProperty: function(Width)
    {
        //getPropertyBar(CanvasWidth,BorderColor,BorderWidth,FillColor)
        return getPropertyBar(Width,this);
    },
    CompositeOperation: "source-over"
}

/* Triangle */
var DrawTriangle =
{
    Name : 'Triangle',
    CursorName:'cross',
    LastX: 0,
    LastY: 0,
    BorderBrush: 'rgb(255,0,0)',
    BorderWidth: 4,
    ContentColor: 'rgb(255,0,255)',
    CanFilled:false,
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 
        Ctx.clearRect(0, 0, Ctx.canvas.clientWidth, Ctx.canvas.clientHeight);
        Ctx.strokeStyle = DrawTriangle.BorderBrush;
        Ctx.lineWidth = DrawTriangle.BorderWidth;
        Ctx.beginPath();
        
        //Get radius
        Ctx.moveTo(OffsetX,OffsetY);
        Ctx.lineTo(DrawTriangle.LastX,OffsetY);
        Ctx.lineTo((DrawTriangle.LastX + OffsetX)/2,DrawTriangle.LastY);
        Ctx.lineTo(OffsetX,OffsetY);
        
        
        
        //Ctx.arc(DrawCircle.LastX, DrawCircle.LastY, dst, 0, 2*Math.PI);
        if(DrawTriangle.CanFilled)
        {
            Ctx.fillStyle = DrawTriangle.ContentColor;
            Ctx.fill();
        }
        
    },
    LoadProperty: function(Width)
    {
        return getPropertyBar(Width,this);
    },
    CompositeOperation: "source-over"
}



var DrawRectangle =
{
    Name : 'Rectangle',
    CursorName:'cross',
    LastX:0,
    LastY:0,
    BorderBrush: 'rgb(255,0,0)',
    BorderWidth: 4,
    ContentColor: 'rgb(0,0,255)',
    CanFilled:false,
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 
        Ctx.clearRect(0, 0, Ctx.canvas.clientWidth, Ctx.canvas.clientHeight);
        Ctx.strokeStyle = DrawRectangle.BorderBrush;
        Ctx.lineWidth = DrawRectangle.BorderWidth;
        Ctx.beginPath();
        
        //Get radius
        let dx = OffsetX - DrawRectangle.LastX;
        let dy = OffsetY - DrawRectangle.LastY;
        
        
        Ctx.rect(DrawRectangle.LastX,DrawRectangle.LastY,dx,dy);
        if(DrawRectangle.CanFilled)
        {
            Ctx.fillStyle = DrawRectangle.ContentColor;
            Ctx.fill();
        }
        
    },
    LoadProperty: function(Width)
    {
        return getPropertyBar(Width,this);
    },
    CompositeOperation: "source-over"
}


function getPropertyBar(CanvasWidth,Func)
{
    let doc = document.createDocumentFragment();
    
    //Color picker
    doc.appendChild(getColorPicker(CanvasWidth,1));
    //Border Color
    let br_color_txt = document.createElement('span');
    br_color_txt.innerText = 'Border Color';
    br_color_txt.style.width = '100%';
    br_color_txt.style.fontSize = '20px';
    br_color_txt.style.fontWeight = 'bold';
    doc.appendChild(br_color_txt);

    //Color Viewer
    let br_color_dv = document.createElement('div');
    br_color_dv.style.borderStyle = 'solid';
    br_color_dv.style.borderWidth = '2px';
    br_color_dv.style.borderColor = 'black';
    br_color_dv.style.width = '40px';
    br_color_dv.style.height = '40px';
    br_color_dv.style.backgroundColor = Func.BorderBrush;


    br_color_dv.addEventListener('click',(e)=>{
        let rgb = Func.BorderBrush;
        let my_clr = rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
        
        Color.RegisColorChangeCallback(function(new_color){

            Func.BorderBrush = new_color;
            br_color_dv.style.backgroundColor = Func.BorderBrush;
        });
        
        Color.ColorSelected = [ parseInt(my_clr[0]) , parseInt(my_clr[1]) , parseInt(my_clr[2]) ];
        
    });
    
    br_color_dv.click();

    
    doc.appendChild(br_color_dv);
        
    
   //Brush Width
    let size_text = document.createElement('span');
    size_text.innerText = 'Brush Width';
    size_text.style.width = '100%';
    size_text.style.fontSize = '20px';
    size_text.style.fontWeight = 'bold';
    doc.appendChild(size_text);

    let brush_width_text = document.createElement('span');
    brush_width_text.innerText = '4px';
    brush_width_text.style.width = '20%';

    let brush_width = document.createElement('input');
    brush_width.setAttribute('type','range');
    brush_width.setAttribute('min','1');
    brush_width.setAttribute('max','100');
    brush_width.setAttribute('value','4');
    brush_width.setAttribute('step','1');
    brush_width.style.width = '80%';
    brush_width.addEventListener('change',()=>{
        brush_width_text.innerText = brush_width.value + 'px';
        Func.BorderWidth = brush_width.value;
    });
    
    doc.appendChild(brush_width);
    doc.appendChild(brush_width_text);

    doc.appendChild(document.createElement('br'));
    
    //Fill Color

    //Check if Filled
    let can_filled_chbox = document.createElement('input');
    can_filled_chbox.setAttribute('type','checkbox');
    if(Func.CanFilled)
        can_filled_chbox.setAttribute('checked','');
    console.log(Func.CanFilled);
    can_filled_chbox.addEventListener('click',(e)=>{
       Func.CanFilled = can_filled_chbox.checked; 
    });
    doc.appendChild(can_filled_chbox);
    
    let can_filled_txt = document.createElement('span');
    can_filled_txt.innerText = 'Fill the content';
    can_filled_txt.style.fontSize = '20px';
    can_filled_txt.style.fontWeight = 'bold';
    doc.appendChild(can_filled_txt);
    
    
    doc.appendChild(document.createElement('br'));
    
    //Fill Color
    let fill_color_txt = document.createElement('span');
    fill_color_txt.innerText = 'Filled Color';
    fill_color_txt.style.width = '100%';
    fill_color_txt.style.fontSize = '20px';
    fill_color_txt.style.fontWeight = 'bold';
    doc.appendChild(fill_color_txt);

    //Color Viewer
    let fill_color_dv = document.createElement('div');
    fill_color_dv.style.borderStyle = 'solid';
    fill_color_dv.style.borderWidth = '2px';
    fill_color_dv.style.borderColor = 'black';
    fill_color_dv.style.width = '40px';
    fill_color_dv.style.height = '40px';
    fill_color_dv.style.backgroundColor = Func.ContentColor;


    fill_color_dv.addEventListener('click',(e)=>{
        let rgb = Func.ContentColor;
        let my_clr = rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
        
        Color.RegisColorChangeCallback(function(new_color){

            Func.ContentColor = new_color;
            fill_color_dv.style.backgroundColor = Func.ContentColor;
        });
        
        
        Color.ColorSelected = [ parseInt(my_clr[0]) , parseInt(my_clr[1]) , parseInt(my_clr[2]) ];
        
        
        
        
    });

    doc.appendChild(fill_color_dv);

    
    
    return doc;

}

function getBorder_ColorSelector(Width,ID)
{
        
    
}

function getCPwithCV(Width)
{
    let doc = document.createDocumentFragment();
       
   
    
    return doc;
}
