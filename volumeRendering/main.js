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
     * Set up the divs to receive the dynamic text later on, i.e. patient name, etc.
     * @param divParentElement
     * @param viewDirection
     * @param displaySet
     */
    setupViewportText(divParentElement,viewDirection,displaySet){
        // TODO , load style sheets.
        divParentElement.style.position = "relative";
        divParentElement.style.color = '#91b9cd';

        ///////// TOP LEFT
        // NO TOP LEFT because of Volume Widget.

        //////////// BOT LEFT
        const botLeftParent = document.createElement('div');
        botLeftParent.style.position="absolute";
        botLeftParent.style.bottom="10px";
        botLeftParent.style.left="10px";
        botLeftParent.id = viewDirection + "BottomLeft";
        const SeriesNumber = document.createElement('div');
        SeriesNumber.id = 'SeriesNumber';
        botLeftParent.appendChild(SeriesNumber);

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
        const PatientName = document.createElement('div');
        PatientName.id = 'PatientName';
        topRightParent.appendChild(PatientName);
        const PatientId = document.createElement('div');
        divParentElement.appendChild(topRightParent);
        PatientId.id = 'PatientId';
        topRightParent.appendChild(PatientId);

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
    }

    static setText(parent, textMap){
        for (let [key, value] of textMap) {
            parent.querySelector(key).innerHTML = value;
        }
    }

    static setBottomLeftText(viewDirection, displaySet){
        let botLeftParent = document.querySelector('#'+viewDirection+"BottomLeft");

        const bottomLeftMap = new Map();
        let seriesNum = displaySet.seriesNumber;
        let seriesDescription = displaySet.images[0]._series.seriesDescription.replace(/\^/g, " ");
        bottomLeftMap.set("#SeriesNumber","Ser:" + " " + seriesNum);
        bottomLeftMap.set("#SeriesDescription",seriesDescription);
        VolumeRenderingPlugin.setText(botLeftParent,bottomLeftMap);
    }

    static setTopRightText(viewDirection, displaySet){
        let topRightParent = document.querySelector('#'+viewDirection+"TopRight");

        const topRightMap = new Map();
        let patientName = displaySet.images[0]._study.patientName.replace(/\^/g, " ");
        let patientId = displaySet.images[0]._study.patientId;


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
        topRightMap.set("#PatientName",patientName);
        topRightMap.set("#PatientId",patientId);
        topRightMap.set("#StudyDescription",studyDescription);
        topRightMap.set("#SeriesDate",seriesDateString);
        VolumeRenderingPlugin.setText(topRightParent,topRightMap);
    }


    /**
     * Updates the text. The viewDirection helps us find the correct divs.
     * @param viewDirection
     * @param displaySet
     */
    updateViewportText(viewDirection,displaySet){
        VolumeRenderingPlugin.setBottomLeftText(viewDirection,displaySet);
        VolumeRenderingPlugin.setTopRightText(viewDirection,displaySet);
    }


    orientCamera(camera,orientation){
        switch (orientation){
            case 'I':
                break;
            case 'S':
                camera.elevation(-89.99); // TODO camera signularuty at -90???????
                break;
            case 'A':
                break;
            case 'P':
                break;
            case 'L':
                break;
            case 'R':
                break;
            default:
                console.assert("unknown orientation");
                break;
        }
    }

    /**
     * Overriden from base class. Sets up the viewport based on the viewportData and the displaySet.
     * @param div
     * @param viewportData
     * @param displaySet
     */
    setupViewport(div, viewportData, displaySet) {
        const viewportWrapper =  div.parentElement;
        const self = this;
        let { viewDirection } = viewportData.pluginData;
        // Seems like VolumeRendering in 4-up is not fast enough to use progressive
        // updating and have a nice user experience. Added loading spinner instead.
        div.innerHTML = `<div class="imageViewerLoadingIndicator loadingIndicator">
                            <div class="indicatorContents">
                                <p>Loading... <i class="fa fa-spin fa-circle-o-notch fa-fw"></i></p>
                            </div>
                        </div>`;

        // Reusing the OHIF loading indicator here... this is a bit ugly
        const loadingIndicator = div.querySelector('.imageViewerLoadingIndicator');

        // Default values are position:absolute and display: none so we have to change
        // them here if we want this to display
        loadingIndicator.style.position = 'relative';
        loadingIndicator.style.display = 'block';


        if (!displaySet) {
            displaySet = OHIF.plugins.ViewportPlugin.getDisplaySet(viewportIndex);
        }

        // Reject image sets that are less than 20 images.
        if (displaySet.images.length < 20){
            div.innerHTML = "";
            throw new Error("Series has too few images for this plugin.");
        }
        viewportWrapper.style.position = "relative";

        const { VTKUtils } = window;

        const imageDataObject = VTKUtils.getImageData(displaySet);

        if (imageDataObject === null){
            throw new Error('Cached VTK image data object was null.');
        }

        const imageData = imageDataObject.vtkImageData;

        function displayVolumeRendering() {
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
            rescaleColorMap: false,
            expanded: false
          });

          // TODO we assume for now that the background is "dark".
          const isDark = true;
          controllerWidget.setContainer(viewportWrapper);

          VolumeRenderingPlugin.installVTKVolumeController(controllerWidget, genericRenderWindow, actor, isDark);

          self.setupViewportText(viewportWrapper, viewDirection, displaySet);
          self.updateViewportText(viewDirection, displaySet);

          self.orientCamera(genericRenderWindow.getRenderer().getActiveCamera(),imageDataObject.orientation);
          genericRenderWindow.getRenderWindow().render();

        }

        // Don't load data until the viewports etc are set up (above).
        if (imageDataObject.loaded === true) {
          displayVolumeRendering();
        } else {
          VTKUtils.loadImageData(imageDataObject).then(displayVolumeRendering);
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

