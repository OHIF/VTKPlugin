# OHIF VTK Plugin

OHIF Plugin for [The Visualization Toolkit (VTK)](https://github.com/Kitware/vtk-js) 

1. Load the OHIF Viewer on a study
2. Paste the following into your JavaScript console to define the plugin and load the scripts.

````javascript
var plugin = {
    name: "VolumeRenderingPlugin",
    url: "https://cdn.rawgit.com/OHIF/VTKPlugin/master/volumeRendering/main.js",
    allowCaching: false,
    moduleURLs: [
    	"https://cdn.rawgit.com/OHIF/VTKPlugin/master/lib/index.js",
    ],
    scriptURLs: [
        'https://unpkg.com/vtk.js',
    ]
};
OHIF.plugins.OHIFPlugin.reloadPlugin(plugin);
````

3. Switch a viewport to use the plugin by specifying its viewport index:

````javascript
OHIF.plugins.VolumeRenderingPlugin.setViewportToPlugin(0)
````