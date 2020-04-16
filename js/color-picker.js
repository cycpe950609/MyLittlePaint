var Color = {
    clr_internal : 'rgb(255,255,255)',
    R : 255,
    G : 0,
    B : 0,
    clr_listener : function(val){},
    
    RegisColorChangeCallback: function(Listerner){
        Color.clr_listener = Listerner;
    },
    IDtoChange : 1,
    
    set ColorSelected(pixel)
    {
        //console.log(pixel);
        this.clr_internal = 'rgb(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ')';
        setColorRangeValue('R',this.IDtoChange,pixel[0]);
        Color.R = pixel[0];
        setColorRangeValue('G',this.IDtoChange,pixel[1]);
        Color.G = pixel[1];
        setColorRangeValue('B',this.IDtoChange,pixel[2]);
        Color.B = pixel[2];
        setColorViewer(Color.IDtoChange,pixel);
        
        
        this.clr_listener(Color.clr_internal);
    },
    get ColorSelected()
    {
        return Color.clr_internal;
    }
    
};


function getColorPicker(Width,ID)
{
    let picker = document.createDocumentFragment();
    
    picker.appendChild(getColorWheel(Width,ID));
    picker.appendChild(getColorViewer(ID));
    picker.appendChild(getSingleChannelWithRange('R',ID));
    picker.appendChild(getSingleChannelWithRange('G',ID));
    picker.appendChild(getSingleChannelWithRange('B',ID)); 
    

    return picker;
}
function getColorWheel(Width,ID)
{
    let cw = document.createElement('canvas');
    let cw_ctx = cw.getContext('2d');
    
    cw.setAttribute('width',Width);
    cw.setAttribute('height',Width);
    cw.style.padding = '0px';
    
    let img = new Image();
    img.onload = ()=>{ cw_ctx.drawImage(img,0,0,Width,Width); }
    
    img.src = ColorWheelImg;
    
    
    cw.addEventListener('mousemove',(e)=>
    {
        let offsetX = e.offsetX;
        let offsetY = e.offsetY;
        let pixel = cw_ctx.getImageData(offsetX,offsetY,1,1).data;
        setColorViewer(ID,pixel);
    }); 
    cw.addEventListener('mousedown',(e)=>
    {
        let offsetX = e.offsetX;
        let offsetY = e.offsetY;
        let pixel = cw_ctx.getImageData(offsetX,offsetY,1,1).data;
        Color.ColorSelected = pixel;
    });
    
    cw.style.cursor = 'url(img/cursor/cross.cur), auto';
    
    return cw;
}

function getColorViewer(ID)
{
    let dv = document.createElement('div');
    dv.setAttribute('id','color-view-' + ID)
    dv.style.borderStyle = 'solid';
    dv.style.borderWidth = '2px';
    dv.style.borderColor = 'black';
    
    dv.style.width = '80%';
    dv.style.height = '25px';
    dv.style.backgroundColor = 'rgb(255,255,255)';
    
    return dv;
    
}
function setColorViewer(ID,clr)
{
    let dv = document.getElementById('color-view-' + ID);
    dv.style.backgroundColor = 'rgb(' + clr[0] + ',' + clr[1] + ',' + clr[2] + ')';
}

function getSingleChannelWithRange(Name,ID)
{
    let rang = document.createDocumentFragment();
    
    //顯示Range的名
    let lbl = document.createElement('span');
    lbl.innerText = Name + ' : ';
    lbl.style.width = '15%';
    
    
    let lbl2 = document.createElement('span');
    lbl2.setAttribute('id', Name + '-lbl-' + ID);//Use to change value when color selected
    lbl2.innerText = '127';
    lbl2.style.width = '15%';
    
    
    let color_range = document.createElement('input');
    color_range.setAttribute('id', Name + '-range-' + ID);//Use to change value when color selected
    color_range.setAttribute('type','range');
    color_range.setAttribute('min','0');
    color_range.setAttribute('max','255');
    color_range.setAttribute('value','127');
    color_range.setAttribute('setep','1');
    color_range.style.width = '70%';
    color_range.addEventListener('change',(e)=>{
        console.log(Name);
        switch(Name)
        {
            case 'R':
                console.log(color_range.value);
                Color.R = color_range.value;
                break;
            case 'G':
                Color.G = color_range.value;
                break;
            case 'B':
                Color.B = color_range.value;
                break;
            default:
                throw 'NameError';
        }
            
        UpdateColor();
    });

    let brk = document.createElement('br');
    
    
    //顯示Range的值
    rang.appendChild(lbl);
    rang.appendChild(color_range);
    rang.appendChild(lbl2);
    rang.appendChild(brk);
    

    
    
    return rang;
}

function UpdateColor()
{
    console.log('rgb(' + Color.R + ',' + Color.G + ',' + Color.B + ')');
    Color.ColorSelected = [ Color.R , Color.G , Color.B ];
}
function setColorRangeValue(Name,ID,val)
{
    let rang = document.getElementById(Name + '-range-' + ID);
    //console.log(rang);
    rang.value = val;
    let txt = document.getElementById(Name + '-lbl-' + ID);
    txt.innerText = val;
}