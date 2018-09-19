export function switchToMPRMode(currentViewportData) {
    const { layoutManager }  = OHIF.viewerbase;

    layoutManager.layoutProps = {
        rows: 2,
        columns: 2
    };

    layoutManager.viewportData[0] = Object.assign({}, currentViewportData);
    layoutManager.viewportData[0].plugin = 'MultiplanarReformattingPlugin';
    layoutManager.viewportData[0].pluginData = {
        viewDirection: 'A',
        renderCallback: null,
    };

    layoutManager.viewportData[1] = Object.assign({}, currentViewportData);
    layoutManager.viewportData[1].plugin = 'MultiplanarReformattingPlugin';
    layoutManager.viewportData[1].pluginData = {
        viewDirection: 'L',
        renderCallback: null,
    };

    layoutManager.viewportData[2] = Object.assign({}, currentViewportData);
    layoutManager.viewportData[2].plugin = 'MultiplanarReformattingPlugin';
    layoutManager.viewportData[2].pluginData = {
        viewDirection: 'S',
        renderCallback: null,
    };

    layoutManager.viewportData[3] = Object.assign({}, currentViewportData);
    layoutManager.viewportData[3].plugin = 'VolumeRenderingPlugin';
    layoutManager.viewportData[3].pluginData = {
        viewDirection: 'N',
        renderCallback: null,
    };
    layoutManager.updateViewports();
}
