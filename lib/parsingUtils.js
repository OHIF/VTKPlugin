/********************************************************************************
 Parsing Utilities
 ********************************************************************************/

// look ahead for the pattern =[xxx]
function lookAhead(input,stateInformation) {
    let totalLength = input.length;
    let state = stateInformation.state.currentState;
    let idx = stateInformation.currentIndex;
    var result = undefined;
    while (state === stateInformation.state.currentState && idx < totalLength){
        let c = input.charAt(idx);
        if (stateInformation.state.transitions[stateInformation.state.currentState].lookFor.has(c)){
            stateInformation.state.currentState = stateInformation.state.nextState;
            if (stateInformation.state.currentState != stateInformation.finalState){
                stateInformation.state.nextState++;
                stateInformation.currentIndex = idx;
                stateInformation.capturedInformation = c;
            }
            else{
                stateInformation.done = true;
            }
            result = stateInformation;

        } else {
            idx++;
        }
    }
    return result;
}

// look through the imageId, looking for the term
// "RequestedOrientation=[x], where x is one of A,P,I,S,L,R
// which is the requested orientation of the slice.
function parseOrientation(input) {
    const oc = "RequestedOrientation";

    let totalLength = input.length;
    var inputLC = input.toLowerCase();
    let idx = inputLC.indexOf(oc.toLowerCase());

    if (idx < 0){
        console.log("did not find corrent parameter in request.")
        console.assert(false);
        return undefined;
    }

    // Parsing states. look for =,then bracket, then desired character, then bracket to finish.
    var states = {
        currentState: 0,
        nextState: 1,
        transitions: [
            {
                lookFor: new Set(['='])
            },
            {
                lookFor: new Set(['['])
            },
            {
                lookFor: new Set(['a','p','i','s','l','r'])
            },
            {
                lookFor: new Set([']'])
            }
        ]
    }

    stateInformation = {
        currentIndex: idx += oc.length,
        state: states,
        capturedInformation: undefined,
        finalState: 4,
        done: false
    }

    while (stateInformation != undefined && stateInformation.done === false){
        stateInformation = lookAhead(inputLC,stateInformation);
    }

    if (stateInformation != undefined){
        console.log(stateInformation.capturedInformation);
    }

}

// The imageId must contain the following 2 terms:
// OrientationRequested=[A || P || L || R || I || S]
// Slice#=[0...NNNNNN]
// Slice number is limited range of 0-99999.
function parseImageId(imageId) {
    parseOrientation(test);
    return obj = {
        requestedOrientation: "A",
        sliceNumber: 0
    };
}


/*********************************************************************************/

function createImageObject(imageNumber) {
    switch(OHIFPlugin.MPRPlugin.orientation){
        case 'A':
        case 'P':
            break;
        case 'I':
        case 'S':
            break;
        case 'R':
        case 'L':
            break;
        default:
            console.assert((false));
            break;
    }
    return undefined;
}

function loadImage(imageId) {
    // Parse the imageId and return a usable URL (logic omitted)
    const imageNumber = parseImageId(imageId);

    // Create a new Promise
    const promise = new Promise((resolve, reject) => {

        const image = createImageObject(imageNumber);
        if (image !== undefined) {
            // Return the image object by resolving the Promise
            resolve(image);
        } else {
            // An error occurred, return an object containing the error by
            // rejecting the Promise
            reject(new Error("Unable to generate image"));
        }

    });
    // Return an object containing the Promise to cornerstone so it can setup callbacks to be
    // invoked asynchronously for the success/resolve and failure/reject scenarios.
    return {
        promise
    };
}
