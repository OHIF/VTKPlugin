const { ViewportPlugin } = OHIF.plugins;

class VolumeRenderingPlugin extends ViewportPlugin {
    constructor(options = {}) {
        super("VolumeRenderingPlugin");

        this.description = "VolumeRendering OHIF Plugin";

        OHIF.plugins.VTKDataCache = OHIF.plugins.VTKDataCache || {};
        OHIF.plugins.VTKDataCache.imageDataCache = new Map;
    }

    static setupVTKActor(imageData) {
        const mapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
        mapper.setInputData(imageData);

        const actor = vtk.Rendering.Core.vtkVolume.newInstance();
        actor.setMapper(mapper);

        // create color and opacity transfer functions
        const ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();

        ctfun.addRGBPoint(10.0, 0.4, 0.2, 0.0);
        ctfun.addRGBPoint(100.0, 1.0, 1.0, 1.0);

        const ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
        ofun.addPoint(0.0, 0.0);
        ofun.addPoint(200.0, 0.9);
        ofun.addPoint(1000.0, 0.9);

        actor.getProperty().setRGBTransferFunction(0, ctfun);
        actor.getProperty().setScalarOpacity(0, ofun);
        actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
        actor.getProperty().setInterpolationTypeToLinear();
        actor.getProperty().setUseGradientOpacity(0, true);
        actor.getProperty().setGradientOpacityMinimumValue(0, 15);
        actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
        actor.getProperty().setGradientOpacityMaximumValue(0, 100);
        actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
        //actor.getProperty().setShade(true);
        actor.getProperty().setAmbient(0.7);
        actor.getProperty().setDiffuse(0.7);
        actor.getProperty().setSpecular(0.3);
        actor.getProperty().setSpecularPower(8.0);

        return actor;
    }

    setup() {
        console.warn(`${this.name}: Setup Complete`);
    }

    setupViewport(div, { viewportIndex = 0 }, displaySet) {
        console.warn(`${this.name}|setupViewport: viewportIndex: ${viewportIndex}`);

        if (!displaySet) {
            displaySet = ViewportPlugin.getDisplaySet(viewportIndex);
        }

        // TODO: Decouple the data loading from the scene installation and updating
        VolumeRenderingPlugin.createVTKScene(div, displaySet);
    }

    static buildMetadata(displaySet) {
        // Retrieve the Cornerstone imageIds from the display set
        // TODO: In future, we want to get the metadata independently from Cornerstone
        const imageIds = displaySet.images.map(image => image.getImageId());

        // Compute the image size and spacing given the meta data we already have available.
        const metaDataMap = new Map;
        imageIds.forEach(imageId => {
            // TODO: Retrieve this from somewhere other than Cornerstone
            const metaData = cornerstone.metaData.get('imagePlane', imageId);
            metaDataMap.set(imageId, metaData);
        })

        return {
            metaData0: metaDataMap.values().next().value,
            metaDataMap,
            imageIds
        }
    }

    static createVTKScene(container, displaySet) {
        console.warn(`${this.name}|createVTKScene`);

        container.innerHTML = '';

        const volumeViewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });

        volumeViewer.setContainer(container);

        // TODO: VTK's canvas currently does not fill the viewport element
        // after it has been resized. We need to set the height to 100% and
        // trigger volumeViewer.resize() whenever things are resized.
        // We might need to find a way to hook onto the OHIF Viewer ResizeManager
        // container.querySelector('canvas').style.height = '100%';

        volumeViewer.resize();

        const { displaySetInstanceUid } = displaySet;
        const { imageDataCache } = OHIF.plugins.VTKDataCache;
        const cachedImageData = imageDataCache.get(displaySetInstanceUid);

        let actor;

        if (cachedImageData) {
            actor = VolumeRenderingPlugin.setupVTKActor(cachedImageData);

            return VolumeRenderingPlugin.installVTKVolumeRenderer(volumeViewer, actor);
        }

        const { metaData0, metaDataMap, imageIds } = VolumeRenderingPlugin.buildMetadata(displaySet);
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

        actor = VolumeRenderingPlugin.setupVTKActor(imageData);

        VolumeRenderingPlugin.installVTKVolumeRenderer(volumeViewer, actor);

        // Q up the promises.
        const loadImagePromises = imageIds.map(imageId => cornerstone.loadAndCacheImage(imageId));
        const throttledImageModified = throttle(() => {
            imageData.modified();
        }, 5000);

        loadImagePromises.forEach(promise => {
            promise.then((image) => {
                const imageMetaData = metaDataMap.get(image.imageId);
                const sliceIndex = getSliceIndex(zAxis, imageMetaData.imagePositionPatient);
                const pixels = image.getPixelData();

                VolumeRenderingPlugin.insertSlice(imageData, pixels, sliceIndex);

                throttledImageModified();
            }).catch(error => {
                throw new Error(error);
            });
        });

        Promise.all(loadImagePromises).then(() => {
            imageData.modified();
        });
    }

    static logMemoryUsage() {
        if (!window.performance || !window.performance.memory) {
            return;
        }

        const memory = window.performance.memory;
        const kb = 1024;
        const mb = kb * kb;

        console.log("total %d KB %d MB", memory.totalJSHeapSize / kb, memory.totalJSHeapSize / mb );
        console.log("used %d KB %d MB", memory.usedJSHeapSize / kb, memory.usedJSHeapSize / mb );
        console.log("limit %d KB %d MB" , memory.jsHeapSizeLimit  / kb, memory.jsHeapSizeLimit / mb );
    }

    // Based on vtkImageData.cxx (vtkDataset)
    static computeIndex(extent, incs, xyz) {
        return ((((xyz[0] - extent[0]) * incs[0]) +
                 ((xyz[1] - extent[2]) * incs[1]) +
                 ((xyz[2] - extent[4]) * incs[2])) | 0);
    }

    // Based on vtkImageData.cxx (vtkDataset)
    static computeImageDataIncrements(imageData, numberOfComponents) {
        const datasetDefinition = imageData.get('extent', 'spacing', 'origin');
        const inc = [0,0,0];
        let incr = numberOfComponents;

        for (let idx = 0; idx < 3; ++idx) {
            inc[idx] = incr;
            incr *= (datasetDefinition.extent[idx*2+1] - datasetDefinition.extent[idx*2] + 1);
        }

        return inc;
    }

    // insert the slice at the z index location.
    static insertSlice(imageData, pixels, index){
        const datasetDefinition = imageData.get('extent', 'spacing', 'origin');
        const scalars = imageData.getPointData().getScalars();
        const increments = VolumeRenderingPlugin.computeImageDataIncrements(imageData, 1); // TODO number of components.
        const scalarData = scalars.getData();
        const indexXYZ = [0, 0, index];
        let pixelIndex = 0;

        for (let row = 0; row <= datasetDefinition.extent[3]; row++) {
            indexXYZ[1] = row;
            for (let col = 0; col <= datasetDefinition.extent[1]; col++) {
                indexXYZ[0] = col;

                const destIdx = VolumeRenderingPlugin.computeIndex(datasetDefinition.extent, increments, indexXYZ);
                scalarData[destIdx] = pixels[pixelIndex++];
            }
        }
    }

    // install the volume renderer into the web page.
    // you should only do this once.
    static installVTKVolumeRenderer(volumeViewer, actor) {
        const renderer = volumeViewer.getRenderer();
        const renderWindow = volumeViewer.getRenderWindow();

        renderer.addVolume(actor);
        renderer.resetCamera();
        renderer.updateLightsGeometryToFollowCamera();

        renderWindow.render();
    }
};


OHIF.plugins.entryPoints["VolumeRenderingPlugin"] = function () {
    console.warn('VolumeRendering entryPoint');

    const volumeRenderingPlugin = new VolumeRenderingPlugin();
    volumeRenderingPlugin.setup();

    OHIF.plugins.VolumeRenderingPlugin = volumeRenderingPlugin;
};

