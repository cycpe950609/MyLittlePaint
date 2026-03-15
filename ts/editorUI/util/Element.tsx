import type Snabbdom from '@herp-inc/snabbdom-jsx';
import { type JSX } from '@herp-inc/snabbdom-jsx/jsx-runtime';

export type DivPropsType = Omit<JSX.IntrinsicElements["div"], 'id'> & { Id?: string };
export const Div: Snabbdom.Component<DivPropsType> = (props) => {
    return <div {...props} id={(props.Id != undefined ? props.Id : "div_cnt") as any}>{props.children}</div>
};

export type InputPropsType = Omit<JSX.IntrinsicElements["input"], 'id'> & { Id?: string };
export const Input: Snabbdom.Component<InputPropsType> = (props) => {
    return <input {...props} id={props.Id != undefined ? props.Id : "inp_cnt" as any}>{props.children}</input>
};

export type LabelPropsType = Omit<JSX.IntrinsicElements["label"], 'id'> & { Id?: string };
export const Label: Snabbdom.Component<LabelPropsType> = (props) => {
    return <label {...props} id={props.Id != undefined ? props.Id : "lbl_cnt" as any}>{props.children}</label>
};

export type SpanPropsType = Omit<JSX.IntrinsicElements["span"], 'id'> & { Id?: string };
export const Span: Snabbdom.Component<SpanPropsType> = (props) => {
    return <span {...props} id={props.Id != undefined ? props.Id : "sp_cnt" as any}>{props.children}</span>
};

export type TablePropsType = Omit<JSX.IntrinsicElements["table"], 'id'> & { Id?: string };
export const Table: Snabbdom.Component<TablePropsType> = (props) => {
    return <table {...props} id={props.Id != undefined ? props.Id : "tbl_cnt" as any}>{props.children}</table>
};

export type TrPropsType = Omit<JSX.IntrinsicElements["tr"], 'id'> & { Id?: string };
export const Tr: Snabbdom.Component<TrPropsType> = (props) => {
    return <tr {...props} id={props.Id != undefined ? props.Id : "tr_cnt" as any}>{props.children}</tr>
};

export type TdPropsType = Omit<JSX.IntrinsicElements["td"], 'id'> & { Id?: string };
export const Td: Snabbdom.Component<TdPropsType> = (props) => {
    return <td {...props} id={props.Id != undefined ? props.Id : "td_cnt" as any}>{props.children}</td>
};

export type ImgPropsType = Omit<JSX.IntrinsicElements["img"], 'id'> & { Id?: string };
export const Img: Snabbdom.Component<ImgPropsType> = (props) => {
    return <img {...props} id={props.Id != undefined ? props.Id : "img_cnt" as any}>{props.children}</img>
};

export type CanvasPropsType = Omit<JSX.IntrinsicElements["canvas"], 'id'> & { Id?: string };
export const Canvas: Snabbdom.Component<CanvasPropsType> = (props) => {
    return <canvas {...props} id={props.Id != undefined ? props.Id : "cvs_cnt" as any}>{props.children}</canvas>
};