/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  Group of Shape     
 */

import { HistoryAction, ObjectBase, type HistoryDiff, type ObjectBaseConfig } from "./object";

export type GroupHistoryDiff = HistoryDiff<ObjectBaseConfig & { children?: Record<string, HistoryDiff<any>> }>;
export type ExtensionConstructor = new (name: string, config: any) => ObjectBase<any>;
export type ExtensionResolver = (type: string) => ExtensionConstructor | undefined;
export const groupSetExtensionResolver: unique symbol = Symbol("Group.setExtensionResolver");

export class Group extends ObjectBase<ObjectBaseConfig> {

    protected object_children: Map<string, ObjectBase<any>>
    protected children_count_changed: boolean = false;
    private extension_resolver?: ExtensionResolver;

    constructor(name: string, config: ObjectBaseConfig) {
        super(name, config);
        this.object_children = new Map();
    }

    // manage
    public add(object: ObjectBase<any>) {
        if (this.object_children.has(object.Name)) {
            throw new Error(`Object with id '${object.Name}' already exists in group '${this.Name}'`);
        }
        if (object instanceof Group) {
            object[groupSetExtensionResolver](this.extension_resolver);
        }
        this.object_children.set(object.Name, object);
    }
    public find(name: string): ObjectBase<any> | undefined {
        return this.object_children.get(name);
    }
    public has(name: string): boolean {
        return this.object_children.has(name);
    }
    public get changed(): boolean {
        if (super.changed) return true;
        if (this.children_count_changed) return true;
        const children_changed = Array.from(this.object_children.values()).map((item: ObjectBase<any>) => item.changed);
        return children_changed.some((val) => (val === true));
    }
    public get children(): ObjectBase<any>[] {
        return Array.from(this.object_children.values());
    }

    /** Interface */
    static fromJSON(this: new (name: string, config: any) => Group, json: any, name?: string, resolver?: ExtensionResolver): Group {
        const group_name = name ?? json?.name;
        if (typeof group_name !== "string" || group_name.length === 0) {
            throw new Error(`Missing object name when restoring ${this.name}`);
        }
        const group = new this(group_name, json?.config ?? {});

        const restoreObject = (object_json: any, object_name: string): ObjectBase<any> => {
            const object_type = object_json?.type;
            if (typeof object_type !== "string" || object_type.length === 0) {
                throw new Error(`Missing object type when restoring '${object_name}' in group '${group.Name}'`);
            }
            const child_constructor = resolver?.(object_type);
            if (!child_constructor) {
                throw new Error(`ObjectBase '${object_type}' is not registered.`);
            }

            const child = new child_constructor(object_name, object_json?.config ?? {});
            if (child instanceof Group && object_json?.children !== undefined && object_json.children !== null) {
                child[groupSetExtensionResolver](resolver);
                for (const [nested_name, nested_json] of Object.entries(object_json.children)) {
                    child.add(restoreObject(nested_json, nested_name));
                }
            }
            return child;
        };

        const children = json?.children;
        if (children === undefined || children === null) {
            return group;
        }
        if (resolver === undefined) {
            throw new Error(`Extension resolver is not set in '${group.Name}'. Please add the group to Layer/CanvasState first`);
        }
        group[groupSetExtensionResolver](resolver);
        for (const [child_name, child_json] of Object.entries(children)) {
            group.add(restoreObject(child_json, child_name));
        }
        return group;
    }
    toJSON(): { type: string, config: ObjectBaseConfig, children: Record<string, any> } {
        let childData: Record<string, any> = {};
        Array.from(this.object_children.keys()).forEach((name) => {
            const layer = this.object_children.get(name)!;
            childData[name] = layer.toJSON();
        });
        return {
            type: this.type,
            config: structuredClone(this.config),
            children: childData,
        };
    }
    /** History */

    public diff(): HistoryDiff<ObjectBaseConfig & { children: Record<string, HistoryDiff<any>> }> {
        let changed: HistoryDiff<ObjectBaseConfig & { children: Record<string, HistoryDiff<any>> }> = super.diff();
        this.children.forEach((child) => {
            if (changed.patch.children === undefined) changed.patch.children = {};
            changed.patch.children[child.Name] = child.diff();
        });
        return changed;
    }
    public patch(diff: GroupHistoryDiff): GroupHistoryDiff {
        // STEP 1: patch self
        const child_patch = diff.patch.children;
        delete diff.patch.children;
        const self_patch_result = super.patch(diff);
        let children_inverse_patch: Record<string, HistoryDiff<any>> = {};
        if (child_patch) {
            // STEP 2: patch children
            for (const [child_name, child_diff] of Object.entries(child_patch)) {
                switch (child_diff.action) {
                    case HistoryAction.Add: {
                        if (this.object_children.has(child_name)) throw new Error(`Child '${child_name}' already exists in group '${this.Name}'`);
                        const child_type = child_diff.type;
                        if (!child_type) throw new Error(`Missing 'type' in add patch for child '${child_name}' in group '${this.Name}'.`);

                        if (this.extension_resolver === undefined) throw new Error(`Extension resolver is not set in '${this.Name}'. Please add the group to Layer/CanvasState first`);
                        const child_constructor = this.extension_resolver?.(child_type);
                        if (!child_constructor) throw new Error(`ObjectBase '${child_type}' is not registered.`);

                        const child = new child_constructor(child_name, child_diff.patch);
                        this.add(child);
                        children_inverse_patch[child_name] = {
                            action: HistoryAction.Remove,
                            type: child_type,
                            patch: {},
                        };
                        this.children_count_changed = true;
                        break;
                    }
                    case HistoryAction.Remove: {
                        if (!this.object_children.has(child_name)) throw new Error(`Child '${child_name}' does not exist in group '${this.Name}'`);
                        const child_obj = this.object_children.get(child_name)!;
                        const child_type = child_obj.type;
                        const inverse = child_obj.patch({ action: HistoryAction.Remove, type: child_type, patch: {} });
                        this.object_children.delete(child_name);
                        children_inverse_patch[child_name] = inverse;
                        this.children_count_changed = true;
                        break;
                    }
                    case HistoryAction.Update: {
                        if (!this.object_children.has(child_name)) throw new Error(`Child '${child_name}' does not exist in group '${this.Name}'`);
                        const child_obj = this.object_children.get(child_name)!;
                        const child_patch_result = child_obj.patch(child_diff);
                        children_inverse_patch[child_name] = child_patch_result;
                        break;
                    }
                    default:
                        throw new Error(`Unknown history action: ${diff.action}`);
                }
            }
        }
        return {
            action: self_patch_result.action,
            type: this.type,
            patch: {
                ...self_patch_result.patch,
                children: children_inverse_patch,
            },
        };
    }

    public flush(): void {
        // flush added children to children
        super.flush();
        this.children.forEach((child) => child.flush());
    }
    public rendered(): void {
        super.rendered();
        this.children.forEach((child) => child.rendered());
        this.children_count_changed = false;
    }

    public [groupSetExtensionResolver](resolver?: ExtensionResolver): void {
        this.extension_resolver = resolver;
        this.children.forEach((child) => {
            if (child instanceof Group) {
                child[groupSetExtensionResolver](resolver);
            }
        });
    }
}
