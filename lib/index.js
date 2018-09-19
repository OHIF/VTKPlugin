import { getImageData } from './getImageData.js';
import { loadImageData } from './loadImageData.js';
import { installVTKViewer } from './installVTKViewer.js';
import { logMemoryUsage } from './logMemoryUsage.js';
import { math } from './math/index.js';
import { MPR } from './MPR/index.js';
import { switchToMPRMode } from './switchToMPRMode.js';
import ohifInteractorStyleSlice from './ohifInteractorStyleSlice.js';
import ohifInteractorObserver from './ohifInteractorObserver.js';
// TODO: Split everything in this into separate files
//import './parsingUtils.js';

const VTKUtils = {
    getImageData,
    loadImageData,
    installVTKViewer,
    logMemoryUsage,
    math,
    MPR,
    ohifInteractorStyleSlice,
    switchToMPRMode,
    ohifInteractorObserver
};

console.warn('>>> VTK UTILS IMPORT?');

// TODO: this probably isn't the best thing to do here
window.VTKUtils = VTKUtils;
