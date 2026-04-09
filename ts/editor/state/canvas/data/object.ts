/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  ObjectBase
 */


export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};

export enum HistoryAction {
    Add = "add",
    Remove = "remove",
    Update = "update",
}
export type HistoryDiff<ShapeConfig extends ObjectBaseConfig> = {
    action: HistoryAction;
    type: string;
    patch: Partial<ShapeConfig>;
}

export function objAttr<ShapeConfig extends ObjectBaseConfig>(configKey: keyof ShapeConfig) {
    // Create get/set using decorator
    return function (target: ObjectBase<ShapeConfig>, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get(this: ObjectBase<ShapeConfig>) {
                return this.new_value.get(configKey) ?? this.config[configKey];
            },
            set(this: ObjectBase<ShapeConfig>, value: any) {
                if (value === this.new_value.get(configKey)) return;
                // NOTE: If value is equal to origin but different than new_value,
                //       we still need treat it as modified, otherwise, re-render wont triggered
                this.new_value.set(configKey, value);
                this.new_value_modified.set(configKey, true);
            },
        });
    };
}

export type ObjectBaseConfig = {
    globalCompositeOperation?: GlobalCompositeOperation;

    transformCenter?: Point;
    transformMatrix?: [number, number, number, number, number, number];

    visible?: boolean;
};

export class ObjectBase<ObjectConfig extends ObjectBaseConfig> {
    protected first_init: boolean = true;
    protected diffed: boolean = false;

    protected config: Required<ObjectConfig>;
    protected new_value: Map<keyof ObjectConfig, ObjectConfig[keyof ObjectConfig]> = new Map();
    protected new_value_modified: Map<keyof ObjectConfig, boolean> = new Map();
    protected object_name: string;
    constructor(name: string, config: ObjectConfig) {
        this.config = this.valid_and_init_config(config || {} as ObjectConfig);
        Object.keys(this.config).forEach((key) => {
            this.new_value.set(key as keyof ObjectConfig, this.config[key as keyof ObjectConfig]);
            this.new_value_modified.set(key as keyof ObjectConfig, true);
        });
        this.object_name = name;
    }
    protected valid_and_init_config(config: ObjectConfig): Required<ObjectConfig> {
        // valid and init value if undefined
        return {
            globalCompositeOperation: config.globalCompositeOperation ?? 'source-over',
            transformCenter: config.transformCenter ?? { x: 0, y: 0 },
            transformMatrix: config.transformMatrix ?? [1, 0, 0, 1, 0, 0],
            visible: config.visible ?? true,
        } as Required<ObjectConfig>;
    }

    public get changed(): boolean {
        return Array.from(this.new_value_modified.values()).some((val) => (val === true));
    }
    public get type(): string {
        return this.constructor.name;
    }

    public get Name(): string {
        return this.object_name;
    }

    @objAttr('globalCompositeOperation')
    declare public globalCompositeOperation: GlobalCompositeOperation;

    @objAttr('transformCenter')
    declare public transformCenter: Point;

    @objAttr('transformMatrix')
    declare public transformMatrix: [number, number, number, number, number, number];

    @objAttr('visible')
    declare public visible: boolean;

    /** Interface */
    static fromJSON(_json: any): ObjectBase<any> {
        throw new Error("Not implemented");
    }
    toJSON(): ObjectConfig & { type: string } {
        return {
            ...this.config,
            type: this.type,
        };
    }
    /** History */
    public diff(): HistoryDiff<ObjectConfig> {
        const changed: Partial<ObjectConfig> = {};
        for (const key of Array.from(this.new_value.keys()) as Array<keyof ObjectConfig>) {
            changed[key] = this.new_value.get(key);
        }
        this.diffed = true;
        return {
            action: this.first_init ? HistoryAction.Add : HistoryAction.Update,
            type: this.type,
            patch: changed
        };
    }
    public patch(diff: HistoryDiff<ObjectConfig>): HistoryDiff<ObjectConfig> {
        switch (diff.action) {
            case HistoryAction.Add: {
                throw new Error(`INTERNAL_ERROR: ${this.constructor.name} ${this.Name} received 'Add' action in patch, which should be handled by creating a new object instead of patching an existing one.`);
            }
            case HistoryAction.Remove: {
                return {
                    action: HistoryAction.Add,
                    type: this.type,
                    patch: structuredClone(this.config),
                };
            }
            case HistoryAction.Update: {
                let inverse_patch: Partial<ObjectConfig> = {};
                for (const [raw_key, value] of Object.entries(diff.patch) as Array<[keyof ObjectConfig, ObjectConfig[keyof ObjectConfig]]>) {
                    inverse_patch[raw_key] = structuredClone(this.config[raw_key]);
                    this.new_value_modified.set(raw_key, true);
                    this.new_value.set(raw_key, value);
                }
                return {
                    action: HistoryAction.Update,
                    type: this.type,
                    patch: inverse_patch,
                };
            }
            default:
                throw new Error(`Unknown history action: ${diff.action}`);
        }
    }
    public rendered(): void {
        this.new_value_modified.clear();
    }
    public flush(): void {
        if (this.diffed) {
            this.first_init = false;
        }
        for (const [key, value] of this.new_value.entries()) {
            this.config[key] = value;
        }
        this.new_value.clear();
        this.new_value_modified.clear();
        this.diffed = false;
    }
}

