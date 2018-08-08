import { getImageData } from './getImageData.js';
import { installVTKViewer } from './installVTKViewer.js';
import { logMemoryUsage } from './logMemoryUsage.js';
import { math } from './math/index.js';

// TODO: Split everything in this into separate files
//import './parsingUtils.js';

const VTKUtils = {
    getImageData,
    installVTKViewer,
    logMemoryUsage,
    math,
};

console.warn('>>> VTK UTILS IMPORT?');

// TODO: this probably isn't the best thing to do here
window.VTKUtils = VTKUtils;
