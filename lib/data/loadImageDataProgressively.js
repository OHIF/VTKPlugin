import { getSliceIndex } from "./getSliceIndex.js";
import { insertSlice } from "./insertSlice.js";
import { throttle } from "../throttle.js";

export function loadImageDataProgressively(imageIds, imageData, metaDataMap, zAxis,callbacks) {
    const loadImagePromises = imageIds.map(imageId => cornerstone.loadAndCacheImage(imageId));
    const throttledImageModified = throttle(() => {
        imageData.modified();
    }, 100);

    loadImagePromises.forEach(promise => {
        promise.then((image) => {
            const imageMetaData = metaDataMap.get(image.imageId);
            const sliceIndex = getSliceIndex(zAxis, imageMetaData.imagePositionPatient);
            const pixels = image.getPixelData();

            insertSlice(imageData, pixels, sliceIndex);
            imageData.getPointData().getScalars().modified();
            throttledImageModified();
            for (let val of callbacks.values()) {
                val.func(val.view);
            }


        }).catch(error => {
            throw new Error(error);
        });
    });

    Promise.all(loadImagePromises).then(() => {
        imageData.modified();
        for (var val of callbacks.values()) {
            console.log(val);
            val.func(val.view);
        }
    });
}
