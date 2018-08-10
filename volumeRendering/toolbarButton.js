var { ToolbarPlugin } = OHIF.plugins;

OHIF.commands.register('viewer', `reload-VolumeRenderingPlugin`, {
    name: `plugin-VolumeRenderingPlugin`,
    action: () => {
        const viewportIndex = Session.get('activeViewport');

        OHIF.plugins["VolumeRenderingPlugin"].setViewportToPlugin(viewportIndex);
    }
});

var VRToolbarButton = class VRToolbarButton extends ToolbarPlugin {
    constructor(options = {}) {
        super("VRToolbarButton");
    }

    hasTools() {
        return [{
            id: 'reload-VolumeRenderingPlugin',
            title: 'Volume Rendering',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-road', // TODO: Find a better icon
        }]
    }
}

OHIF.plugins.entryPoints['VRToolbarButton'] = function() {
    const vrButton = new VRToolbarButton();
}
