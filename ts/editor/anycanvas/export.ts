import { WebCanvas } from "./canvas";
import { InfiniteCanvas } from "./infinite";
import { Layer } from "./cvs/layer";
import { Line, Rect, Circle, Ellipse, Path, Text } from "./cvs/shape";
import type { Point, Size } from "./cvs/utils";
import { degreeToRadian, radianToDegree, rotateAround, convertViewToCanvas } from "./cvs/coordinate";

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
    Util: {
        degreeToRadian,
        radianToDegree,
        rotateAround,
        convertViewToCanvas,
    }
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
    export namespace Util {
        export type Point = import("./cvs/utils").Point;
        export type Size = import("./cvs/utils").Size;
        export type ViewportConfig = import("./cvs/coordinate").ViewportConfig;
        export type degreeToRadian = typeof import("./cvs/coordinate").degreeToRadian;
        export type radianToDegree = typeof import("./cvs/coordinate").radianToDegree;
        export type rotateAround = typeof import("./cvs/coordinate").rotateAround;
        export type convertViewToCanvas = typeof import("./cvs/coordinate").convertViewToCanvas;
    }
}
