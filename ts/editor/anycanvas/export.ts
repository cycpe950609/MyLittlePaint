import { WebCanvas } from "./canvas";
import { InfiniteCanvas } from "./infinite";
import { Layer } from "./cvs/layer";
import { Line, Rect, Circle, Ellipse, Path, Text } from "./cvs/shape";

export const AnyCanvas = {
    // CVS
    WebCanvas,
    InfiniteCanvas,
    // Layer
    Layer,
    // Shapes
    Shape: {
        Line,
        Rect,
        Circle,
        Ellipse,
        Path,
        Text,
    },
};

// Types-only namespace to enable `AnyCanvas.Layer` / `AnyCanvas.Shape.Line` in type positions.
export namespace AnyCanvas {
    // CVS
    export type WebCanvas = import("./canvas").WebCanvas;
    export type InfiniteCanvas = import("./infinite").InfiniteCanvas;
    // Layer
    export type Layer = import("./cvs/layer").Layer;
    // Shapes
    export namespace Shape {
        export type Line = import("./cvs/shape").Line;
        export type Rect = import("./cvs/shape").Rect;
        export type Circle = import("./cvs/shape").Circle;
        export type Ellipse = import("./cvs/shape").Ellipse;
        export type Path = import("./cvs/shape").Path;
        export type Text = import("./cvs/shape").Text;

        export namespace Config {
            export type Line = import("./cvs/shape").LineConfig;
            export type Rect = import("./cvs/shape").RectConfig;
            export type Circle = import("./cvs/shape").CircleConfig;
            export type Ellipse = import("./cvs/shape").EllipseConfig;
            export type Path = import("./cvs/shape").PathConfig;
            export type Text = import("./cvs/shape").TextConfig;
        }
    }
}
