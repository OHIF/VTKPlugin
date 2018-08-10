var { ToolbarPlugin } = OHIF.plugins;

OHIF.commands.register('viewer', `reload-${plugin.name}-L`, {
    name: `plugin-${plugin.name}`,
    action: () => {
        const viewportIndex = Session.get('activeViewport');

        OHIF.viewerbase.layoutManager.viewportData[viewportIndex].pluginData = {
            viewDirection: 'L'
        };

        OHIF.plugins[plugin.name].setViewportToPlugin(viewportIndex);
    }
});

OHIF.commands.register('viewer', `reload-${plugin.name}-A`, {
    name: `plugin-${plugin.name}`,
    action: () => {
        const viewportIndex = Session.get('activeViewport');

        OHIF.viewerbase.layoutManager.viewportData[viewportIndex].pluginData = {
            viewDirection: 'A'
        };

        OHIF.plugins[plugin.name].setViewportToPlugin(viewportIndex);
    }
});

OHIF.commands.register('viewer', `reload-${plugin.name}-S`, {
    name: `plugin-${plugin.name}`,
    action: () => {
        const viewportIndex = Session.get('activeViewport');

        OHIF.viewerbase.layoutManager.viewportData[viewportIndex].pluginData = {
            viewDirection: 'S'
        };

        OHIF.plugins[plugin.name].setViewportToPlugin(viewportIndex);
    }
});

var MPRToolbarButton = class MPRToolbarButton extends ToolbarPlugin {
    constructor(options = {}) {
        super("MPRToolbarButton");
    }

    hasTools() {
        return [{
            id: 'reload-MultiplanarReformattingPlugin-L',
            title: 'MPR-L',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-bookmark',
        }, {
            id: 'reload-MultiplanarReformattingPlugin-A',
            title: 'MPR-A',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-bookmark',
        }, {
            id: 'reload-MultiplanarReformattingPlugin-S',
            title: 'MPR-S',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-bookmark',
        }];
    }
}
