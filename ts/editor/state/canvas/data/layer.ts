/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  Layer
 */

import { Group, type ExtensionResolver } from "./group";

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

    static fromJSON(this: new (name: string, config: LayerConfig) => Layer, json: any, name?: string, resolver?: ExtensionResolver): Layer {
        const layer_name = name ?? json?.name;
        if (typeof layer_name !== "string" || layer_name.length === 0) {
            throw new Error(`Missing object name when restoring ${this.name}`);
        }
        const layer = Group.fromJSON.call(this, json, layer_name, resolver) as Layer;
        layer.zIndex = json?.zIndex ?? json?.config?.zIndex ?? 0;
        return layer;
    }

    toJSON(): { type: string, config: import("./object").ObjectBaseConfig, children: Record<string, any>, zIndex: number } {
        return {
            ...super.toJSON(),
            zIndex: this.zIndex,
        };
    }
};
