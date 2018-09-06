// Define with var here so that we can continuously reload this code after making
// modifications
var MultiplanarReformattingPlugin = class MultiplanarReformattingPlugin extends OHIF.plugins.ViewportPlugin {
    constructor(options = {}) {
        super("MultiplanarReformattingPlugin");

        this.description = "Multiplanar Reformatting OHIF Plugin";

        OHIF.plugins.VTKDataCache = OHIF.plugins.VTKDataCache || {};
        OHIF.plugins.VTKDataCache.imageDataCache = new Map;
    }

    setup() {
        console.warn(`${this.name}: Setup Complete`);
    }

    setupViewport(div, viewportData, displaySet) {
        const viewportWrapper =  div.parentElement;
        const { viewportIndex } = viewportData;
        let { viewDirection } = viewportData.pluginData;

        console.warn(`${this.name}|setupViewport: viewportIndex: ${viewportIndex}`);

        if (!displaySet) {
            displaySet = OHIF.plugins.ViewportPlugin.getDisplaySet(viewportIndex);
        }

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

        const actor = MultiplanarReformattingPlugin.setupVTKActor(imageData);
        const renderer = volumeViewer.getRenderer();
        const renderWindow = volumeViewer.getRenderWindow();

        renderer.addActor(actor);

        const scanDirection = imageDataObject.orientation;
        if (!viewDirection) {
            console.warn('No View Direction provided!');
            viewDirection = scanDirection;
        }



        viewportWrapper.style.color = '#91b9cd';
        viewportWrapper.style.position="relative";

        const parent = document.createElement('div');
        parent.style.position="absolute";
        parent.style.top="0";
        parent.id = viewDirection;
        const SliceNumber = document.createElement('div');
        SliceNumber.id = 'SliceNumber';
        parent.appendChild(SliceNumber);

        const Position = document.createElement('div');
        Position.id = 'Position';
        parent.appendChild(Position);

        const WorldPosition = document.createElement('div');
        WorldPosition.id = 'WorldPosition';
        parent.appendChild(WorldPosition);

        const CameraPosition = document.createElement('div');
        CameraPosition.id = 'CameraPosition';
        parent.appendChild(CameraPosition);

        const SlicePosition = document.createElement('div');
        SlicePosition.id = 'SlicePosition';
        parent.appendChild(SlicePosition);
        viewportWrapper.appendChild(parent);


        const { MPR, ohifInteractorStyleSlice } = VTKUtils;
        const mode = MPR.computeSlicingMode(scanDirection, viewDirection);        const imageMapper = actor.getMapper();

        console.warn(imageData);
        imageMapper.setInputData(imageData);
        imageMapper.setSlicingMode(mode);

        const IPP = MPR.computeIPP(imageDataObject);
        const interactorStyle = ohifInteractorStyleSlice.newInstance();
        const initialValues = {
            currentXIndex: Math.round(imageDataObject.dimensions[0] / 2),
            currentYIndex: Math.round(imageDataObject.dimensions[1] / 2),
            currentZIndex: Math.round(imageDataObject.dimensions[2] / 2),
            xPositions: IPP.x,
            yPositions: IPP.y,
            zPositions: IPP.z,
            xSpacing: imageDataObject.spacing[0],
            ySpacing: imageDataObject.spacing[1],
            zSpacing: imageDataObject.spacing[2]
        }

        console.warn('initialValues', initialValues);

        interactorStyle.setDirectionalProperties(initialValues);
        interactorStyle.setInteractionMode('IMAGE_SLICE');
        interactorStyle.setViewDirection(viewDirection);
        renderWindow.getInteractor().setInteractorStyle(interactorStyle);

        renderer.resetCamera();
        renderer.resetCameraClippingRange();
        console.warn(`scanDirection: ${scanDirection}`);
        console.warn(`viewDirection: ${viewDirection}`);
        interactorStyle.moveSliceByWheel(0);
        MPR.computeCamera(scanDirection, viewDirection, renderer.getActiveCamera());

        renderWindow.render();
    }

    static setupVTKActor(imageData) {
        const mapper = vtk.Rendering.Core.vtkImageMapper.newInstance();
        mapper.setInputData(imageData);

        const actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
        actor.setMapper(mapper);

        return actor;
    }
}

OHIF.plugins.entryPoints["MultiplanarReformattingPlugin"] = function () {
    const multiplanarReformattingPlugin = new MultiplanarReformattingPlugin();
    multiplanarReformattingPlugin.setup();

    OHIF.plugins.MultiplanarReformattingPlugin = multiplanarReformattingPlugin;
};

