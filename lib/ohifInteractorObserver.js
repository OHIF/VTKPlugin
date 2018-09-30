const { macro } = vtk;
const { vtkInteractorObserver } = vtk.Rendering.Core;
import { computeZoomPercentage } from './computeZoomPercentage.js'

/**
 * vtkInteractorObserverClass.
 * @param publicAPI
 * @param model
 */
function ohifInteractorObserver(publicAPI, model) {
    model.classHierarchy.push('ohifInteractorObserver');

    macro.setGet(publicAPI, model, ['pluginInstanceData']);

    /**
     * Part of the interface for interactorObserver
     * @param evt
     */
    publicAPI.handleStartInteractionEvent = (evt) =>{

    };

    /**
     * handleInteractionEvent: if wheelData or windowLevelData,
     * call the plugin to update the UI and any other methods.
     * @param evt
     */
    publicAPI.handleInteractionEvent = (evt) =>{

        let data = publicAPI.getPluginInstanceData();
        const isWheelEvent = !!evt.wheelData;
        const isWindowLevelEvent = !!evt.windowLevelData;
        const isDollyEvent = !!evt.dollyData;
        if (isWheelEvent) {
            data.plugin.updateViewportText(evt.wheelData)
        } else if (isWindowLevelEvent){
            data.plugin.updateWindowLevelText(evt.windowLevelData)
        } else if (isDollyEvent) {
            const spacing = evt.dollyData.imageData.getSpacing();
            const slicingMode = data.slicingMode;
            const renderer = evt.dollyData.renderer;
            const actorBounds = evt.dollyData.sliceActor.getBounds();
            const imageDimensions =  evt.dollyData.imageData.getDimensions();
            const imageBounds = [0,imageDimensions[0]-1,0,imageDimensions[1]-1,0,imageDimensions[2]-1];
            const percentage = computeZoomPercentage(spacing,slicingMode,renderer,actorBounds,imageBounds);
            data.plugin.updateZoomText(evt.dollyData.viewDirection,percentage);
        }
    };

    /**
     * Part of the interface for interactorObserver.
     * @param evt
     */
    publicAPI.handleEndInteractionEvent = (evt) =>{

    };
}


const DEFAULT_VALUES = {
    enabled: true,
    interactor: null,
    priority: 0.0,
    processEvents: true,
    subscribedEvents: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
    Object.assign(model, DEFAULT_VALUES, initialValues);

    // Inheritance
    vtkInteractorObserver.extend(publicAPI, model, initialValues);

    // Object specific methods
    ohifInteractorObserver(publicAPI, model, initialValues);
}


// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'ohifInteractorObserver');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });