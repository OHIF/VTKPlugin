import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

const { OHIFPlugin } = OHIF.plugins;

const plugin = {
    name: "VolumeRenderingPlugin",
    url: "http://localhost:8000/volumeRendering/main.js",
    allowCaching: false,
    moduleURLs: [
        "http://localhost:8000/lib/index.js",
    ],
    scriptURLs: [
        'https://unpkg.com/vtk.js',
    ]
};

Meteor.startup(() => {
    OHIFPlugin.reloadPlugin(plugin);

    OHIF.commands.register('viewer', `reload-${plugin.name}`, {
        name: `plugin-${plugin.name}`,
        action: () => {
            const viewportIndex = Session.get('activeViewport');

            OHIF.plugins[plugin.name].setViewportToPlugin(viewportIndex);
        }
    });
});
