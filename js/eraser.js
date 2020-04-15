var Eraser = {
    Name: 'Eraser',
    CursorName: 'eraser',
    BrushWidth: 10,
    BrushColor: 'white',
    LastX: 0,
    LastY: 0,
    NextX:0,
    NextY:0,
    ifDrawing: false,
    ifMouseMove: false,
    MouseDown: function(e){
        [this.LastX, this.LastY] = [e.offsetX, e.offsetY];
        [this.NextX, this.NextY] = [e.offsetX, e.offsetY];
        this.ifDrawing = true;
        this.ifMouseMove = false;
        this.CanFinishDrawing = false;
    },
    MouseMove: function(e){
        if(!this.ifDrawing) return;
    
        this.ifMouseMove = true;
        
        [this.NextX, this.NextY] = [e.offsetX, e.offsetY];
    },
    MouseUp: function(e){
        this.CanFinishDrawing = true;
        this.ifMouseMove = false;
        this.ifDrawing = false;
    },
    MouseOut: function(e){
        this.CanFinishDrawing = true;
        this.ifMouseMove = false;
        this.ifDrawing = false; 
        
    },
    CanFinishDrawing :true,
    DrawFunction: function (Ctx)
    { 
        if(this.ifDrawing)
        {
            let OffsetX = this.NextX;
            let OffsetY = this.NextY;
            //console.log('Test');
            Ctx.strokeStyle = this.BrushColor;//Should same as background
            Ctx.lineWidth = this.BrushWidth;
            Ctx.lineJoin = 'round';
            Ctx.lineCap = 'round';
            Ctx.beginPath();
            Ctx.moveTo(this.LastX, this.LastY);
            Ctx.lineTo(OffsetX, OffsetY);

            [this.LastX, this.LastY] = [OffsetX, OffsetY];
            
            Ctx.stroke();
        }
       
    },
    LoadProperty: function()
    {
        let doc = document.createDocumentFragment();
        
        //Brush Width
        let size_text = document.createElement('span');
        size_text.innerText = 'Eraser Width';
        size_text.style.width = '100%';
        size_text.style.fontSize = '20px';
        size_text.style.fontWeight = 'bold';
        doc.appendChild(size_text);
        
        let brush_width_text = document.createElement('span');
        brush_width_text.innerText = '10px';
        brush_width_text.style.width = '20%';
        
        let brush_width = document.createElement('input');
        brush_width.setAttribute('type','range');
        brush_width.setAttribute('min','1');
        brush_width.setAttribute('max','100');
        brush_width.setAttribute('value','10');
        brush_width.setAttribute('step','1');
        brush_width.style.width = '80%';
        brush_width.addEventListener('change',()=>{
            brush_width_text.innerText = brush_width.value + 'px';
            Eraser.BrushWidth = brush_width.value;
        });
        
        doc.appendChild(brush_width);
        doc.appendChild(brush_width_text);
        
        
        return doc;
    },
    CompositeOperation: "destination-out"

};