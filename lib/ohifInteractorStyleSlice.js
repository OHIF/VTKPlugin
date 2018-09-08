// TODO: imports may be better, not sure
const { macro } = vtk;
const { vtkImageMapper } = vtk.Rendering.Core;
const { States } = vtk.Rendering.Core.vtkInteractorStyle;
const { vtkInteractorStyleTrackballCamera } = vtk.Interaction.Style;

function ohifInteractorStyleSlice(publicAPI, model) {
    // Set our className
    model.classHierarchy.push('ohifInteractorStyleSlice');
    macro.setGet(publicAPI, model, ['directionalProperties']);

    macro.setGet(publicAPI, model, ['lastCameraPosition']);
    macro.setGet(publicAPI, model, ['viewDirection']);
    macro.setGet(publicAPI, model, ['displaySet']);

    publicAPI.setLastCameraPosition(undefined);
    publicAPI.setDisplaySet(undefined);


    // Public API methods
    publicAPI.superHandleMouseMove = publicAPI.handleMouseMove;
    publicAPI.handleMouseMove = (callData) => {
        const pos = callData.position;
        const renderer = callData.pokedRenderer;

        switch (model.state) {
            case States.IS_WINDOW_LEVEL:
                publicAPI.windowLevel(renderer, pos);
                publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
                break;
            default:
                break;
        }
        publicAPI.superHandleMouseMove(callData);
    };

    //----------------------------------------------------------------------------
    publicAPI.superHandleLeftButtonPress = publicAPI.handleLeftButtonPress;
    publicAPI.handleLeftButtonPress = (callData) => {
        const pos = callData.position;

        if (!callData.shiftKey && !callData.controlKey) {
            model.windowLevelStartPosition[0] = pos.x;
            model.windowLevelStartPosition[1] = pos.y;
            // Get the last (the topmost) image
            publicAPI.setCurrentImageNumber(model.currentImageNumber);
            const property = model.currentImageProperty;
            if (property) {
                model.windowLevelInitial[0] = property.getColorWindow();
                model.windowLevelInitial[1] = property.getColorLevel();
            }
            publicAPI.startWindowLevel();
        } else if (model.interactionMode === 'IMAGE_SLICING') {
            model.lastSlicePosition = pos.y;
            publicAPI.startSlice();
        } else {
            // The rest of the button + key combinations remain the same
            publicAPI.superHandleLeftButtonPress(callData);
        }
    };

    //--------------------------------------------------------------------------
    publicAPI.superHandleLeftButtonRelease = publicAPI.handleLeftButtonRelease;
    publicAPI.handleLeftButtonRelease = () => {
        switch (model.state) {
            case States.IS_WINDOW_LEVEL:
                publicAPI.endWindowLevel();
                break;
            case States.IS_SLICE:
                publicAPI.endSlice();
                break;

            default:
                publicAPI.superHandleLeftButtonRelease();
                break;
        }
    };

 
 
    publicAPI.setText = (parent,textMap) => {
        for (let [key, value] of textMap) {
            parent.querySelector(key).innerHTML = value;
        }
    }

    publicAPI.setTopLeftText = (viewDirection,displaySet) => {
        let patientName = displaySet.images[0]._study.patientName.replace(/\^/g, " ");
        let patientId = displaySet.images[0]._study.patientId;
        let topLeftParent = document.querySelector('#'+ viewDirection +"TopLeft");

        var topLeftMap = new Map();
        topLeftMap.set("#PatientName",patientName);
        topLeftMap.set("#PatientId",patientId);
        publicAPI.setText(topLeftParent,topLeftMap);

    }

    publicAPI.setBottomLeftText = (viewDirection,displaySet,idx,idxCount) => {
        let botLeftParent = document.querySelector('#'+viewDirection+"BottomLeft");

        var bottomLeftMap = new Map();

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
        publicAPI.setText(botLeftParent,bottomLeftMap);
    }

    publicAPI.setTopRightText = (viewDirection,displaySet) => {
        let topRightParent = document.querySelector('#'+viewDirection+"TopRight");

        var topRightMap = new Map();
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
        var options = {year: 'numeric', month: 'long', day: 'numeric', hour: "numeric", minute: "numeric", second: "numeric" };
        let seriesDateString = sd.toLocaleDateString("en-US",options);

        topRightMap.set("#StudyDescription",studyDescription);
        topRightMap.set("#SeriesDate",seriesDateString);
        publicAPI.setText(topRightParent,topRightMap);

    }

    publicAPI.setBottomRightText = (viewDirection,displaySet) => {
        let botRightParent = document.querySelector('#'+viewDirection+"BotRight");

        var botRightMap = new Map();
        let compStr = displaySet.images[0]._data.lossyImageCompression === undefined ? "Lossless / Uncompressed" :  ds.images[0]._data.lossyImageCompression;
        let window = model.currentImageProperty.getColorWindow();
        let level = model.currentImageProperty.getColorLevel();
        let windowStr = parseInt(window,10);
        let levelStr = parseInt(level,10);
        botRightMap.set("#Compression",compStr);
        botRightMap.set("#WindowLevel","W " + windowStr + " L " + levelStr);
        publicAPI.setText(botRightParent,botRightMap);
    }

    //--------------------------------------------------------------------------
    publicAPI.handleStartMouseWheel = (callData) => {
        publicAPI.startSlice();
    };

    //--------------------------------------------------------------------------
    publicAPI.handleEndMouseWheel = () => {
        publicAPI.endSlice();
    };

    //--------------------------------------------------------------------------
    publicAPI.handleMouseWheel = (callData) => {
        let increment = 0;
        if (callData.spinY < 0){
            increment = 1;
        }
        else
        {
            increment = -1;
        }
        publicAPI.moveSliceByWheel(increment);
    };

    publicAPI.moveSliceByWheel = (increment)=>{

        let slice = publicAPI.findSlice();
        let props = publicAPI.getDirectionalProperties();

        if (slice) {
            const renderer = model.interactor.getCurrentRenderer();
            renderer.getActiveCamera().setParallelProjection(true);

            let mode = slice.getMapper().getSlicingMode();
            let currentPosition = undefined;
            let newPos = undefined;
            let worldPos = undefined;
            switch(mode){
                case vtkImageMapper.SlicingMode.Z:
                    currentPosition = props.currentZIndex * props.zSpacing;
                    newPos = currentPosition + (props.zSpacing * increment);
                    worldPos = props.zPositions[props.currentZIndex];
                    break;
                case vtkImageMapper.SlicingMode.Y:
                    currentPosition = props.currentYIndex * props.ySpacing;
                    newPos = currentPosition + (props.ySpacing * increment);
                    worldPos = props.yPositions[props.currentYIndex];
                    break;
                case vtkImageMapper.SlicingMode.X:
                    currentPosition = props.currentXIndex * props.xSpacing;
                    newPos = currentPosition + (props.xSpacing * increment);
                    worldPos = props.xPositions[props.currentXIndex];
                    break;
            }

            if (newPos < 0){
                newPos = 0.0;
            }

            slice.getMapper().setSlicingMode(mode);
            let idx = slice.getMapper().getSliceAtPosition(newPos);

            let idxCount = undefined;
            switch(mode) {
                case vtkImageMapper.SlicingMode.Z:
                    props.currentZIndex = idx;
                    slice.getMapper().setZSlice(idx);
                    idxCount = props.zPositions.length;
                    break;
                case vtkImageMapper.SlicingMode.Y:
                    props.currentYIndex = idx;
                    slice.getMapper().setYSlice(idx);
                    idxCount = props.yPositions.length;
                    break;
                case vtkImageMapper.SlicingMode.X:
                    props.currentXIndex = idx;
                    slice.getMapper().setXSlice(idx);
                    idxCount = props.xPositions.length;
                    break;
            }


            if (publicAPI.getLastCameraPosition() != undefined) {
                let pos = publicAPI.getLastCameraPosition();
                renderer.getActiveCamera().setPosition(pos[0], pos[1], pos[2]);
            } else {
                renderer.resetCamera();
            }

            let displaySet = publicAPI.getDisplaySet();
            let viewDirection = publicAPI.getViewDirection();

            publicAPI.setTopLeftText(viewDirection,displaySet);
            publicAPI.setBottomLeftText(viewDirection, displaySet,idx,idxCount);
            publicAPI.setTopRightText(viewDirection,displaySet);
            publicAPI.setBottomRightText(viewDirection,displaySet);

            renderer.getRenderWindow().render();

        }
    }
    //----------------------------------------------------------------------------
    publicAPI.windowLevel = (renderer, position) => {
        model.windowLevelCurrentPosition[0] = position.x;
        model.windowLevelCurrentPosition[1] = position.y;
        const rwi = model.interactor;

        if (model.currentImageProperty) {
            const size = rwi.getView().getViewportSize(renderer);

            const mWindow = model.windowLevelInitial[0];
            const level = model.windowLevelInitial[1];

            // Compute normalized delta
            let dx =
                (model.windowLevelCurrentPosition[0] -
                    model.windowLevelStartPosition[0]) *
                4.0 /
                size[0];
            let dy =
                (model.windowLevelStartPosition[1] -
                    model.windowLevelCurrentPosition[1]) *
                4.0 /
                size[1];

            // Scale by current values
            if (Math.abs(mWindow) > 0.01) {
                dx *= mWindow;
            } else {
                dx *= mWindow < 0 ? -0.01 : 0.01;
            }
            if (Math.abs(level) > 0.01) {
                dy *= level;
            } else {
                dy *= level < 0 ? -0.01 : 0.01;
            }

            // Abs so that direction does not flip
            if (mWindow < 0.0) {
                dx *= -1;
            }
            if (level < 0.0) {
                dy *= -1;
            }

            // Compute new mWindow level
            let newWindow = dx + mWindow;
            const newLevel = level - dy;

            if (newWindow < 0.01) {
                newWindow = 0.01;
            }

            model.currentImageProperty.setColorWindow(newWindow);
            model.currentImageProperty.setColorLevel(newLevel);

            publicAPI.setBottomRightText(publicAPI.getViewDirection(),publicAPI.getDisplaySet());
        }
    };



    //----------------------------------------------------------------------------
    // This is a way of dealing with images as if they were layers.
    // It looks through the renderer's list of props and sets the
    // interactor ivars from the Nth image that it finds.  You can
    // also use negative numbers, i.e. -1 will return the last image,
    // -2 will return the second-to-last image, etc.
    publicAPI.setCurrentImageNumber = (i) => {
        const renderer = model.interactor.getCurrentRenderer();
        if (!renderer) {
            return;
        }
        model.currentImageNumber = i;

        function propMatch(prop) {
            if (
                prop.isA('vtkImageSlice')
            ) {
                return true;
            }
            return false;
        }

        const props = renderer.getViewProps();

        let imageProp = null;
        let foundImageProp = false;
        for (let j = 0; j < props.length && !foundImageProp; j++) {
            if (propMatch(props[j])) {
                foundImageProp = true;
                imageProp = props[j];
                break;
            }
        }

        if (imageProp) {
            model.currentImageProperty = imageProp.getProperty();
        }
    };

    publicAPI.findSlice = ()=> {

        function propMatch(prop) {
            if (
                prop.isA('vtkImageSlice')
            ) {
                return true;
            }
            return false;
        }
        const renderer = model.interactor.getCurrentRenderer();
        if (!renderer) {
            return;
        }
        const props = renderer.getViewProps();

        let imageProp = null;
        let foundImageProp = false;
        for (let j = 0; j < props.length && !foundImageProp; j++) {
            if (propMatch(props[j])) {
                foundImageProp = true;
                imageProp = props[j];
                break;
            }
        }

        if (imageProp) {
            model.currentImageProperty = imageProp.getProperty();
        }
        return imageProp;
    };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
    windowLevelStartPosition: [0, 0],
    windowLevelCurrentPosition: [0, 0],
    lastSlicePosition: 0,
    windowLevelInitial: [1, 0.5],
    currentImageProperty: 0,
    currentImageNumber: -1,
    interactionMode: 'IMAGE_SLICE',
    xViewRightVector: [0, 1, 0],
    xViewUpVector: [0, 0, -1],
    yViewRightVector: [1, 0, 0],
    yViewUpVector: [0, 0, -1],
    zViewRightVector: [1, 0, 0],
    zViewUpVector: [0, 1, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
    Object.assign(model, DEFAULT_VALUES, initialValues);

    // Inheritance
    vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);

    // Create get-set macros
    macro.setGet(publicAPI, model, ['interactionMode']);

    // For more macro methods, see "Sources/macro.js"

    // Object specific methods
    ohifInteractorStyleSlice(publicAPI, model,initialValues);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'ohifInteractorStyleSlice');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
