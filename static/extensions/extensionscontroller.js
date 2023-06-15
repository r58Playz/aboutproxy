class ExtensionsController {
  constructor(browser) {
    this.browser = browser;
    this.extensions = {}; //id: Extension
  }

  async setup() {
    // i realize that now i could have just done this for ExtensionResources but it's fine
    this.resources = await ExtensionResources.new();

    let enabledThemeId = this.browser.settings.getSetting("themeId");
    let disabledExtensions = JSON.parse(this.browser.settings.getSetting("disabledExtensions"));

    for (const id of JSON.parse(this.browser.settings.getSetting("installedExtensions"))) {
      let ext = new Extension(this);
      await ext.readFromFilerFs(id);
      ext.init();
      this.extensions[id] = ext;
      if(ext.type === "theme") {
        if(id !== enabledThemeId) ext.enabled = false;
        continue;
      }
      if(disabledExtensions.includes(id)) ext.enabled = false;
    }
  }

  async installFromCrxBlob(blob) {
    let ext = new Extension(this);
    const id = await ext.readFromCrxBlob(blob);
    ext.init();
    this.extensions[id] = ext;

    let installedArray = JSON.parse(this.browser.settings.getSetting("installedExtensions"));
    installedArray.push(id);
    this.browser.settings.setSetting("installedExtensions", JSON.stringify(installedArray));
  }

  setExtensionEnabled(id, enabled) {
    if(!enabled && this.extensions[id].enabled) {
      let disabledExtensions = JSON.parse(this.browser.settings.getSetting("disabledExtensions"));
      disabledExtensions.push(id);
      this.browser.settings.setSetting("disabledExtensions", JSON.stringify(disabledExtensions));
    } else if(enabled && !this.extensions[id].enabled) {
      let disabledExtensions = JSON.parse(this.browser.settings.getSetting("disabledExtensions"));
      disabledExtensions.splice(disabledExtensions.indexOf(id), 1);
      this.browser.settings.setSetting("disabledExtensions", JSON.stringify(disabledExtensions));
    }
    this.extensions[id].enabled = enabled;
  }

  uninstallExtension(id) {
    if(!this.extensions[id].enabled) {
      let disabledExtensions = JSON.parse(this.browser.settings.getSetting("disabledExtensions"));
      disabledExtensions.splice(disabledExtensions.indexOf(id), 1);
      this.browser.settings.setSetting("disabledExtensions", JSON.stringify(disabledExtensions));
    }
    delete this.extensions[id];
  }

  applyTheme() {
    for(const ext of Object.values(this.extensions)) {
      if(ext.type === "theme" && ext.enabled) {
        ext.applyTheme();
      }
    }
  }

  injectIntoFrame(iframe, url) {
    for(const ext of Object.values(this.extensions)) {
      if(ext.type === "theme" && ext.enabled) {
        ext.applyThemeToFrame(iframe, url === this.browser.settings.getSetting("startUrl"));
      }
    }
  }
}
