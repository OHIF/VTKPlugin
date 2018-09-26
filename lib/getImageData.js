import { buildMetadata } from './data/buildMetadata.js';
import { determineOrientation } from './data/determineOrientation.js';
import { computeZAxis } from './data/computeZAxis.js';

export function getImageData(displaySet) {
    const { displaySetInstanceUid } = displaySet;
    const { imageDataCache } = OHIF.plugins.VTKDataCache;
    const cachedImageDataObject = imageDataCache.get(displaySetInstanceUid);
    if (cachedImageDataObject) {
        cachedImageDataObject.loaded = true;
        return cachedImageDataObject;
    }

    const { metaData0, metaDataMap, imageIds,imageMetaData0 } = buildMetadata(displaySet);
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

    console.log(imageMetaData0.bitsStored);
    console.log(imageMetaData0.hightBit);
    let pixelArray;
    const signed = imageMetaData0.pixelRepresentation === 1;

    const multiComponent = metaData0.numberOfComponents > 1;

    //TODO perhaps allow the plugin to reject data gracefully and report to the user.
    if (multiComponent){
        console.log("Multi component image not supported by this plugin.");
    }
        throw new Error("Multi component image not supported by this plugin.");

    switch(imageMetaData0.bitsAllocated){
        case 8:
            debugger;
            if (signed){
                console.log("8 Bit signed image not supported by this plugin.");
                throw new Error("8 Bit signed image not supported by this plugin.");
            }else{
                //pixelArray = new Uint8Array(xVoxels * yVoxels * zVoxels);
                console.log("8 Bit unsigned signed image not supported by this plugin.");
                throw new Error("8 Bit unsigned image not supported by this plugin.");
            }
            break;
        case 16:
            if (signed){
                pixelArray = new Int16Array(xVoxels * yVoxels * zVoxels);
            } else {
                pixelArray = new Uint16Array(xVoxels * yVoxels * zVoxels);
            }
            break;
    }
    // TODO: Support numberOfComponents = 3 for RGB?
    const scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
        name: "Pixels",
        numberOfComponents: 1,
        values: pixelArray,
    });

    const imageData = vtk.Common.DataModel.vtkImageData.newInstance();

    imageData.setDimensions([xVoxels, yVoxels, zVoxels]);
    imageData.setSpacing([xSpacing, ySpacing, zSpacing]);
    imageData.getPointData().setScalars(scalarArray);

    const imageDataObject = {
        imageIds,
        metaData0,
        dimensions: [xVoxels, yVoxels, zVoxels],
        spacing: [xSpacing, ySpacing, zSpacing],
        orientation,
        vtkImageData: imageData,
        metaDataMap: metaDataMap,
        zAxis: zAxis,
    };

    imageDataCache.set(displaySetInstanceUid, imageDataObject);
    
    imageDataObject.loaded = false;
    return imageDataObject;
}
