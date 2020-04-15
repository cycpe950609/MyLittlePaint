var Text = {
    Name: 'Text',
    CursorName:'text',
    TextColor: 'rgb(0,0,0)',
    TextSize:10,
    LastX:0,
    LastY:0,
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 
        
    },
    LoadProperty: function(Width)
    {
        let doc = document.createDocumentFragment();

        
        doc.appendChild(getColorPicker(Width,1));
        //Text Color
        let t_color_txt = document.createElement('span');
        t_color_txt.innerText = 'Text Color';
        t_color_txt.style.width = '100%';
        t_color_txt.style.fontSize = '20px';
        t_color_txt.style.fontWeight = 'bold';
        doc.appendChild(t_color_txt);
        
        //Color Viewer
        let t_color_dv = document.createElement('div');
        t_color_dv.style.borderStyle = 'solid';
        t_color_dv.style.borderWidth = '2px';
        t_color_dv.style.borderColor = 'black';
        t_color_dv.style.width = '40px';
        t_color_dv.style.height = '40px';
        t_color_dv.style.backgroundColor = Text.TextColor;
        
        
        t_color_dv.addEventListener('click',(e)=>{
            let rgb = Text.TextColor;
            let my_clr = rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
            Color.ColorSelected = [ parseInt(my_clr[0]) , parseInt(my_clr[1]) , parseInt(my_clr[2]) ];
        });
        
        Color.RegisColorChangeCallback(function(new_color){
            
            Text.TextColor = new_color;
            //console.log(Text.TextColor);
            t_color_dv.style.backgroundColor = Text.TextColor;
        });
        doc.appendChild(t_color_dv);
        
        
        //Text Size
        let size_text = document.createElement('span');
        size_text.innerText = 'Text Size';
        size_text.style.width = '100%';
        size_text.style.fontSize = '20px';
        size_text.style.fontWeight = 'bold';
        doc.appendChild(size_text);
        
        let brush_width_text = document.createElement('span');
        brush_width_text.innerText = '15px';
        brush_width_text.style.width = '20%';
        
        let text_size = document.createElement('input');
        text_size.setAttribute('type','range');
        text_size.setAttribute('min','1');
        text_size.setAttribute('max','100');
        text_size.setAttribute('value','15');
        text_size.setAttribute('step','1');
        text_size.style.width = '80%';
        text_size.addEventListener('change',()=>{
            brush_width_text.innerText = text_size.value + 'px';
            Brush.BrushWidth = text_size.value;
        });
        
        doc.appendChild(text_size);
        doc.appendChild(brush_width_text);
        
        return doc;
    },
    CompositeOperation: "source-over"
    

};