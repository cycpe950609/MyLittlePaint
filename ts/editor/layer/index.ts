/**
 * Created : 2026/04/01
 * Author  : Ting Fang, Tsai
 * About:
 *     Export Layers in namespace `Layer`      
 */

import { BackgroundLayer } from "./background/background";
import { InteractViewLayer } from "./interact/interact";
import { RenderLayer } from "./render/layer";


export const Layer = {
    Background: BackgroundLayer,
    Interact: InteractViewLayer,
    Render: RenderLayer,
}

export namespace Layer {
    export type Background = BackgroundLayer;
    export type Interact = InteractViewLayer;
    export type Render = RenderLayer;
}

export default Layer;