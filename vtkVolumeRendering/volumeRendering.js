// A test of an OHIFPlugin


try {
    VolumeRenderingPlugin
} catch (error) {
    let VolumeRenderingPlugin;
}


//TODO separate file? How to do?
/*************************************************************************************************************************/

function sum(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function mean(array) {
    return sum(array) / array.length;
}

function diff(array) {
    let resultArray = [];
    for (let i = 1; i < array.length; i++) {
        resultArray.push(array[i] - array[i - 1]);
    }
    return resultArray;
}

// eps is up to you to determine based on your application.
function realsApproximatelyEqual(a,b,eps = 0.00001){
    return Math.abs(a-b) < eps;
}

function compareReals(a,b,cmp) {
    let eq = realsApproximatelyEqual(a,b);
    if (eq == true)
        return 0;

    if (a < b) {
        return -1;
    }
    return 1;
}

function bsearch(array, value, cmp){

    let low = 0;
    let high = array.length - 1;

    while(low <= high){
        let mid = low + (((high - low) / 2) | 0); // avoid overflow when low + high > max for type
        cmpResult = cmp(array[mid],value);
        if (cmpResult < 0){
            low = mid + 1;
        }
        else if (cmpResult > 0){
            high = mid - 1;
        } else {
            return mid;
        }
    }
    return undefined;
}


function copyVector(v) {
    return new cornerstoneMath.Vector3(v.x,v.y,v.z);
}



// Based on David Clunie's various postings
// on the dicom google groupd.
function determineOrientation(v) {

    let axis = undefined;
    const oX = v.x < 0 ? 'R' : 'L';
    const oY = v.y < 0 ? 'A' : 'P';
    const oZ = v.z < 0 ? 'I' : 'S';

    const aX = Math.abs(v.x);
    const aY = Math.abs(v.y);
    const aZ = Math.abs(v.z);
    const obliqueThreshold = 0.8;
    if (aX > obliqueThreshold && aX > aY && aX > aZ) {
        axis = oX;
    }
    else if (aY > obliqueThreshold && aY > aX && aY > aZ) {
        axis = oY;
    }
    else if (aZ > obliqueThreshold && aZ > aX && aZ > aY) {
        axis = oZ;
    }
    this.orientation = axis;
    return axis;
}

// given the text orientation, determine the index (0,1,2)
// of the z axis
function determineOrientationIndex(orientation) {
    var o = orientation;
    var index = undefined;
    switch (o) {
        case 'A':
        case 'P':
            index = 1;
            break;
        case 'L':
        case 'R':
            index = 0;
            break;
        case 'S':
        case 'I':
            index = 2;
            break;
        default:
            console.assert(false, " OBLIQUE NOT SUPPORTED");
            break;
    }
    return index;
}

// Given the orientation, determine the coordinates of the z axis
// i.e. the z axis per the DICOM xray or other device relative to the
// patient. Also, determine the average spacing along that axis, and
// return the index (0,1,2) of the z axis.
function computeZAxis(orientation, metaData) {
    var ippArray = [];
    let index = determineOrientationIndex(orientation);

    for (var value of metaData.values()) {
        let ipp = value.imagePositionPatient;
        if (index === 0) {
            ippArray.push(ipp.x);
        } else if (index === 1) {
            ippArray.push(ipp.y);
        } else {
            ippArray.push(ipp.z);
        }
    }

    ippArray.sort(function (a, b) {
        return a - b;
    });
    let meanSpacing = mean(diff(ippArray));

    console.log(meanSpacing);
    var obj = {
        spacing: meanSpacing,
        positions: ippArray,
        xyzIndex: index
    }
    return obj;
}


/*************************************************************************************************************************/

// NOTE yield pauses this function. Refer to documentation
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
function* getPromisesGenerator(a) {
    for (let i = 0; i < a.length; i++) {
        yield a[i];
    }
}


VolumeRenderingPlugin = class VolumeRenderingPlugin extends OHIFPlugin {

    constructor(options = {}) {
        super();
        this.name = "VolumeRenderingPlugin";
        this.description = "VolumeRendering OHIF Plugin";
        this.volumeViewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });
        this.mapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();

        this.actor = vtk.Rendering.Core.vtkVolume.newInstance();
        this.actor.setMapper(this.mapper);

        // create color and opacity transfer functions
        this.ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
        this.ctfun.addRGBPoint(10.0, 0.4, 0.2, 0.0);
        this.ctfun.addRGBPoint(100.0, 1.0, 1.0, 1.0);
        this.ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
        this.ofun.addPoint(0.0, 0.0);
        this.ofun.addPoint(200.0, 0.9);
        this.ofun.addPoint(1000.0, 0.9);
        this.actor.getProperty().setRGBTransferFunction(0, this.ctfun);
        this.actor.getProperty().setScalarOpacity(0, this.ofun);
        this.actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
        this.actor.getProperty().setInterpolationTypeToLinear();
        this.actor.getProperty().setUseGradientOpacity(0, true);
        this.actor.getProperty().setGradientOpacityMinimumValue(0, 15);
        this.actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
        this.actor.getProperty().setGradientOpacityMaximumValue(0, 100);
        this.actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
        //this.actor.getProperty().setShade(true);
        this.actor.getProperty().setAmbient(0.7);
        this.actor.getProperty().setDiffuse(0.7);
        this.actor.getProperty().setSpecular(0.3);
        this.actor.getProperty().setSpecularPower(8.0);
        this.imageData = vtk.Common.DataModel.vtkImageData.newInstance();
        this.dataMap = undefined;
        this.mapper.setSampleDistance(0.8);
        this.installed = false;
        this.pluginDiv = undefined;
        this.metaData0 = undefined;
        this.zSpacing = 0;
        this.zVoxels = 0;
    }

    setup() {
      console.log('setup VR');

      this.renderViewport(Session.get('activeViewport'));
    }

    getDisplaySet(viewportIndex) {
        const viewportData = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];
        const { studyInstanceUid, displaySetInstanceUid } = viewportData;
        const studyMetadata = OHIF.viewer.StudyMetadataList.findBy({ studyInstanceUID: studyInstanceUid });
        
        return studyMetadata.findDisplaySet(displaySet => {
            return displaySet.displaySetInstanceUid === displaySetInstanceUid;
        });
    }

    renderViewport(viewportIndex = 0) {
        try {
            let self = this;
            // reset the div that will hold this plugin
            // - remove old ones
            // - add a new one with our id


            // Obtain the imaging data that has been provided to the viewport
            const displaySet = this.getDisplaySet(viewportIndex);

            // Clear whatever is currently present in the viewport
            const containers = document.querySelectorAll(".viewportContainer");
            const parent = containers[viewportIndex];
            parent.innerHTML = "";

            // Create our own viewport rendering window
            this.pluginDiv = document.createElement("div");
            this.pluginDiv.style.width = '100%';
            this.pluginDiv.style.height = '100%';
            this.pluginDiv.id = "volumeRenderingPlugin";
            parent.appendChild(this.pluginDiv);

            // Retrieve the Cornerstone imageIds from the display set
            // TODO: In future, we want to get the metadata independently from Cornerstone
            const imageIds = displaySet.images.map(image => image.getImageId());

            ///////////////////////////////////////////////////////
            // Compute the image size and spacing given the meta data we already have available.
            let metaDataMap = new Map;
            for (let i = 0; i < imageIds.length; i++) {
                metaDataMap.set(imageIds[i], cornerstone.metaData.get('imagePlane', imageIds[i]));
            }
            this.metaData0 = metaDataMap.values().next().value;

            let cc = this.metaData0.columnCosines;
            let rc = this.metaData0.rowCosines;
            let cp = cc.crossVectors(cc, rc);
            let o = determineOrientation(cp);


            let xSpacing = this.metaData0.columnPixelSpacing;
            let ySpacing = this.metaData0.rowPixelSpacing;


            let zAxis = computeZAxis(o, metaDataMap);
            this.zSpacing = zAxis.spacing;
            let xVoxels = this.metaData0.columns;
            let yVoxels = this.metaData0.rows;
            this.zVoxels = metaDataMap.size;

            this.imageData.setDimensions([xVoxels, yVoxels, this.zVoxels]);

            this.imageData.setSpacing([xSpacing, ySpacing, this.zSpacing]);
            let pixelArray = new Int16Array(xVoxels * yVoxels * this.zVoxels);

            let scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
                name: "Pixels",
                numberOfComponents: this.metaData0.SamplesPerPixel,
                values: pixelArray,
            });
            this.imageData.getPointData().setScalars(scalarArray);
            this.mapper.setInputData(this.imageData);
            this.dataMap = metaDataMap;
            ///////////////////////////////////////////////////////

            // Q up the promises.
            const loadImagePromises = imageIds.map(imageId => cornerstone.loadAndCacheImage(imageId));

            // This generator provides a "one at a time" paused iterator.
            const generator = getPromisesGenerator(loadImagePromises);
            let imagesReceived = 0;
            let nxt = generator.next();
            while (nxt.done === false) {
                nxt.value.then(function (result) {
                    if (window.performance && window.performance.memory){
                        console.log("total %d MB %d GB", window.performance.memory.totalJSHeapSize / 1024,window.performance.memory.totalJSHeapSize / (1024 * 1024) );
                        console.log("used %d MB %d GB", window.performance.memory.usedJSHeapSize / 1024, window.performance.memory.usedJSHeapSize / (1024 * 1024) );
                        console.log("limit %d MB %d GB" , window.performance.memory.jsHeapSizeLimit  / 1024,window.performance.memory.jsHeapSizeLimit / (1024 * 1024) );

                    }
                    let imageMetaData = self.dataMap.get(result.imageId);
                    console.log(imageMetaData.imagePositionPatient);
                    let sliceIndex = 0;
                    if (zAxis.xyzIndex == 0) {
                        sliceIndex = bsearch(zAxis.positions,imageMetaData.imagePositionPatient.x,compareReals);
                    } else if (zAxis.xyzIndex == 1)
                        sliceIndex = bsearch(zAxis.positions,imageMetaData.imagePositionPatient.y,compareReals);
                    else{
                        sliceIndex = bsearch(zAxis.positions,imageMetaData.imagePositionPatient.z,compareReals);
                    }

                    console.log(sliceIndex);
                    let pixels = result.getPixelData();
                    self.insertSlice(pixels,sliceIndex);
                    if (self.installed == false) {
                        self.installVTKVolumeRenderer(self.pluginDiv);
                        self.installed = true;
                    } else {
                        if (((imagesReceived % 5) | 0) == 0){
                            self.updateVTKVolumeRenderer();
                        }
                    }
                    imagesReceived++;
                    console.log("images received " + imagesReceived);

                }).catch(function (err) {
                    console.log(err);
                });
                nxt = generator.next();
            }
        }
        catch(error) {
            console.log(error);
        }
        this.updateVTKVolumeRenderer();
    }

    // Based on vtkImageData.cxx (vtkDataset)
    computeIndex(extent,incs, xyz)
    {
        return ( ( ((xyz[0] - extent[0]) * incs[0]) +((xyz[1] - extent[2]) * incs[1]) + ((xyz[2] - extent[4]) * incs[2])) | 0);
    }

    // Based on vtkImageData.cxx (vtkDataset)
    computeImageDataIncrements(numberOfComponents) {
        const datasetDefinition = this.imageData.get('extent', 'spacing', 'origin');
        let inc = [0,0,0];
        let incr = numberOfComponents;
        for (let idx = 0; idx < 3; ++idx)
        {
            inc[idx] = incr;
            incr *= (datasetDefinition.extent[idx*2+1] - datasetDefinition.extent[idx*2] + 1);
        }
        return inc;
    }

    // insert the slice at the z index location.
    insertSlice(pixels, index){
        console.time('insertSlice');

        const datasetDefinition = this.imageData.get('extent', 'spacing', 'origin');
        let scalars = this.imageData.getPointData().getScalars();
        let increments = this.computeImageDataIncrements(1); // TODO number of components.
        let scalarData = scalars.getData();

        let indexXYZ = [0,0,index];
        let pixelIndex = 0;
        for (let row = 0; row <= datasetDefinition.extent[3]; row++)
        {
            indexXYZ[1] = row;
            for (let col = 0; col <= datasetDefinition.extent[1]; col++)
            {
                indexXYZ[0] = col;
                {
                    let destIdx = this.computeIndex(datasetDefinition.extent, increments, indexXYZ);
                    scalarData[destIdx] = pixels[pixelIndex++];
                }
            }
        }
        this.imageData.modified();

        console.timeEnd('insertSlice');
    }

    // update the renderer.
    updateVTKVolumeRenderer() {

        const renderWindow = this.volumeViewer.getRenderWindow();
        const renderer = this.volumeViewer.getRenderer();
        renderer.updateLightsGeometryToFollowCamera();
        renderWindow.render();
    }

    // install the volume renderer into the web page.
    // you should only do this once.
    installVTKVolumeRenderer(container) {

        //
        // Create a volume rendering context
        //

        this.volumeViewer.setContainer(container);


        const renderer = this.volumeViewer.getRenderer();
        const renderWindow = this.volumeViewer.getRenderWindow();
        // TODO - expose transfer function editor
        //
        //  const controllerWidget = vtk.Interaction.UI.vtkVolumeController.newInstance({
        //   size: [400, 150],
        //   rescaleColorMap: true,
        //  });
        //   controllerWidget.setContainer(container);
        //  controllerWidget.setupContent(renderWindow, actor);
        //

        renderer.addVolume(this.actor);

        // TODO it seems there's bugs with positioning the actor at different spots in the world.
        // The clipping range etc. get's messed up. We default to the "defualts" for now rather than
        // positioning in patient relative space.
        let xCtr = this.metaData0.imagePositionPatient.x + ((this.metaData0.columns * this.metaData0.columnPixelSpacing) / 2.0)
        let yCtr = this.metaData0.imagePositionPatient.y + ((this.metaData0.rows * this.metaData0.rowPixelSpacing) / 2.0)
        let zCtr = this.metaData0.imagePositionPatient.z + ((this.zVoxels * this.zSpacing) / 2.0);

        let bounds = this.actor.getBounds();

        let cam =  renderer.getActiveCamera();
        renderer.resetCamera();

        renderWindow.render();
    }


};


OHIFPlugin.entryPoints["VolumeRenderingPlugin"] = function () {
    let VRPlugin = new VolumeRenderingPlugin();
    VRPlugin.setup();

    OHIFPlugin.VRPlugin = VRPlugin;
};

