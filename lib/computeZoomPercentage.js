const { vtkImageMapper } = vtk.Rendering.Core;
const { vtkCoordinate } = vtk.Rendering.Core;


/**
 * computeZoomPercentange: compute the ratio of the slice as displayed vs
 * the image (including spacing) slice of the same direction and return as a percentage.
 * @param spacing
 * @param sliceMode
 * @param renderer
 * @param actorBounds
 * @param imageBounds
 * @returns {number}
 */
export function computeZoomPercentage(spacing,sliceMode,renderer,actorBounds,imageBounds){
    const sliceDiagonal = computeDiagonal(spacing,sliceMode,renderer,actorBounds);
    const imageDiagonal = computeImageDiagonal(spacing,sliceMode,renderer,imageBounds);

    return (sliceDiagonal / imageDiagonal) * 100.0;
}

/**
 * computeDiagonal: comute the length of the diagonal of the slice as renderered,
 * in pixels.
 * @param spacing
 * @param sliceMode
 * @param renderer
 * @param bounds
 * @returns {number}
 */
function computeDiagonal(spacing,sliceMode,renderer,bounds){
    return computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,false);
}

/**
 * computeImageDiagonal: compute the diagonal of the image slice,
 * including spacing.
 * @param spacing
 * @param sliceMode
 * @param renderer
 * @param bounds
 * @returns {number}
 */
function computeImageDiagonal(spacing,sliceMode,renderer,bounds){

    return computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,true);
}

/**
 * computeDiagonalForSlice: compute the diagonal for the slice as renderered.
 * @param sliceMode
 * @param spacing
 * @param renderer
 * @param bounds
 * @param imageMode
 * @returns {*}
 */
function computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,imageMode){
    let diag;
    let xMin = bounds[0];
    let xMax =  bounds[1];
    let yMin = bounds[2];
    let yMax =  bounds[3];
    let zMin = bounds[4];
    let zMax = bounds[5];
    if (imageMode){
        xMin *= spacing[0];
        yMin *= spacing[1];
        zMin *= spacing[2];
        xMax *= spacing[0];
        yMax *= spacing[1];
        zMax *= spacing[2];
    }
    switch (sliceMode){
        case vtkImageMapper.SlicingMode.Z:
            diag = _computeDiagonal(xMin,xMax,yMin,yMax,0,0,renderer,imageMode);
            break;
        case vtkImageMapper.SlicingMode.Y:
            diag = _computeDiagonal(xMin,xMax,0,0,zMin,zMax,renderer,imageMode);
            break;
        case vtkImageMapper.SlicingMode.X:
            diag = _computeDiagonal(0,0,yMin,yMax,zMin,zMax,renderer,imageMode);
            break;
    }
    return diag;
}


/**
 * _computeDiagonal: Uses vtkCoordinate for renderered image, otherwise
 * simple image coordinates (including spacing).
 * @param hMin
 * @param hMax
 * @param vMin
 * @param vMax
 * @param dMin
 * @param dMax
 * @param renderer
 * @param imageMode
 * @returns {number}
 * @private
 */
function _computeDiagonal(hMin,hMax,vMin,vMax,dMin,dMax,renderer,imageMode){
    let valueA = [];
    let valueB = [];

    if (!imageMode){
        let coord = vtkCoordinate.newInstance();
        coord.setValue([hMin,vMin,dMin]);
        valueA = coord.getComputedViewportValue(renderer);
        coord.setValue([hMax,vMax,dMax]);
        valueB = coord.getComputedViewportValue(renderer);
        valueA.push(0);
        valueB.push(0);

    }
    else {
        valueA = [hMin,vMin,dMin];
        valueB = [hMax,vMax,dMax];
    }

    const hSquared = (valueB[0] - valueA[0]) * (valueB[0] - valueA[0]);
    const vSquared = (valueB[1] - valueA[1]) * (valueB[1] - valueA[1]);
    const dSquared = (valueB[2] - valueA[2]) * (valueB[2] - valueA[2]);
    return Math.sqrt(hSquared + vSquared + dSquared);
}
