const { macro } = vtk;
const { vtkInteractorObserver } = vtk.Rendering.Core;


function ohifInteractorObserver(publicAPI, model) {
    model.classHierarchy.push('ohifInteractorObserver');

    publicAPI.handleStartInteractionEvent = (evt) =>{
       // These can be used once kitware fixes the events
    };

    publicAPI.handleInteractionEvent = (evt) =>{
        // These can be used once kitware fixes the events
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