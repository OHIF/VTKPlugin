import { getSliceIndex } from "./getSliceIndex.js";
import { insertSlice } from "./insertSlice.js";
import { throttle } from "../throttle.js";

export function loadImageDataProgressively(imageIds, imageData, metaDataMap, zAxis) {
    const loadImagePromises = imageIds.map(imageId => cornerstone.loadAndCacheImage(imageId));
    const throttledImageModified = throttle(() => {
        imageData.modified();
    }, 5000);

    loadImagePromises.forEach(promise => {
        promise.then((image) => {
            const imageMetaData = metaDataMap.get(image.imageId);
            const sliceIndex = getSliceIndex(zAxis, imageMetaData.imagePositionPatient);
            const pixels = image.getPixelData();

            insertSlice(imageData, pixels, sliceIndex);

            throttledImageModified();
        }).catch(error => {
            throw new Error(error);
        });
    });

    Promise.all(loadImagePromises).then(() => {
        imageData.modified();
    });
}
