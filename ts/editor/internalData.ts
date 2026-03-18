/**
 * Created : 2026/03/18
 * Author  : Ting Fang, Tsai
 * About:
 *  Internal Data storage in IndexedDB     
 */


export const initIDB = () => {
    let request = indexedDB.open("my-little-paint-tmp-db");
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log("onupgradeneeded", db);

        // Last Modified
        // {time: TIME}
        let imageOS = db.createObjectStore("image", { keyPath: 'id', autoIncrement: true })
        const time = new Date().toISOString()
        imageOS.add({ "created": time, "modified": time });

        // Layer Data
        // {imageID: string, order: int}
        db.createObjectStore("layer", { keyPath: 'id', autoIncrement: true })

        // Canvas Shape Data
        // {layerID: string, type: SHAPE_TYPE(string), data: JSONObject }
        db.createObjectStore("shape", { keyPath: 'id', autoIncrement: true })
    }
}

export const addLayer = (imgID: number, layerID: string, order: number) => {

}

export const addShape = (imgID: number, layerID: string, shape_type: string, data: any) => {

}

export const updateModifiedTime = (imgID: number) => {

}