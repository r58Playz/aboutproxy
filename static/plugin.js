// nothing is loaded yet, we can only use localstorage
// the real aboutbrowser settings are in indexeddb

class AboutBrowserPlugins {
  constructor(injectNode) {
    this.injectNode = injectNode;
  }

  get installedPlugins() {
    return JSON.parse(window.localStorage["aboutbrowser-plugins-installed"] || "[]") || [];
  }

  set installedPlugins(newVal) {
    window.localStorage["aboutbrowser-plugins-installed"] = JSON.stringify(newVal || []);
  }

  get enabledPlugins() {
    return JSON.parse(window.localStorage["aboutbrowser-plugins-enabled"] || "[]") || [];
  }

  set enabledPlugins(newVal) {
    window.localStorage["aboutbrowser-plugins-enabled"] = JSON.stringify(newVal || []);
  }

  async init() {
    this.resources = await ExtensionResources.new();

    this.pluginMap = {};

    for(const id of this.installedPlugins) {
      let plugin = new Plugin(this.resources, this.injectNode);
      await plugin.readFromFilerFs(id);
      await plugin.init();
      if(enabledPlugins.indexOf(id) !== -1) plugin.enabled = true;
      this.pluginMap[id] = plugin;
    }
  }

  async inject() {
    for(const plugin of Object.values(this.pluginMap)) {
      await plugin.inject();
    }
  }
}

class Plugin {
  constructor(resources, injectNode) {
    this.resources = resources;
    this.enabled = false;
  }

  async init() {
    try {
      await this.resources.fs.readFile('/plugins/'+this.id+'/'+this.manifest["aboutbrowserPluginScript"]);
    } catch(err) {
      throw new Error("Failed to find plugin script at "+this.manifest["aboutbrowserPluginScript"]);
    }
  }

  async readFromFilerFs(id) {
    this.manifest = JSON.parse(await this.resources.fs.readFile("/"+id+"/manifest.json", 'utf8'));
    this.id = id;
  }

  async readFromUnpackedZipBlob(blob) {
    let buffer = Filer.Buffer.from(await blob.arrayBuffer());
    let fs = this.resources.fs;

    const id = await Extension.getIdFromUInt8Array(Filer.Buffer.from(name));

    await Extension.extractBuffer(buffer, fs, id);

    this.manifest = JSON.parse(await this.resources.fs.readFile("/"+id+"/manifest.json", 'utf8'));
    this.id = id;

    return id;
  }

  async inject() {
    if(!this.enabled) return;
    const contents = await this.resources.fs.readFile('/'+this.extension.id+'/'+this.manifest["aboutbrowserPluginScript"], 'utf8');
    document.createElement("script");
    script.innerText = `${contents}`;
    script.setAttribute("data-aboutbrowser-ext-id", this.extension.id);
    this.injectNode.appendChild(script);
  }
}
