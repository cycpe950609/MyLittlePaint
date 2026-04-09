/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Layer
 */

import { Group } from "./group";

export type LayerConfig = {
    globalCompositeOperation?: GlobalCompositeOperation;
    // NOTE: No transform in `Layer`
    zIndex?: number; // Higher zIndex means rendered on top of lower ones. Default is 0.
}
export class Layer extends Group {
    private layer_z_index: number = 0;

    constructor(name: string, config: LayerConfig) {
        super(name, { globalCompositeOperation: config.globalCompositeOperation });
        this.layer_z_index = config.zIndex ?? 0;
    }

    // properties
    public get zIndex(): number {
        return this.layer_z_index;
    }
    public set zIndex(zIdx: number) {
        this.layer_z_index = zIdx;
    }
};
