/**
 * Created : 2026/03/24
 * Author  : Ting Fang, Tsai
 * About:
 *      Export declare     
 */

// type namespace
export declare namespace AnyCanvas {
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