/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *      Export declare     
 */

export declare const AnyCanvas: {
    // CVS
    WebCanvas: typeof import("./canvas").WebCanvas,
    InfiniteCanvas: typeof import("./infinite").InfiniteCanvas,
    // Layer
    Layer: typeof import("./cvs/layer").Layer,
    // Shapes
    Shape: {
        Line: typeof import("./cvs/shape").Line;
        Rect: typeof import("./cvs/shape").Rect;
        Circle: typeof import("./cvs/shape").Circle;
        Ellipse: typeof import("./cvs/shape").Ellipse;
        Path: typeof import("./cvs/shape").Path;
        Text: typeof import("./cvs/shape").Text;

        Config: {
            Line: import("./cvs/shape").LineConfig;
            Rect: import("./cvs/shape").RectConfig;
            Circle: import("./cvs/shape").CircleConfig;
            Ellipse: import("./cvs/shape").EllipseConfig;
            Path: import("./cvs/shape").PathConfig;
            Text: import("./cvs/shape").TextConfig;
        }
    }
}