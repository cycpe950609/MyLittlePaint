/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *  Circle Canvas Function     
 */
import AnyCanvas from "../anycanvas";
import { PolygonBase } from "./base";


export class CircleCVSFunc extends PolygonBase {
    Name = 'Circle';
    HistoryName = 'polygon-circle';
    ImgName = 'circle';
    Tip = 'Circle';
    DrawFunction = (Ctx: AnyCanvas.Layer, _width: number, _height: number) => {

        let circle = Ctx.find(this.shapeID);
        if (circle === undefined) {
            circle = new AnyCanvas.Shape.Circle({
                name: this.shapeID
            });
            Ctx.add(circle);
        }

        if (!(circle instanceof AnyCanvas.Shape.Circle)) {
            throw new Error("Polygon should be `Circle`");
        }


        if (this.ifDrawing) {
            // Ctx.destroyChildren();
            //Get radius
            let dx = this.NextX - this.LastX;
            let dy = this.NextY - this.LastY;
            let dst = Math.sqrt(dx * dx + dy * dy);

            circle.x = this.LastX;
            circle.y = this.LastY;
            circle.radius = dst;
            circle.fill = this.CanFilled ? this.ContentColor : 'transparent';
            circle.stroke = this.BorderBrush;
            circle.strokeWidth = this.BorderWidth;
        }
    };
}

