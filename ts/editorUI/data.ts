import {
    type CaseReducerActions,
    type PayloadAction,
    type SliceCaseReducers,
    configureStore,
    createSlice,
} from "@reduxjs/toolkit";
import type FunctionInterface from "./interface/function";
import type SidebarInterface from "./interface/sidebar";
import type ModeFunction from "./interface/mode";

export type ModeInfo = {
    modeName: string,
    enable: boolean,
    def: ModeFunction,
    btn?: HTMLElement
}

export type StateType = string | number | boolean | null | undefined |
    Array<string | number | boolean | null | undefined> |
    any
    ;
let stateManagerSlice = createSlice({
    name: "stateManager",
    initialState: {
        action: "state.init",
        useStateCount: 0,
        firstInit: true,
        data: [] as Array<StateType>,
    },
    reducers: {
        useState: (state, action: PayloadAction<StateType>) => {
            // if(state.useStateCount === state.data.length && state.firstInit === false)
            //     throw new Error("Called useState is different than last time. It may have some useState in loop");
            if (state.useStateCount === state.data.length && state.firstInit) { // First called useState
                // console.log("[STA] useState", state);
                state.data = [...state.data, action.payload]
            }
            state.action = "state.useState";
            state.useStateCount += 1
            return state;
        },
        // resetCount : (state, action: PayloadAction) => { 
        //     // if(state.useStateCount !== state.data.length)
        //     //     throw new Error("RESET: Called useState is different than last time. It may have some useState in loop");
        //     state.firstInit = false;
        //     state.action = "state.resetCount";
        //     state.useStateCount = 0;
        //     return state;
        // },
        setState: (state, action: PayloadAction<{ id: number, val: StateType }>) => {
            if (action.payload.id >= state.data.length) {
                console.log("[HOK] setState", action.payload.id, state.data.length)
                throw new Error("INTERNAL ERROR : id of setState is out of bound");
            }
            console.log("[HOK] setState", action.payload.id, action.payload.val)
            state.data[action.payload.id] = action.payload.val;
            state.action = "state.setState";
            return state;
        },
    }
})


export type DataBinderType = {
    key: string,
    val: StateType,
}
export type DataBinderDataType = {
    isCreated: boolean,//Used to prevent multiple useProvider with same namespace
    val: StateType,
}
let dataBinderSlice = createSlice({
    name: "dataManager",
    initialState: {
        action: "data.init",
        useStateCount: 0,
        firstInit: true,
        data: {} as { [key: string]: DataBinderDataType },
    },
    reducers: {
        useData: (state, action: PayloadAction<DataBinderType>) => {
            // if(state.useStateCount === state.data.length && state.firstInit === false)
            //     throw new Error("Called useState is different than last time. It may have some useState in loop");
            if (action.payload.key in state.data && state.data[action.payload.key].isCreated === true)
                throw new Error("Multiple useProvider with same namespace");
            if (!(action.payload.key in state.data)) { // First called useState
                state.data[action.payload.key] = {
                    isCreated: true,
                    val: action.payload.val
                };
                console.log("[STA] useData", state.data);
            }
            if (action.payload.key in state.data) {
                state.data[action.payload.key].isCreated = true;
            }
            state.action = "data.use.data";
            return state;
        },
        setData: (state, action: PayloadAction<DataBinderType>) => {
            if (!(action.payload.key in state.data)) {
                console.log("[HOK] setData", action.payload.key, state.data)
                throw new Error("INTERNAL ERROR : key of setData is not found");
            }
            console.log("[HOK] setData", action.payload.key, action.payload.val)
            state.data[action.payload.key] = {
                ...state.data[action.payload.key],
                val: action.payload.val
            } as DataBinderDataType;
            state.action = "data.set.data";
            return state;
        },
    }
})

type ModeSliceType = {
    root: string,
    action: string,
    data: Record<string, ModeInfo>,
    curMode: string,
    lastMode: string,
}

let modeManagerSlice = createSlice({
    name: "modeManager",
    initialState: {
        root: "",
        action: "",
        data: {},
        curMode: "",
        lastMode: "",
    } as ModeSliceType,
    reducers: {
        rendered: (state, _action) => {
            state.action = "";
        },
        enable: (state, action: PayloadAction<string>) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            let modeName = action.payload
            console.log("[EUI] Tried to enable " + modeName);
            if (modeName in state.data) {
                console.log("[EUI] Enable " + modeName);
                const mode = state.data[modeName];
                if (mode === undefined) throw new Error("MODEMGR_INTERNAL_ERROR");
                mode.enable = true;
                state.action = `mode.${modeName}.enable`;
            }
            return state
        },
        disable: (state, action: PayloadAction<string>) => {
            let modeName = action.payload
            if (modeName in state.data) {
                const mode = state.data[modeName];
                if (mode === undefined) throw new Error("MODEMGR_INTERNAL_ERROR");
                mode.enable = false;
                state.action = `mode.${modeName}.disable`;
            }
            return state
        },
        toggle: (state, action: PayloadAction<string>) => {
            let modeName = action.payload
            if (modeName in state) {
                const mode = state.data[modeName];
                if (mode === undefined) throw new Error("MODEMGR_INTERNAL_ERROR");
                if (mode.enable === true) editorUIData.dispatch(editorUIActions.mode.disable(modeName));
                else editorUIData.dispatch(modeManagerSlice.actions.enable(modeName));
            }
            return state
        },
        add: (state, action: PayloadAction<ModeInfo>) => {
            const name = action.payload.modeName;
            state.data[name] = action.payload;
            state.action = `mode.${action.payload.modeName}.added`;
            return state
        },
        remove: (state, action: PayloadAction<string>) => {
            let modeName = action.payload
            if (modeName === state.root) throw new Error("MODEMGR_ERROR: root can't be delete");
            if (modeName in state) {
                delete state.data[modeName]
                state.action = `mode.${modeName}.removed`;
            }
            return state
        },
        setRoot: (state, action: PayloadAction<string>) => {
            state.root = action.payload;
            state.curMode = action.payload;
            return state
        },
        changeTo: (state, action: PayloadAction<string>) => {
            if (state.curMode === action.payload) return;
            if (!(action.payload in state.data)) return;
            state.lastMode = state.curMode;
            state.curMode = action.payload;
            state.action = `mode.changed`;
            return state;
        }
    }
});

export const {
    disable: modeDisable,
    enable: modeEnable,
    toggle: modeToggle,
    add: modeAdd,
    remove: modeRemove,
    setRoot: modeSetRoot,
    changeTo: modeChangeTo
} = modeManagerSlice.actions;

export type ToolbarStateType<ButtonInfoType> = { [key: string]: ButtonInfoType };
const createToolbarPartSlice = <ButtonInfoType>(name: string) => {
    return createSlice({
        name: name,
        initialState: {
            action: "",
            data: {} as any
        },
        reducers: {
            rendered: (state, _action) => {
                state.action = "";
            },
            updateAll: (state, action: PayloadAction<ToolbarStateType<ButtonInfoType>>) => {
                // Redux Toolkit allows us to write "mutating" logic in reducers. It
                // doesn't actually mutate the state because it uses the Immer library,
                // which detects changes to a "draft state" and produces a brand new
                // immutable state based off those changes
                state.data = action.payload;
                state.action = `${name}.all.update`;
            },
            update: (state, action: PayloadAction<{ id: string, new_func: ButtonInfoType }>) => {
                state.data[action.payload.id] = action.payload.new_func;
                state.action = `${name}.${action.payload.id}.update`;
            },
            add: (state, action: PayloadAction<{ id: string, func: ButtonInfoType }>) => {
                state.data[action.payload.id] = action.payload.func;
                state.action = `${name}.${action.payload.id}.add`;
            },
            remove: (state, action: PayloadAction<string>) => {
                if (action.payload in state) {
                    delete state.data[action.payload]
                    state.action = `${name}.${action.payload}.delete`;
                }
            },
            clear: (_state, _action: PayloadAction) => {
                return {
                    action: `${name}.clear`,
                    data: {}
                } // We need to return empty state so that redux will clear the state properly
            }
        },
    })
}

let menuLeftSlice = createToolbarPartSlice<FunctionInterface>("menubar_left");
let menuLeftPermSlice = createToolbarPartSlice<FunctionInterface>("menubar_left_perm");
let menuRightSlice = createToolbarPartSlice<FunctionInterface>("menubar_right");
let menuRightPermSlice = createToolbarPartSlice<FunctionInterface>("menubar_right_perm");

let toolTopSlice = createToolbarPartSlice<FunctionInterface>("toolbar_top");
let toolTopPermSlice = createToolbarPartSlice<FunctionInterface>("toolbar_top_perm");
let toolBottomSlice = createToolbarPartSlice<FunctionInterface>("toolbar_bottom");
let toolBottomPermSlice = createToolbarPartSlice<FunctionInterface>("toolbar_bottom_perm");

let sideTopSlice = createToolbarPartSlice<SidebarInterface>("sidebar_top");
let sideTopPermSlice = createToolbarPartSlice<SidebarInterface>("sidebar_top_perm");
let sideBottomSlice = createToolbarPartSlice<SidebarInterface>("sidebar_bottom");
let sideBottomPermSlice = createToolbarPartSlice<SidebarInterface>("sidebar_bottom_perm");

let sideWindowSlice = createToolbarPartSlice<null>("sidebar_window");

export type StatusTipInfo = {
    tip: string,
    showed: boolean,
}
export type StatusBarStateType = ToolbarStateType<StatusTipInfo>;
let statusLeftSlice = createToolbarPartSlice<StatusTipInfo>("statusbar_left");
let statusRightSlice = createToolbarPartSlice<StatusTipInfo>("statusbar_right");

export const editorUIActions = {
    mode: modeManagerSlice.actions,
    menubar_left_: menuLeftSlice.actions, // A _ after top is used to support 'perm' as POSTFIX for state list name
    menubar_left_perm: menuLeftPermSlice.actions,
    menubar_right_: menuRightSlice.actions,
    menubar_right_perm: menuRightPermSlice.actions,
    toolbar_top_: toolTopSlice.actions, // A _ after top is used to support 'perm' as POSTFIX for state list name
    toolbar_top_perm: toolTopPermSlice.actions,
    toolbar_bottom_: toolBottomSlice.actions,
    toolbar_bottom_perm: toolBottomPermSlice.actions,
    sidebar_top_: sideTopSlice.actions, // A _ after top is used to support 'perm' as POSTFIX for state list name
    sidebar_top_perm: sideTopPermSlice.actions,
    sidebar_bottom_: sideBottomSlice.actions,
    sidebar_bottom_perm: sideBottomPermSlice.actions,
    sidebar_window: sideWindowSlice.actions,
    statusbar_left_: statusLeftSlice.actions,
    statusbar_right_: statusRightSlice.actions,

    state: stateManagerSlice.actions,
    binder: dataBinderSlice.actions,
} as { [key: string]: CaseReducerActions<SliceCaseReducers<any>, string> }

export const editorUIData = configureStore({
    reducer: {
        mode: modeManagerSlice.reducer,
        menubar_left_: menuLeftSlice.reducer,
        menubar_left_perm: menuLeftPermSlice.reducer,
        menubar_right_: menuRightSlice.reducer,
        menubar_right_perm: menuRightPermSlice.reducer,
        toolbar_top_: toolTopSlice.reducer,
        toolbar_top_perm: toolTopPermSlice.reducer,
        toolbar_bottom_: toolBottomSlice.reducer,
        toolbar_bottom_perm: toolBottomPermSlice.reducer,
        sidebar_top_: sideTopSlice.reducer,
        sidebar_top_perm: sideTopPermSlice.reducer,
        sidebar_bottom_: sideBottomSlice.reducer,
        sidebar_bottom_perm: sideBottomPermSlice.reducer,
        sidebar_window: sideWindowSlice.reducer,
        statusbar_left_: statusLeftSlice.reducer,
        statusbar_right_: statusRightSlice.reducer,

        state: stateManagerSlice.reducer,
        binder: dataBinderSlice.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
    // .concat(logger)
    // .concat(createStateManagementMiddleware())
});

// export type AppDispatch = typeof editorUIDataNG.dispatch