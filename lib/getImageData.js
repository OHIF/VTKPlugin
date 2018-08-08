import { buildMetadata } from './buildMetadata.js';
import { loadImageDataProgressively } from './loadImageDataProgressively.js';
import { determineOrientation } from './determineOrientation.js';
import { computeZAxis } from './computeZAxis.js';

export function getImageData(displaySet) {
    const { displaySetInstanceUid } = displaySet;
    const { imageDataCache } = OHIF.plugins.VTKDataCache;
    const cachedImageData = imageDataCache.get(displaySetInstanceUid);

    if (cachedImageData) {
        return cachedImageData;
    }

    const { metaData0, metaDataMap, imageIds } = buildMetadata(displaySet);
    const {rowCosines, columnCosines} = metaData0;
    const crossProduct = columnCosines.crossVectors(columnCosines, rowCosines);
    const orientation = determineOrientation(crossProduct);
    const zAxis = computeZAxis(orientation, metaDataMap);
    const xSpacing = metaData0.columnPixelSpacing;
    const ySpacing = metaData0.rowPixelSpacing;
    const zSpacing = zAxis.spacing;
    const xVoxels = metaData0.columns;
    const yVoxels = metaData0.rows;
    const zVoxels = metaDataMap.size;

    // TODO: Support all data types (UInt8Array, etc...)
    const pixelArray = new Int16Array(xVoxels * yVoxels * zVoxels);
    const scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
        name: "Pixels",
        numberOfComponents: metaData0.SamplesPerPixel,
        values: pixelArray,
    });

    const imageData = vtk.Common.DataModel.vtkImageData.newInstance();

    imageData.setDimensions([xVoxels, yVoxels, zVoxels]);
    imageData.setSpacing([xSpacing, ySpacing, zSpacing]);
    imageData.getPointData().setScalars(scalarArray);

    imageDataCache.set(displaySetInstanceUid, imageData);
    loadImageDataProgressively(imageIds, imageData, metaDataMap, zAxis);

    return imageData;
}
