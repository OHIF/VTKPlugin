import { loadImageDataProgressively } from './data/loadImageDataProgressively.js';

export function loadImageData(imageDataObject,callbacks) {
    loadImageDataProgressively(imageDataObject.imageIds, imageDataObject.vtkImageData, imageDataObject.metaDataMap, imageDataObject.zAxis,callbacks);
}