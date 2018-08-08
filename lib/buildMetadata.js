export function buildMetadata(displaySet) {
    // Retrieve the Cornerstone imageIds from the display set
    // TODO: In future, we want to get the metadata independently from Cornerstone
    const imageIds = displaySet.images.map(image => image.getImageId());

    // Compute the image size and spacing given the meta data we already have available.
    const metaDataMap = new Map;
    imageIds.forEach(imageId => {
        // TODO: Retrieve this from somewhere other than Cornerstone
        const metaData = cornerstone.metaData.get('imagePlane', imageId);
        metaDataMap.set(imageId, metaData);
    })

    return {
        metaData0: metaDataMap.values().next().value,
        metaDataMap,
        imageIds
    }
}
