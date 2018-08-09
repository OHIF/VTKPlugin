import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
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
});
