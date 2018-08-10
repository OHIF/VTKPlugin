var { ToolbarPlugin } = OHIF.plugins;

OHIF.commands.register('viewer', `mprMode`, {
    name: 'mprMode',
    action: () => {
        const { VTKUtils } = window;
        const viewportIndex = Session.get('activeViewport');
        const { layoutManager }  = OHIF.viewerbase;
        const currentViewportData = layoutManager.viewportData[viewportIndex];

        VTKUtils.switchToMPRMode(currentViewportData);
    }
});

var MPRModeToolbarButton = class MPRModeToolbarButton extends ToolbarPlugin {
    constructor() {
        super("MPRModeToolbarButton");
    }

    hasTools() {
        return [{
            id: 'mprMode',
            title: '4-up',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-compress',
        }];
    }
}


OHIF.plugins.entryPoints['MPRModeToolbarButton'] = function() {
    const mprButton = new MPRModeToolbarButton();
}
