var VolumeRenderingPlugin = class VolumeRenderingPlugin extends OHIF.plugins.ViewportPlugin {
    constructor(options = {}) {
        super("VolumeRenderingPlugin");

        this.description = "VolumeRendering OHIF Plugin";

        this.controllerWidget = vtk.Interaction.UI.vtkVolumeController.newInstance({
            size: [400, 150],
            rescaleColorMap: true,
        });

        OHIF.plugins.VTKDataCache = OHIF.plugins.VTKDataCache || {};
        OHIF.plugins.VTKDataCache.imageDataCache = new Map;
    }

    setup() {
        console.warn(`${this.name}: Setup Complete`);
    }


    static installVTKVolumeController(volumeController,volumeViewer, actor,dark) {
        const renderWindow = volumeViewer.getRenderWindow();
        volumeController.setupContent(renderWindow, actor, dark);
        volumeController.render();
    }

    setupViewport(div, { viewportIndex = 0 }, displaySet) {
        const viewportWrapper =  div.parentElement;
        console.warn(`${this.name}|setupViewport: viewportIndex: ${viewportIndex}`);

        if (!displaySet) {
            displaySet = OHIF.plugins.ViewportPlugin.getDisplaySet(viewportIndex);
        }

        viewportWrapper.style.position = "relative";

        const { VTKUtils } = window;
        const imageDataObject = VTKUtils.getImageData(displaySet);
        const imageData = imageDataObject.vtkImageData;

        div.innerHTML = '';

        const volumeViewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });



        volumeViewer.setContainer(div);

        // TODO: VTK's canvas currently does not fill the viewport element
        // after it has been resized. We need to set the height to 100% and
        // trigger volumeViewer.resize() whenever things are resized.
        // We might need to find a way to hook onto the OHIF Viewer ResizeManager
        // div.querySelector('canvas').style.height = '100%';
        volumeViewer.resize();

        const actor = VolumeRenderingPlugin.setupVTKActor(imageData);




        VTKUtils.installVTKViewer(volumeViewer, actor);

        const isDark = true;
        VolumeRenderingPlugin.installVTKVolumeController(this.controllerWidget,volumeViewer,actor,isDark);
        this.controllerWidget.setContainer(viewportWrapper);
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
};


OHIF.plugins.entryPoints["VolumeRenderingPlugin"] = function () {
    const volumeRenderingPlugin = new VolumeRenderingPlugin();
    volumeRenderingPlugin.setup();

    OHIF.plugins.VolumeRenderingPlugin = volumeRenderingPlugin;
};

