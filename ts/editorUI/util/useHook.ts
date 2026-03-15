import { type DataBinderType, type StateType, editorUIActions, editorUIData } from "../data"

export const useConsumer = (namespace: string) => {
    console.log("[EUI] useConsumer", namespace, editorUIData.getState().binder.data[namespace])
    return editorUIData.getState().binder.data[namespace].val
}

export type setValueFunctionType = (value: StateType) => void;
export const useProvider = (namespace: string, initData: StateType) => {
    editorUIData.dispatch(editorUIActions.binder.useData({ key: namespace, val: initData } as DataBinderType))
    let val = editorUIData.getState().binder.data[namespace];
    return [
        val,
        (newData: StateType) => editorUIData.dispatch(editorUIActions.binder.setData({ key: namespace, val: newData } as DataBinderType))
    ] as [StateType, setValueFunctionType]
}

export const useState: (arg0: StateType) => [StateType, (arg0: StateType) => void] = (initState: StateType) => {
    editorUIData.dispatch(editorUIActions.state.useState(initState))
    let id = editorUIData.getState().state.data.length - 1;
    let val = editorUIData.getState().state.data[id];
    return [
        val,
        (newState: StateType) => editorUIData.dispatch(editorUIActions.state.setState({ id: id, val: newState }))
    ] as [StateType, setValueFunctionType]
}

export const useLocation: () => [Location, (arg0: string) => void] = () => {
    return [window.location, (newLoc: string) => {
        console.log("[HOK] Location", newLoc);
        window.location.href = newLoc;
    }]
}