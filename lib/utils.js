function sum(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function mean(array) {
    return sum(array) / array.length;
}

function diff(array) {
    let resultArray = [];
    for (let i = 1; i < array.length; i++) {
        resultArray.push(array[i] - array[i - 1]);
    }
    return resultArray;
}

// eps is up to you to determine based on your application.
function realsApproximatelyEqual(a,b,eps = 0.00001){
    return Math.abs(a-b) < eps;
}

function compareReals(a,b,cmp) {
    let eq = realsApproximatelyEqual(a,b);
    if (eq == true)
        return 0;

    if (a < b) {
        return -1;
    }
    return 1;
}

function bsearch(array, value, cmp){
    let low = 0;
    let high = array.length - 1;

    while(low <= high){
        let mid = low + (((high - low) / 2) | 0); // avoid overflow when low + high > max for type
        cmpResult = cmp(array[mid],value);
        if (cmpResult < 0){
            low = mid + 1;
        }
        else if (cmpResult > 0){
            high = mid - 1;
        } else {
            return mid;
        }
    }
    return undefined;
}


function copyVector(v) {
    return new cornerstoneMath.Vector3(v.x,v.y,v.z);
}



// Based on David Clunie's various postings
// on the dicom google groupd.
function determineOrientation(v) {
    let axis = undefined;
    const oX = v.x < 0 ? 'R' : 'L';
    const oY = v.y < 0 ? 'A' : 'P';
    const oZ = v.z < 0 ? 'I' : 'S';

    const aX = Math.abs(v.x);
    const aY = Math.abs(v.y);
    const aZ = Math.abs(v.z);
    const obliqueThreshold = 0.8;
    if (aX > obliqueThreshold && aX > aY && aX > aZ) {
        axis = oX;
    } else if (aY > obliqueThreshold && aY > aX && aY > aZ) {
        axis = oY;
    }  else if (aZ > obliqueThreshold && aZ > aX && aZ > aY) {
        axis = oZ;
    }

    this.orientation = axis;
    return axis;
}

// given the text orientation, determine the index (0,1,2)
// of the z axis
function determineOrientationIndex(orientation) {
    var o = orientation;
    var index = undefined;
    switch (o) {
        case 'A':
        case 'P':
            index = 1;
            break;
        case 'L':
        case 'R':
            index = 0;
            break;
        case 'S':
        case 'I':
            index = 2;
            break;
        default:
            console.assert(false, " OBLIQUE NOT SUPPORTED");
            break;
    }
    return index;
}

// Given the orientation, determine the coordinates of the z axis
// i.e. the z axis per the DICOM xray or other device relative to the
// patient. Also, determine the average spacing along that axis, and
// return the index (0,1,2) of the z axis.
function computeZAxis(orientation, metaData) {
    var ippArray = [];
    let index = determineOrientationIndex(orientation);

    for (var value of metaData.values()) {
        let ipp = value.imagePositionPatient;
        if (index === 0) {
            ippArray.push(ipp.x);
        } else if (index === 1) {
            ippArray.push(ipp.y);
        } else {
            ippArray.push(ipp.z);
        }
    }

    ippArray.sort(function (a, b) {
        return a - b;
    });
    let meanSpacing = mean(diff(ippArray));

    var obj = {
        spacing: meanSpacing,
        positions: ippArray,
        xyzIndex: index
    }
    return obj;
}

function getSliceIndex(zAxis, imagePositionPatient) {
    const { x, y, z } = imagePositionPatient;

    let sliceIndex = 0;
    if (zAxis.xyzIndex == 0) {
        sliceIndex = bsearch(zAxis.positions, x, compareReals);
    } else if (zAxis.xyzIndex == 1) {
        sliceIndex = bsearch(zAxis.positions, y, compareReals);
    } else {
        sliceIndex = bsearch(zAxis.positions, z, compareReals);
    }

    return sliceIndex;
}

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}
