import type Snabbdom from '@herp-inc/snabbdom-jsx';
import { type VNode } from "snabbdom";
import { type CanvasInterfaceSettings, type CanvasSettingEntry, CanvasSettingType } from "../editorUI/canvas";
import type SidebarInterface from "../editorUI/interface/sidebar";
import { Div, Input, Label, Span, Table, Td, Tr } from "../editorUI/util/Element";
import { EditorCanvas } from "./canvas";

export type HorizonRangerPropType = {
    min: number;
    max: number;
    defValue: number;
    changeHandler: any;
}
const HorizonRanger: Snabbdom.Component<HorizonRangerPropType> = (props: HorizonRangerPropType) => {
    return <Div className="w-full flex flex-row">
        <Input type="range" min={props.min} max={props.max} value={props.defValue.toString()} onchange={props.changeHandler} />
    </Div>
}

export type ToggleSwitchPropType = {
    value: boolean;
    changeHandler: any;
}
const ToggleSwitch: Snabbdom.Component<ToggleSwitchPropType> = (props: ToggleSwitchPropType) => {
    return <Label className="switch">
        <Input type="checkbox" checked={props.value} onchange={props.changeHandler} />
        <Span className="slider"></Span>
    </Label>
};

class SettingPageSidebar implements SidebarInterface {
    Name: string = "SettingsPage"; // Tips of ToolButton
    ImgName?: string = "property";
    Tip?: string = "Settings"; // Tip showed on StatusBar
    HistoryName?: string; // Undefined if don't want to store in redo/undo history
    Visible: boolean = false;
    Title: () => string = () => {
        let name = (window.editorUI.CenterCanvas as EditorCanvas).settings.Name;
        if (name === undefined) return 'Settings';
        return `Settings of ${name}`;
    };
    Body: () => VNode = () => {
        let setting = (window.editorUI.CenterCanvas as EditorCanvas).settings;
        console.log(`[DEB] Setting of ${setting.Name}`, setting.Settings);
        if (setting.Name === undefined || setting.Settings == undefined)
            return <Div className="w-full">
                Empty Setting Page
            </Div>
        let settingList: VNode[] = [];
        setting.Settings.forEach((setting, settingName: string) => {
            switch (setting.type) {
                case CanvasSettingType.Number:
                    if (setting.info === undefined || (setting.info as number[]).length !== 2) throw new Error("INTERNAL_ERROR: Setting info has wrong type");
                    settingList.push(
                        <Tr className="w-full">
                            <Td>{setting.label}</Td>
                            <Td>
                                <HorizonRanger
                                    min={setting.info[0]}
                                    max={setting.info[1]}
                                    defValue={setting.value}
                                    changeHandler={(ev: Event) => {
                                        let newSet: CanvasInterfaceSettings = {
                                            Settings: new Map<string, CanvasSettingEntry<any>>([
                                                [settingName, {
                                                    type: setting.type,
                                                    label: setting.label,
                                                    info: setting.info,
                                                    value: parseInt((ev.target as HTMLInputElement).value)
                                                }]
                                            ])
                                        };
                                        (window.editorUI.CenterCanvas as EditorCanvas).settings = newSet;
                                    }
                                    } />
                            </Td>
                        </Tr>
                    );
                    break;
                case CanvasSettingType.Color:
                    settingList.push(
                        <Tr className="w-full">
                            <Td>{setting.label}</Td>
                            <Td>
                                <Input
                                    type="color"
                                    value={setting.value}
                                    onchange={
                                        (ev: Event) => {
                                            let newSet: CanvasInterfaceSettings = {
                                                Settings: new Map<string, CanvasSettingEntry<any>>([
                                                    [settingName, {
                                                        type: setting.type,
                                                        label: setting.label,
                                                        info: setting.info,
                                                        value: (ev.target as HTMLInputElement).value
                                                    }]
                                                ])
                                            };
                                            (window.editorUI.CenterCanvas as EditorCanvas).settings = newSet;
                                        }
                                    }
                                />
                            </Td>
                        </Tr>
                    );
                    break;
                case CanvasSettingType.Boolean:
                    settingList.push(
                        <Tr className="w-full">
                            <Td>{setting.label}</Td>
                            <Td>
                                <ToggleSwitch
                                    value={setting.value}
                                    changeHandler={
                                        (ev: Event) => {
                                            console.log("[DEB] Boolean : ", (ev.target as HTMLInputElement).value)
                                            let newSet: CanvasInterfaceSettings = {
                                                Settings: new Map<string, CanvasSettingEntry<any>>([
                                                    [settingName, {
                                                        type: setting.type,
                                                        label: setting.label,
                                                        info: setting.info,
                                                        value: (ev.target as HTMLInputElement).checked
                                                    }]
                                                ])
                                            };
                                            (window.editorUI.CenterCanvas as EditorCanvas).settings = newSet;
                                        }
                                    }
                                />
                            </Td>
                        </Tr>
                    );
                    break;
                default:
                    settingList.push(<Div className="w-full">`Unsupported Setting Type ${setting.type}`</Div>);
                    break;
            }
        })

        return <Table className="w-full b-none align-right">
            <Tr className="layers-header">
                <Td>Property</Td>
                <Td>Value</Td>
            </Tr>
            {settingList}
        </Table>
    };
}
export default SettingPageSidebar;