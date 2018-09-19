var VolumeRenderingPlugin = class VolumeRenderingPlugin extends OHIF.plugins.ViewportPlugin {
    constructor(options = {}) {
        super("VolumeRenderingPlugin");
        const { VTKUtils } = window;

        this.description = "VolumeRendering OHIF Plugin";

        OHIF.plugins.VTKDataCache = OHIF.plugins.VTKDataCache || {};
        OHIF.plugins.VTKDataCache.imageDataCache = new Map;

        this.callbacks = [];
    }

    setup() {
        console.warn(`${this.name}: Setup Complete`);
    }

    //TODO move to VTKUtils?
    static installVTKVolumeController(volumeController,volumeViewer, actor,dark) {
        const renderWindow = volumeViewer.getRenderWindow();
        volumeController.setupContent(renderWindow, actor, dark);
        volumeController.setExpanded(false);
        volumeController.render();
    }

    /**
     * Overriden from base class. Sets up the viewport based on the viewportData and the displaySet.
     * @param div
     * @param viewportData
     * @param displaySet
     */
    setupViewport(div, viewportData, displaySet) {
        const viewportWrapper =  div.parentElement;

        if (!displaySet) {
            displaySet = OHIF.plugins.ViewportPlugin.getDisplaySet(viewportIndex);
        }

        viewportWrapper.style.position = "relative";

        const { VTKUtils } = window;
        const imageDataObject = VTKUtils.getImageData(displaySet);

        if (imageDataObject === null){
            throw new Error('Cached VTK image data object was null.');
        }

        const imageData = imageDataObject.vtkImageData;

        div.innerHTML = '';

        const genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });

        genericRenderWindow.setContainer(div);

        // TODO: VTK's canvas currently does not fill the viewport element
        // after it has been resized. We need to set the height to 100% and
        // trigger volumeViewer.resize() whenever things are resized.
        // We might need to find a way to hook onto the OHIF Viewer ResizeManager
        // div.querySelector('canvas').style.height = '100%';
        genericRenderWindow.resize();

        const actor = VolumeRenderingPlugin.setupVTKActor(imageData);

        VTKUtils.installVTKViewer(genericRenderWindow, actor);

        // We need to fix to load our color tables.
        const controllerWidget = vtk.Interaction.UI.vtkVolumeController.newInstance({
            size: [400, 150],
            rescaleColorMap: true,
            expanded: false
        });

        // TODO we assume for now that the background is "dark".
        const isDark = true;
        controllerWidget.setContainer(viewportWrapper);

        VolumeRenderingPlugin.installVTKVolumeController(controllerWidget, genericRenderWindow, actor, isDark);

        // Callbacks in the context of each plugin data instance.
        this.callbacks.push({
          view: genericRenderWindow,
          func: function(v){
            v.getRenderWindow().render();
          }
        });

        // Don't load data until the viewports etc are set up (above).
        if (imageDataObject.loaded === false){
            VTKUtils.loadImageData(imageDataObject, this.callbacks);
        }
    }

    /**
     * Set up the actor into the mapper and intialize the volume properties.
     * @param imageData
     */
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
};


OHIF.plugins.entryPoints["VolumeRenderingPlugin"] = function () {
    const volumeRenderingPlugin = new VolumeRenderingPlugin();
    volumeRenderingPlugin.setup();

    OHIF.plugins.VolumeRenderingPlugin = volumeRenderingPlugin;
};

