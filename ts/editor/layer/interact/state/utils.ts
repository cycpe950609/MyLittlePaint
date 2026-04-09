/**
 * Created : 2026/03/26
 * Author  : Ting Fang, Tsai
 * About:
 *  Utility
*/

import { degreeToRadian } from "../../../utils/coordinate";
import { type Point, type Size } from "../../../utils/misc";

export class ViewPoint {

    private view_point: Point;
    private view_config: ViewportConfig;
    private cvs_point?: Point;
    private changed: boolean = true;

    constructor(point: Point, cfg: ViewportConfig) {
        this.view_point = structuredClone(point);
        this.view_config = structuredClone(cfg)
    }
    // private
    private convertViewToCanvas(viewCfg: ViewportConfig, viewPoint: Point): Point {
        let center_x = viewCfg.size.width / 2
        let center_y = viewCfg.size.height / 2
        let new_x_wo_rot = (viewPoint.x - center_x) / viewCfg.scale;
        let new_y_wo_rot = (viewPoint.y - center_y) / viewCfg.scale;
        let rot_deg = degreeToRadian(viewCfg.rotDeg);
        let new_delta_x = new_x_wo_rot * Math.cos(rot_deg) + new_y_wo_rot * Math.sin(rot_deg);
        let new_delta_y = new_x_wo_rot * (-Math.sin(rot_deg)) + new_y_wo_rot * Math.cos(rot_deg);
        let new_x = new_delta_x + viewCfg.center.x;
        let new_y = new_delta_y + viewCfg.center.y;
        return { "x": new_x, "y": new_y }
    }

    // public property
    public get viewX(): number {
        return this.view_point.x;
    }
    public set viewX(value: number) {
        this.view_point.x = value;
        this.changed = true;
    }

    public get viewY(): number {
        return this.view_point.y;
    }
    public set viewY(value: number) {
        this.view_point.y = value;
        this.changed = true;
    }

    public get viewPoint(): Point {
        return structuredClone(this.view_point);
    }
    public set viewPoint(value: Point) {
        this.view_point = structuredClone(value);
        this.changed = true;
    }

    public get cvsX(): number {
        if ((this.changed) || (this.cvs_point === undefined)) {
            this.cvs_point = this.convertViewToCanvas(this.view_config, this.view_point);
        }
        return this.cvs_point.x;

    }
    public get cvsY(): number {
        if ((this.changed) || (this.cvs_point === undefined)) {
            this.cvs_point = this.convertViewToCanvas(this.view_config, this.view_point);
        }
        return this.cvs_point.y;
    }
    public get cvsPoint(): Point {
        if ((this.changed) || (this.cvs_point === undefined)) {
            this.cvs_point = this.convertViewToCanvas(this.view_config, this.view_point);
        }
        return structuredClone(this.cvs_point);
    }
};

export type ViewportConfig = {
    center: Point;
    size: Size;
    scale: number;
    rotDeg: number;
};

