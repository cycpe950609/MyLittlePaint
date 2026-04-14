
export type PaintEvent = {
    X: number;
    Y: number;
    type: "touch" | "mouse" | "pen";
    pressure: number;
    rotDegree: number;
}

export enum CanvasSettingType {
    Number,
    Color,
    Boolean,
    DropDownList,
}
export type CanvasSettingEntry<DATATYPE> = {
    type: CanvasSettingType;
    label: string;
    info?: any; // Information of the setting, e.g. value range
    value: DATATYPE;
}
export type CanvasInterfaceSettings = {
    Name?: string;
    ImgName?: string;
    Settings?: Map<string, CanvasSettingEntry<any>>;
};

export interface CanvasBase {
    name: string;
    attach: (container: HTMLDivElement) => void;
    resize: (e?: UIEvent) => void;
    detach: () => void;
    render: () => void;
}

export class NoOPCanvas implements CanvasBase {
    update?: ((time: number) => void) | undefined;
    name = "NoOPCanvas";
    attach(_container: HTMLDivElement) { }
    resize(_e?: UIEvent) { }
    detach() { }
    render() { }
}
