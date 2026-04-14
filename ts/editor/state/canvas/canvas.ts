/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  CanvasState
 */

import { groupSetExtensionResolver, type ExtensionConstructor } from "./data/group";
import { Layer } from "./data/layer";
import type { ObjectBase, Size } from "./data/object";

export type CanvasStateConfig = {
    name: string,
    size?: Size,
}

export type CompositeConfig = {
    startZIndex?: number,
    endZIndex?: number,
}

export class CanvasState {
    private cvs_config: CanvasStateConfig;

    private layer_children: Record<string, Layer>;
    private layer_add_index: Record<string, number>;
    private activated_layer?: Layer;
    constructor(config: CanvasStateConfig) {
        this.cvs_config = structuredClone(config);
        this.layer_children = {};
        this.layer_add_index = {}
        this.extensions = {};
    }
    // properties
    public get Name(): string {
        return this.cvs_config.name;
    }
    public get Size(): Size {
        return this.cvs_config.size ?? { width: Infinity, height: Infinity };
    }

    // manage
    public clear() {
        this.layer_children = {};
        this.layer_add_index = {};
        this.activated_layer = undefined;
    }
    public add(layer: Layer) {
        if (this.layer_children[layer.Name]) {
            throw new Error(`Layer with id '${layer.Name}' already exists in canvas '${this.Name}'`);
        }
        layer[groupSetExtensionResolver]((type) => this.get_extension(type));
        this.layer_add_index[layer.Name] = Object.keys(this.layer_children).length;
        this.layer_children[layer.Name] = layer;
        if (this.activated_layer === undefined) this.activated_layer = layer;
    }
    public find(name: string): Layer | undefined {
        return this.layer_children[name];
    }
    public has(name: string): boolean {
        return this.layer_children[name] !== undefined;
    }

    public activate(name: string): Layer {
        const layer = this.find(name);
        if (!layer) {
            throw new Error(`Layer with id '${name}' does not exist in canvas '${this.Name}'`);
        }
        this.activated_layer = layer;
        return layer;
    }
    public get activateLayer(): Layer {
        if (this.activated_layer === undefined) throw new Error(`No activated layer in canvas '${this.Name}'`);
        return this.activated_layer;
    }

    public orderedLayers(config?: CompositeConfig): Layer[] {
        // Composite all layers
        // TODO: Test if this render order is correct. 
        let layer_list: Layer[] = []
        const sortedLayers = Object.entries(this.layer_children)
            .sort((layer1: [string, Layer], layer2: [string, Layer]) => {
                const zDiff = layer1[1].zIndex - layer2[1].zIndex;
                return zDiff !== 0 ? zDiff : this.layer_add_index[layer1[0]] - this.layer_add_index[layer2[0]];
            });

        for (const [, layer] of sortedLayers) {
            const isLargerThanStart: boolean = (config?.startZIndex) ? layer.zIndex >= config.startZIndex : true;
            const isSmallerThanEnd: boolean = (config?.endZIndex) ? layer.zIndex <= config.endZIndex : true;
            if (isLargerThanStart && isSmallerThanEnd) layer_list.push(layer);
        }
        return layer_list;
    }

    /** Extension */
    private extensions: Record<string, ExtensionConstructor>;
    public register(name: string, extension: typeof ObjectBase<any>): void {
        /** Register extension */
        this.extensions[name] = extension;
    }
    private get_extension(type: string): ExtensionConstructor | undefined {
        return this.extensions[type];
    }
    public restoreFromJSON(json: any): void {
        const restored = CanvasState.fromJSON(json, (type) => this.get_extension(type));
        restored.extensions = this.extensions;
        this.cvs_config = restored.cvs_config;
        this.layer_children = restored.layer_children;
        this.layer_add_index = restored.layer_add_index;
        this.activated_layer = restored.activated_layer;
    }
    /** JSON */
    static fromJSON(json: any, resolver?: (type: string) => ExtensionConstructor | undefined): CanvasState {
        const canvas = new CanvasState({
            name: json?.name,
            size: {
                width: json?.size?.width ?? undefined,
                height: json?.size?.height ?? undefined,
            },
        });

        const layerEntries = Object.entries(json?.layers ?? {});
        for (const [layer_name, layer_json] of layerEntries) {
            if (resolver === undefined) {
                throw new Error(`Extension resolver is required when restoring layer '${layer_name}'`);
            }
            const layer = Layer.fromJSON(layer_json, layer_name, resolver);
            canvas.add(layer);
        }

        if (json?.addIdx !== undefined) {
            Object.assign((canvas as any).layer_add_index, json.addIdx);
        }

        if (json?.activated !== undefined) {
            canvas.activate(json.activated);
        }

        return canvas;
    }
    toJSON(): any {
        let layerData: Record<string, any> = {};
        Object.entries(this.layer_children).forEach(([name, layer]) => {
            layerData[name] = layer.toJSON();
        });
        let layerAddIndex = structuredClone(this.layer_add_index);
        let activatedLayerName = this.activated_layer?.Name;
        return {
            name: this.Name,
            size: this.Size,
            layers: layerData,
            addIdx: layerAddIndex,
            activated: activatedLayerName,
        };
    }
};
