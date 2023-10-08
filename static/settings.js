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
        // dynamic does NOT like iframes and... yeah
        if(this.getSetting("currentProxyId") === "Dynamic") this.resetSetting("currentProxyId");
        this.settingsMetadata = [
            {
                id: "currentProxyId",
                name: "Proxy backend to use",
                type: "dropdown",
                values: [
                    ["UV", "Ultraviolet"]
                ]
            },
            {
                id: "searchEngineUrl",
                name: "Search engine URL",
                type: "text"
            },
            {
                id: "startUrl",
                name: "New Tab URL",
                type: "text"
            }
        ];
    }

    getSettingsMetadataValues() {
        return Object.fromEntries(this.settingsMetadata.map(setting=>[setting.id, this.getSetting(setting.id)]));
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

