/**
 * Created : 2026/03/27
 * Author  : Ting Fang, Tsai
 * About:
 *  TextShape     
 */

import { ObjectRender } from "../../layer/render/render";
import { ObjectBase, type ObjectBaseConfig } from "../../state/canvas/data/object";


export interface TextConfig extends ObjectBaseConfig {
    content: string;
}
export class TextShape extends ObjectBase<TextConfig> {
    protected valid_and_init_config(config: TextConfig): Required<TextConfig> {
        if (!config.content) {
            throw new Error('Text content must not be empty');
        }
        return {
            ...super.valid_and_init_config(config),
            content: config.content,
        } as Required<TextConfig>;
    }
}

export class TextRender extends ObjectRender<TextShape> {
    render(_ctx: OffscreenCanvasRenderingContext2D, _data: TextShape): void {
        throw new Error('TextShape render not implemented');
    }
}
