var Brush = {
    Name: 'Brush',
    CursorName:'brush',
    BrushColor: 'rgb(0,255,0)',
    BrushWidth:10,
    LastX:0,
    LastY:0,
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 
        //console.log('Test');
        Ctx.strokeStyle = Brush.BrushColor;
        Ctx.lineWidth = Brush.BrushWidth;
        Ctx.lineJoin = 'round';
        Ctx.lineCap = 'round';
        Ctx.beginPath();
        Ctx.moveTo(Brush.LastX, Brush.LastY);
        Ctx.lineTo(OffsetX, OffsetY);

        [Brush.LastX, Brush.LastY] = [OffsetX, OffsetY];
    },
    LoadProperty: function(Width)
    {
        let doc = document.createDocumentFragment();
       
        doc.appendChild(getColorPicker(Width,1));
        //Brush Color
        let br_color_txt = document.createElement('span');
        br_color_txt.innerText = 'Brush Color';
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
        br_color_dv.style.backgroundColor = Brush.BrushColor;
        
        
        br_color_dv.addEventListener('click',(e)=>{
            let rgb = Brush.BrushColor;
            let my_clr = rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
            Color.ColorSelected = [ parseInt(my_clr[0]) , parseInt(my_clr[1]) , parseInt(my_clr[2]) ];
        });
        
        Color.RegisColorChangeCallback(function(new_color){
            
            Brush.BrushColor = new_color;
            console.log(Brush.BrushColor);
            br_color_dv.style.backgroundColor = Brush.BrushColor;
        });
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
            Brush.BrushWidth = brush_width.value;
        });
        
        doc.appendChild(brush_width);
        doc.appendChild(brush_width_text);
        
        doc.addEventListener('DOMContentLoaded',(e)=>{
            br_color_dv.onclick();
        });
    
        
        return doc;
    },
    CompositeOperation: "source-over"
    

};


function brushwidth_change(Range)
{
    console.log(Range);
    Brush.BrushWidth = Range.value;
}