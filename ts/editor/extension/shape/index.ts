import { BrushEditable, EraserEditable } from "./brush";
import { CircleEditable, CircleRender, CircleShape, EllipseRender, EllipseShape } from "./circle";
import { LineEditable, LineRender, LineShape } from "./line";
import { PathEditable, PathRender, PathShape } from "./path";
import { btnPolygon, PolygonEditable } from "./polygon";
import { RectEditable, RectRender, RectShape } from "./rect";
import { TextRender, TextShape } from "./text";
import { TriangleEditable } from "./triangle";


export const ShapeExtension = {
    Circle: {
        Data: CircleShape,
        Render: CircleRender,
        Editable: CircleEditable,
    },
    Ellipse: {
        Data: EllipseShape,
        Render: EllipseRender,
    },
    Line: {
        Data: LineShape,
        Render: LineRender,
        Editable: LineEditable,
    },
    Path: {
        Data: PathShape,
        Render: PathRender,
        Editable: PathEditable,
    },
    Rect: {
        Data: RectShape,
        Render: RectRender,
        Editable: RectEditable,
    },
    Text: {
        Data: TextShape,
        Render: TextRender,
    },
    Brush: {
        Editable: BrushEditable,
    },
    Triangle: {
        Editable: TriangleEditable,
    },
    Eraser: {
        Editable: EraserEditable,
    },
    Polygon: {
        ToolButton: btnPolygon,
        Editable: PolygonEditable,
    }
}
