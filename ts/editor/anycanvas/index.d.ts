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

// type namespace
export namespace AnyCanvas {
    // CVS
    type WebCanvas = import("./canvas").WebCanvas;
    type InfiniteCanvas = import("./infinite").InfiniteCanvas;
    // Layer
    type Layer = import("./cvs/layer").Layer;
    // Shapes
    namespace Shape {
        type Line = import("./cvs/shape").Line;
        type Rect = import("./cvs/shape").Rect;
        type Circle = import("./cvs/shape").Circle;
        type Ellipse = import("./cvs/shape").Ellipse;
        type Path = import("./cvs/shape").Path;
        type Text = import("./cvs/shape").Text;

        // Config
        namespace Config {
            type Line = import("./cvs/shape").LineConfig;
            type Rect = import("./cvs/shape").RectConfig;
            type Circle = import("./cvs/shape").CircleConfig;
            type Ellipse = import("./cvs/shape").EllipseConfig;
            type Path = import("./cvs/shape").PathConfig;
            type Text = import("./cvs/shape").TextConfig;
        }

    }
}