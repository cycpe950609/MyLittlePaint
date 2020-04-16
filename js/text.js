var Text = {
    Name: 'Text',
    CursorName:'text',
    TextColor: 'rgb(0,0,0)',
    TextSize:60,
    TextX:0,
    TextY:0,
    TextFont:'monospace',
    TextContent:"",
    ifInputText:false,
    CanFinishDrawing :true,
    MouseDown: function(e)
    {
        if(this.ifInputText == false)
        {
            //console.log('MouseDown');
            this.TextX = e.offsetX;
            this.TextY = e.offsetY;
            this.TextContent = "";
            this.ifInputText = true;
            this.CanFinishDrawing = false;
        }
        
    },
    KeyDown: function(e)
    {
        
        if(this.ifInputText == true)
        {
            //console.log('KeyDown');
            switch(e.key)
            {
                case 'Alt':
                case 'Escape':
                case 'Control':
                case 'Shift':
                case 'CapsLock':
                case 'Enter':
                    this.ifInputText = false;
                    this.CanFinishDrawing = true;
                    break;
                case 'Tab':
                    this.TextContent = this.TextContent + '    ';
                    break;
                case 'Backspace':
                    this.TextContent = this.TextContent.substring(0,this.TextContent.length-1);
                    break;
                default:
                    this.TextContent = this.TextContent + e.key;
                    break;
            }
            //console.log(this.TextContent);
        }
    },
    DrawFunction: function(Ctx,OffsetX,OffsetY)
    { 

        Ctx.clearRect(0,0,Ctx.canvas.clientWidth,Ctx.canvas.clientHeight);
        Ctx.beginPath();
        Ctx.font = this.TextSize + 'px ' + this.TextFont;
        Ctx.fillStyle = this.TextColor;
        if(this.CanFinishDrawing)
        {
            Ctx.fillText(this.TextContent,this.TextX,this.TextY);
            console.log('Test');
        }
        else
            Ctx.fillText(this.TextContent + '_',this.TextX,this.TextY);

        Ctx.stroke();

    },
    LoadProperty: function(Width)
    {
        return getTextPropertyBar(Width);
    },
    CompositeOperation: "source-over"
    

};


function getTextPropertyBar(Width)
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
    brush_width_text.innerText = '60px';
    brush_width_text.style.width = '20%';

    let text_size = document.createElement('input');
    text_size.setAttribute('type','range');
    text_size.setAttribute('min','1');
    text_size.setAttribute('max','500');
    text_size.setAttribute('value','60');
    text_size.setAttribute('step','1');
    text_size.style.width = '80%';
    text_size.addEventListener('change',()=>{
        brush_width_text.innerText = text_size.value + 'px';
        Text.TextSize = text_size.value;
    });

    doc.appendChild(text_size);
    doc.appendChild(brush_width_text);
    
    doc.appendChild(document.createElement('br'));
    
    //FontFamily
    let font_family = document.createElement('span');
    font_family.innerText = 'Font';
    font_family.style.width = '100%';
    font_family.style.fontSize = '20px';
    font_family.style.fontWeight = 'bold';
    doc.appendChild(font_family);
    
    //let form = document.createElement('form');
    
    let txtFont = document.createElement('select');
    
    txtFont.setAttribute('onchange','TextChangeFont(this)');
    txtFont.style.width = '80%';
    txtFont.innerHTML = '<option value="monospace"  selected>Monospace</option>' +
                        '<option value="sans-serif"  >Sans-serif</option>' +
                        '<option value="serif"      >Serif</option>';
    
    doc.appendChild(txtFont);
    
    //doc.appendChild(form);

    return doc;
}

function TextChangeFont(option)
{
    let vl = option.options[option.selectedIndex].value;
    Text.TextFont = vl;
}