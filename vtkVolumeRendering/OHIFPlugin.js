
class OHIFPlugin {
  // TODO: this class is here for development purposes.
  // Once it is fleshed out it would go in the OHIF
  // base deployment and be available for plugins
  // to inherit from.

  constructor () {
  }

  static loadScript(scriptURL) {
    const script = document.createElement("script");
    script.src = scriptURL;
    script.type = "text/javascript";
    script.async = false;
    const head = document.getElementsByTagName("head")[0];
    head.appendChild(script);
    head.removeChild(script);
    return (script)
  }

  static reloadPlugin(plugin) {
    plugin.scriptURLs = plugin.scriptURLs || {};
    plugin.scriptURLs.forEach(scriptURL => {
      this.loadScript(scriptURL).onload = function() {
        console.log(`loaded ${scriptURL}`);
      }
    });
    let scriptURL = plugin.url;
    if (!plugin.allowCaching) {
      scriptURL += "?" + performance.now();
    }
    this.loadScript(scriptURL).onload = function() {
      console.log(`loaded ${scriptURL}`);
      if (OHIFPlugin.entryPoints[plugin.name]) {
        OHIFPlugin.entryPoints[plugin.name]();
      }
    }
  }
}

OHIFPlugin.entryPoints = {};
