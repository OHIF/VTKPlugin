// Define with var here so that we can continuously reload this code after making
// modifications
var MultiplanarReformattingPlugin = class MultiplanarReformattingPlugin extends OHIF.plugins.ViewportPlugin {
    constructor(options = {}) {
        super("MultiplanarReformattingPlugin");

        this.description = "Multiplanar Reformatting OHIF Plugin";
        OHIF.plugins.VTKDataCache = OHIF.plugins.VTKDataCache || {};
        OHIF.plugins.VTKDataCache.imageDataCache = new Map;

        this.callbacks = [];
    }

    setup() {
        console.warn(`${this.name}: Setup Complete`);
    }

    static setText(parent, textMap){
        for (let [key, value] of textMap) {
            parent.querySelector(key).innerHTML = value;
        }
    }

    static setTopLeftText(viewDirection, displaySet){
        let patientName = displaySet.images[0]._study.patientName.replace(/\^/g, " ");
        let patientId = displaySet.images[0]._study.patientId;
        let topLeftParent = document.querySelector('#'+ viewDirection +"TopLeft");

        const topLeftMap = new Map();
        topLeftMap.set("#PatientName",patientName);
        topLeftMap.set("#PatientId",patientId);
        MultiplanarReformattingPlugin.setText(topLeftParent,topLeftMap);

    }

    static setBottomLeftText(viewDirection, displaySet, idx, idxCount){
        let botLeftParent = document.querySelector('#'+viewDirection+"BottomLeft");

        const bottomLeftMap = new Map();

        let seriesNum = displaySet.seriesNumber;
        let columns = displaySet.images[0]._data.columns;
        let rows = displaySet.images[0]._data.rows;
        let seriesDescription = displaySet.images[0]._series.seriesDescription.replace(/\^/g, " ");
        let thickness = parseFloat(displaySet.images[0]._data.sliceThickness).toFixed(2);
        bottomLeftMap.set("#SeriesNumber","Ser:" + " " + seriesNum);
        // display is one based.
        const sliceNum = idx + 1;
        bottomLeftMap.set("#SliceNumber","Img:" + " " + sliceNum + " " + "(" + sliceNum + "/" + idxCount + ")");

        bottomLeftMap.set("#ColsRows",columns + " x " + rows);
        bottomLeftMap.set("#SliceThickness","Thick: " + thickness);
        bottomLeftMap.set("#SeriesDescription",seriesDescription);
        MultiplanarReformattingPlugin.setText(botLeftParent,bottomLeftMap);
    }

    static setTopRightText(viewDirection, displaySet){
        let topRightParent = document.querySelector('#'+viewDirection+"TopRight");

        const topRightMap = new Map();
        let studyDescription = displaySet.images[0]._study.studyDescription.replace(/\^/g, " ");
        let studyDate = displaySet.images[0]._study.studyDate;

        let seriesYear = parseInt(studyDate.substr(0,4),10);
        let seriesMonth = parseInt(studyDate.substr(4,2),10);
        let seriesDay = parseInt(studyDate.substr(6,2),10);
        let studyTime =  displaySet.images[0]._study.studyTime;
        let splitTime = studyTime.split(".");
        let leftTime = splitTime[0];
        let seriesHour = parseInt(leftTime.substr(0,2),10);
        let seriesMinute = parseInt(leftTime.substr(2,2),10);
        let seriesSecond = parseInt(leftTime.substr(4,2),10);
        let sd = new Date(seriesYear, seriesMonth-1, seriesDay,seriesHour,seriesMinute,seriesSecond);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        };
        let seriesDateString = sd.toLocaleDateString("en-US",options);

        topRightMap.set("#StudyDescription",studyDescription);
        topRightMap.set("#SeriesDate",seriesDateString);
        MultiplanarReformattingPlugin.setText(topRightParent,topRightMap);

    }

    setBottomRightText(viewDirection,displaySet,window,level){
        let botRightParent = document.querySelector('#'+viewDirection+"BotRight");
        const botRightMap = new Map();
        let compStr = displaySet.images[0]._data.lossyImageCompression === undefined ? "Lossless / Uncompressed" :  ds.images[0]._data.lossyImageCompression;
        let windowStr = parseInt(window,10);
        let levelStr = parseInt(level,10);
        botRightMap.set("#Compression",compStr);
        botRightMap.set("#WindowLevel","W " + windowStr + " L " + levelStr);
        MultiplanarReformattingPlugin.setText(botRightParent,botRightMap);
    }

    /**
     * Updates the text. The viewDirection helps us find the correct divs.
     * @param eventData
     */
    updateViewportText(eventData){
        MultiplanarReformattingPlugin.setBottomLeftText(eventData.viewDirection, eventData.displaySet,eventData.sliceIndex,eventData.sliceCount);
        MultiplanarReformattingPlugin.setTopLeftText(eventData.viewDirection,eventData.displaySet);
        MultiplanarReformattingPlugin.setTopRightText(eventData.viewDirection,eventData.displaySet);
        this.setBottomRightText(eventData.viewDirection,eventData.displaySet,eventData.window,eventData.level);
    }

    /**
     * Updates the window level text.
     * @param eventData
     */
    updateWindowLevelText(eventData){
        this.setBottomRightText(eventData.viewDirection,eventData.displaySet,eventData.window,eventData.level);
    }


    updateZoomText(viewDirection,percentage){
        let botRightParent = document.querySelector('#'+viewDirection+"BotRight");
        const botRightMap = new Map();
        let percentageStr = parseInt(percentage,10);
        const zoomString = "Zoom: " + percentageStr + "%";
        botRightMap.set("#Zoom",zoomString);
        MultiplanarReformattingPlugin.setText(botRightParent,botRightMap);
    }

    /**
     * Set up the divs to receive the dynamic text later on, i.e. the slice number, etc.
     * @param divParentElement
     * @param viewDirection
     * @param displaySet
     */
    setupViewportText(divParentElement,viewDirection,displaySet){
        // TODO , load style sheets.
        divParentElement.style.position = "relative";
        divParentElement.style.color = '#91b9cd';

        ///////// TOP LEFT
        const topLeftParent = document.createElement('div');
        topLeftParent.style.position="absolute";
        topLeftParent.style.top="10px";
        topLeftParent.id = viewDirection + "TopLeft";
        topLeftParent.style.left="10px";
        const PatientName = document.createElement('div');
        PatientName.id = 'PatientName';
        topLeftParent.appendChild(PatientName);
        const PatientId = document.createElement('div');
        divParentElement.appendChild(topLeftParent);
        PatientId.id = 'PatientId';
        topLeftParent.appendChild(PatientId);

        //////////// BOT LEFT
        divParentElement.appendChild(topLeftParent);
        const botLeftParent = document.createElement('div');
        botLeftParent.style.position="absolute";
        botLeftParent.style.bottom="10px";
        botLeftParent.style.left="10px";
        botLeftParent.id = viewDirection + "BottomLeft";
        const SeriesNumber = document.createElement('div');
        SeriesNumber.id = 'SeriesNumber';
        botLeftParent.appendChild(SeriesNumber);
        const SliceNumber = document.createElement('div');
        SliceNumber.id = 'SliceNumber';
        botLeftParent.appendChild(SliceNumber);
        const ColsRows = document.createElement('div');
        botLeftParent.appendChild(ColsRows);
        ColsRows.id = 'ColsRows';
        const SliceThickness = document.createElement('div');

        SliceThickness.id = 'SliceThickness';
        botLeftParent.appendChild(SliceThickness);
        const SeriesDescription = document.createElement('div');
        botLeftParent.appendChild(SeriesDescription);
        SeriesDescription.id = 'SeriesDescription';

        /////////// TOP RIGHT
        divParentElement.appendChild(botLeftParent);
        const topRightParent = document.createElement('div');
        topRightParent.style.position="absolute";
        topRightParent.style.top="10px";
        topRightParent.style.right="10px";
        topRightParent.id = viewDirection + "TopRight";
        const StudyDescription = document.createElement('div');
        StudyDescription.id = 'StudyDescription';
        topRightParent.appendChild(StudyDescription);
        const SeriesDate = document.createElement('div');
        topRightParent.appendChild(SeriesDate);
        SeriesDate.id = 'SeriesDate';

        divParentElement.appendChild(topRightParent);
        /////////// BOT RIGHT
        const botRightParent = document.createElement('div');
        botRightParent.style.position="absolute";
        botRightParent.style.bottom="10px";
        botRightParent.id = viewDirection + "BotRight";
        botRightParent.style.right="10px";
        const Zoom = document.createElement('div');
        Zoom.id = 'Zoom';
        botRightParent.appendChild(Zoom);
        const Compression = document.createElement('div');
        Compression.id = 'Compression';
        botRightParent.appendChild(Compression);
        const WindowLevel = document.createElement('div');
        botRightParent.appendChild(WindowLevel);
        divParentElement.appendChild(botRightParent);

        WindowLevel.id = 'WindowLevel';
    }

    /**
     * Overriden from base class. Sets up the viewport based on the viewportData and the displaySet.
     * @param div
     * @param viewportData
     * @param displaySet
     */
    setupViewport(div, viewportData, displaySet) {
        const divParentElement = div.parentElement;
        const { viewportIndex } = viewportData;
        let { viewDirection } = viewportData.pluginData;

        if (!displaySet) {
            displaySet = OHIF.plugins.ViewportPlugin.getDisplaySet(viewportIndex);
        }

        const { VTKUtils } = window;
        const genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });

        const imageDataObject = VTKUtils.getImageData(displaySet);
        const imageData = imageDataObject.vtkImageData;

        div.innerHTML = '';

        genericRenderWindow.setContainer(div);

        const actor = MultiplanarReformattingPlugin.setupVTKActor(imageData);
        const renderer = genericRenderWindow.getRenderer();
        const renderWindow = genericRenderWindow.getRenderWindow();

        renderer.addActor(actor);

        // TODO: VTK's canvas currently does not fill the viewport element
        // after it has been resized. We need to set the height to 100% and
        // trigger viewer.resize() whenever things are resized.
        // We might need to find a way to hook onto the OHIF Viewer ResizeManager
        // div.querySelector('canvas').style.height = '100%';
        genericRenderWindow.resize();

        const scanDirection = imageDataObject.orientation;
        if (!viewDirection) {
            console.warn('No View Direction provided!');
            viewDirection = scanDirection;
        }

        this.setupViewportText(divParentElement, viewDirection, displaySet);


        const { MPR, ohifInteractorStyleSlice } = VTKUtils;
        const imageMapper = actor.getMapper();
        const mode = MPR.computeSlicingMode(scanDirection, viewDirection);

        imageMapper.setSlicingMode(mode);

        const IPP = MPR.computeIPP(imageDataObject);
        const interactorStyle = ohifInteractorStyleSlice.newInstance();
        const initialValues = {
            // zero based indexing;
            currentXIndex: Math.floor((imageDataObject.dimensions[0] - 1) / 2),
            currentYIndex: Math.floor((imageDataObject.dimensions[1] - 1) / 2),
            currentZIndex: Math.floor((imageDataObject.dimensions[2] - 1) / 2),
            xPositions: IPP.x,
            yPositions: IPP.y,
            zPositions: IPP.z,
            xSpacing: imageDataObject.spacing[0],
            ySpacing: imageDataObject.spacing[1],
            zSpacing: imageDataObject.spacing[2]
        };

        interactorStyle.setDirectionalProperties(initialValues);
        interactorStyle.setInteractionMode('IMAGE_SLICE');
        interactorStyle.setViewDirection(viewDirection);
        interactorStyle.setDisplaySet(displaySet);
        renderWindow.getInteractor().setInteractorStyle(interactorStyle);
        const observer = VTKUtils.ohifInteractorObserver.newInstance();
        observer.setPluginInstanceData({plugin: this, viewDirection: viewDirection, displaySet: displaySet,slicingMode: mode});
        observer.setEnabled(0);
        observer.setInteractor(interactorStyle);


        MPR.computeCamera(scanDirection, viewDirection, renderer.getActiveCamera());

        renderer.resetCameraClippingRange();
        renderer.resetCamera();
        imageData.modified();


        // Callbacks in the context of each plugin data instance.
        this.callbacks.push({
          view: genericRenderWindow,
          func: function(v){
            v.getRenderWindow().render();
            const range = imageData.getPointData().getScalars().getRange();
            console.log(range);
              let props = interactorStyle.findSlice();

              if (props){
                  props.getProperty().setColorWindow(range[1] - range[0]);
                  props.getProperty().setColorLevel(range[0] + ((range[1] - range[0]) / 2));
              }
          }
        });

        // Don't load data until the viewports etc are set up (above).
        if (imageDataObject.loaded === false){
            VTKUtils.loadImageData(imageDataObject, this.callbacks);
        }
        // enable this only at the end; we don't want interaction events before this point.
        observer.setEnabled(1);
        // Initialize to our default slice by faking a mouse wheel event.
        interactorStyle.handleStartMouseWheel();
        interactorStyle.moveSliceByWheel(0);
        interactorStyle.handleEndMouseWheel();
        const actorBounds = actor.getBounds();
        const percentage = VTKUtils.computeZoomPercentage(imageData.getSpacing(),mode,renderer,actorBounds,imageData.getBounds());
        this.updateZoomText(viewDirection,percentage);


    }

    /**
     * Associate the imageData with the actor and set the actor into
     * the mapper.
     * @param imageData
     */
    static setupVTKActor(imageData) {
        const mapper = vtk.Rendering.Core.vtkImageMapper.newInstance();
        mapper.setInputData(imageData);

        const actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
        actor.setMapper(mapper);

        return actor;
    }
};

OHIF.plugins.entryPoints["MultiplanarReformattingPlugin"] = function () {
    const multiplanarReformattingPlugin = new MultiplanarReformattingPlugin();
    multiplanarReformattingPlugin.setup();

    OHIF.plugins.MultiplanarReformattingPlugin = multiplanarReformattingPlugin;
};

