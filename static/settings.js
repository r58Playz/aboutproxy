class Settings {
    constructor(browser) {
        this.browser = browser;
        this.defaults = {
            currentProxyId: "UV",
            searchEngineUrl: "https://www.google.com/search?q=",
            startUrl: this.browser.resourcesProtocol + "start",
            installedExtensions: "[]",
            disabledExtensions: "[]",
            themeId: "bdddhkcpnpcaggeblinmcffckoihfdia"
        };
        this.settings = JSON.parse(localStorage.getItem("settings"));
        if(this.settings == null) this.settings = {};
    }

    getSetting(setting) {
        var value = this.settings[setting];
        if(value != null) {
            return value;
        }
        return this.defaults[setting];
    }

    setSetting(setting, value) {
        this.settings[setting] = value;
        this.saveSettings();
    }

    resetSetting(setting) {
        delete this.settings[setting]
        this.saveSettings();
    }

    reset() {
        this.settings = {};
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem("settings", JSON.stringify(this.settings));
    }
}

