# OHIF VTK Plugin

## Usage
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

## Development

1. Create a copy of the OHIF Standalone Viewer Meteor app (i.e. not built into a static site yet)

  ````bash
  ./setupDevSite.sh
  ````

2. Install an HTTP server which supports CORS:

  ````bash
  # If you get some EACCESS errors, use sudo.
  npm install http-server -g
  ````

3. Start the HTTP server with CORS enabled

  - You will see some logs in your console whenever requests reach your server at http://localhost:8000
  - This serves the plugin directory itself, so any changes you make to the plugin are instantly available.

  ````bash
  http-server -p 8000 --cors
  ````

4. Open another terminal tab and start the Standalone Viewer.

  ````bash
  ./startDevSite.sh
  ````

  - This version of the StandaloneViewer has some scripts copied into it which enable the MultiplanarReformatting and VolumeRendering plugins by default.
  - **Note**: If you change anything in these scripts, you will need to run `setupDevSite.sh` again.

5. Test the installation by loading one of the following URLs:

  - [PTCTStudy](http://localhost:3000/?url=https://s3.eu-central-1.amazonaws.com/ohif-viewer/JSON/PTCTStudy.json)
  - [CTStudy](http://localhost:3000/?url=https://s3.eu-central-1.amazonaws.com/ohif-viewer/JSON/CTStudy.json)
  - [MRStudy](http://localhost:3000/?url=https://s3.eu-central-1.amazonaws.com/ohif-viewer/JSON/MRStudy.json)
