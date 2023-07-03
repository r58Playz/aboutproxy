class PluginDummy {
  constructor() {}
  inject() {}
}

class Plugin {
  constructor(extension, manifest) {
    this.extension = extension;
    this.manifest = manifest;
  }

  async inject() {
    const contents = await this.extension.resources.fs.stat('/'+this.extension.id+'/'+this.manifest["aboutbrowserPluginScript"]);
    document.createElement("script");
    script.innerText = contents;
    script.setAttribute("data-aboutbrowser-ext-id", this.extension.id);
    document.body.appendChild(script);
  }
}
