import Konva from "konva";
import { type GroupConfig } from "konva/lib/Group";
// import { KonvaEventListener } from "konva/lib/Node";
import { v4 as uuidv4 } from "uuid";
import type SidebarInterface from '../editorUI/interface/sidebar'
import { type HistoryLogEntry } from "./historyLogger";
import { EditorCanvas } from "./modeEditor";
import { Div, Img, Table, Td, Tr } from "../editorUI/util/Element";
import { useConsumer } from "../editorUI/util/useHook";
import { addShape } from "./internalData";
import type { Point } from "./anycanvas/cvs/utils";

export class LayerInfo {
    public Snapshot: string = "";
    public Name: string = "";
    public ID: string = "";
}

export class LayerManager {
    private layerList = new Map<string, Layer>();
    private defaultLayer: string;

    private cvs !: Konva.Stage;
    private ctx: Konva.Layer;

    private id2zIndex: Map<string, number> = new Map<string, number>(); //

    constructor(container: HTMLDivElement, width: number, height: number) {
        this.cvs = new Konva.Stage({
            container: container,   // id of container <div>
            width: width,
            height: height,
        } as Konva.StageConfig);
        this.ctx = new Konva.Layer();
        this.cvs.add(this.ctx);

        this.defaultLayer = this.addLayer();
        this.id2zIndex.set(this.defaultLayer, 0);
    }

    private addLayer() {
        const newID = uuidv4() as string;
        let newLayer = new Layer(newID, `Layer ${this.layerList.size + 1}`)
        this.layerList.set(newID, newLayer);
        this.ctx.add(newLayer.prev);
        this.ctx.add(newLayer.render);
        return newID;
    }

    public addLayerAfter() {
        const id = this.addLayer();
        const currentLayerZIndex = this.id2zIndex.get(this.defaultLayer);
        if (currentLayerZIndex === undefined) throw new Error("INTERNAL_ERROR: ZIndex of layer is missing.");
        // Update zIndex
        this.id2zIndex.forEach((zIndex: number, layer_id: string) => {
            if (zIndex >= currentLayerZIndex)
                this.id2zIndex.set(layer_id, zIndex + 1);
        });
        this.id2zIndex.set(id, currentLayerZIndex);
        this.layerList.forEach((layer: Layer, layer_id: string) => {
            let newZIndex = this.id2zIndex.get(layer_id);
            if (newZIndex === undefined) throw new Error("INTERNAL_ERROR: ZIndex of layer is missing.");
            layer.zIndex = newZIndex;
        })
        this.defaultLayer = id;
        return id;
    }

    public changeTo(id: string) {
        if (!this.layerList.has(id))
            throw new Error(`Layer ${id} not exist`);
        this.defaultLayer = id;
        window.editorUI.forceRerender()
        // editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "LayerMgrSidebar", new_func: null }));
    }

    public get Canvas(): Konva.Stage {
        return this.cvs;
    }

    public get Layer(): Layer {
        let id = this.defaultLayer;
        if (!this.layerList.has(id))
            throw new Error(`Layer ${id} not exist`);
        return this.layerList.get(id) as Layer;
    }

    public get LayerList(): LayerInfo[] {
        let rtv: LayerInfo[] = [];
        this.layerList.forEach(layer => rtv.push({
            Snapshot: layer.Preview,
            Name: layer.Name,
            ID: layer.ID,
        }));
        return rtv;
    }

    public clear(): void {
        // let origSz = this.layerList.size;
        console.log("[EUI] Layer clear");
        this.layerList.forEach(layer => layer.clear());
        // if(origSz > 0)
        //     editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "LayerMgrSidebar", new_func: null }));
    };

    public resize(width: number, height: number): void {
        this.cvs.width(width);
        this.cvs.height(height);
    }
    //TODO : Move this outside of LayerManager
    public viewAt(center: Point, rotDeg: number, scale: number) {
        const cvsW = this.ctx.width()
        const cvsH = this.ctx.height()
        this.ctx.offset(center);
        this.ctx.position({ x: cvsW / 2, y: cvsH / 2 });
        this.ctx.scale({ x: scale, y: scale });
        this.ctx.rotation(rotDeg);
    }
};

export class Layer {
    private _render: Konva.Group;
    private _prev: Konva.Group;

    private _id: string;
    private _name: string;
    constructor(id: string, name: string) {
        this._id = id;
        this._name = name;
        this._render = new Konva.Group({
            name: `render_${id}`,
        } as GroupConfig);
        this._prev = new Konva.Group({
            name: `prev_${id}`,
        } as GroupConfig);

    }
    public get ID() {
        return this._id;
    }
    public get Name() {
        return this._name;
    }

    public get zIndex() {
        return (this._render.zIndex as unknown as number) / 2;
    }
    public set zIndex(zIndex: number) {
        this._render.setZIndex(zIndex * 2);
        this._prev.setZIndex(zIndex * 2 + 1);
    };

    public content() {
        return this._render.children;
    }
    public merge(layer: Layer) {
        // this._isPreview = false;
        layer.content().forEach((item) => {
            this._render.add(item);
        })
    }
    private _previewImage: string = "";
    // private _isPreview: boolean = false;
    public get Preview() {
        this._previewImage = this._render.toDataURL();
        // TODO : Add code to rerender the preview after redo/undo
        // if(!this._isPreview)
        // {
        //     this._previewImage = this._render.toDataURL();
        //     this._isPreview = true;
        // }
        return this._previewImage;
    }
    public diff(): HistoryLogEntry<any>[] {
        let rtv: HistoryLogEntry<any>[] = [];

        this._prev.children.forEach((item) => {
            const newLog: HistoryLogEntry<any> = {
                layerID: this._id,
                paintToolName: item.className,
                shapeName: item.name(),
                data: item.attrs
            }
            console.log("[DEB] Diff : ", newLog);
            rtv.push(newLog);
        })

        return rtv;
    }
    public flush() {
        // this._isPreview = false;
        // TODO: Create transaction
        this._prev.children.forEach((item, iIdx) => {
            console.log("[DEB] Preview.item", iIdx, item instanceof Konva.Path, item)
            // Save to internalData
            if (item instanceof Konva.Circle) {
                addShape(0, this.ID, "circle", { "radius": item.radius, "center": { "x": item.x, "y": item.y } })
            }
            else if (item instanceof Konva.Line) {
                addShape(0, this.ID, "line", { "points": item.points })
            }
            else if (item instanceof Konva.Path) {
                addShape(0, this.ID, "path", { "path": item.data })
            }
            else {
                console.error("Unsupported type :", typeof item)
            }
            this._render.add(item);
        })
        this._prev.destroyChildren();
        // editorUIData.dispatch(editorUIActions.sidebar_window.update({ id: "LayerMgrSidebar", new_func: null }));
    }
    public add(item: any) {
        // this._isPreview = false;
        this._render.add(item);
    }
    public clear() {
        this._prev.destroyChildren();
        this._render.destroyChildren();
        // this._isPreview = false;
    }

    public get render() {
        return this._render;
    }
    public get prev() {
        return this._prev;
    }
};


class LayerMgrSidebar implements SidebarInterface {
    constructor(visible = false) {
        this.Visible = visible;
    }
    Name = "LayerMgrSidebar";
    ImgName = "layer";
    Tip = "Layer Manager";
    Visible = false;
    Title = () => "Layer";
    Body = () => {
        if (this.Visible) {
            // let pointsList = (cvs as LabelCanvas).AllNodes;
            let layersList = useConsumer("editor.layer.info.list") as LayerInfo[];
            console.log("[EUI] LayerMgrSidebar : ", layersList);
            const createList = (classNames: string, idx: number, layer: LayerInfo) => {
                // let btnEdit = HBUTTON("edit_btn mt-20px px-0", "..", (e: MouseEvent) => {
                //     (window.editorUIng.CenterCanvas as EditorCanvas).LayerManager.changeTo(layer.ID);
                // });
                let toImage = (img: string) => {
                    return <Img $style={{ maxWidth: `96px`, maxHeight: `54px` }} src={img} />
                    // TODO: set width and height from canvas size programmatically
                }

                return <Tr className={classNames}
                    onclick={
                        (_e: MouseEvent) => {
                            (window.editorUI.CenterCanvas as EditorCanvas).LayerManager.changeTo(layer.ID);
                        }
                    }
                >
                    <Td>{`${idx}`.padStart(6)}</Td>
                    <Td>{toImage(layer.Snapshot)}</Td>
                    <Td>{layer.Name}</Td>
                </Tr>
            }
            let editedLayer = (window.editorUI.CenterCanvas as EditorCanvas).LayerManager.Layer.ID;
            let newTableBody = layersList.map((layer: LayerInfo, idx: number) => {
                if (layer.ID === editedLayer) {
                    return createList("edited-layer", idx, layer);
                }
                else {
                    return createList("normal-layer", idx, layer);
                }
            })

            return <Table className="w-full b-none align-right">
                <Tr className="layers-header">
                    <Td>Index</Td>
                    <Td>Preview</Td>
                    <Td>Name</Td>
                </Tr>
                {newTableBody}
            </Table>
        }
        return <Div />;
    };
}

export default LayerMgrSidebar;