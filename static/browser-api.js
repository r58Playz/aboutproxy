function sendMessage(msg, to) {
    to.postMessage(msg, window.origin);
}

window.addEventListener("message", (event) => {
    if (event.origin != window.origin) {
        console.error("get rekt malware");
    }
    let msg = event.data;
    let sender = event.source;
    if (msg.type === "setSetting") {
        console.debug("recieved setSetting for setting " + msg.setting + " and value " + msg.value);
        // add checks? maybe?
        window.aboutbrowser.settings.setSetting(msg.setting, msg.value);
        sendMessage({type: "settingSet", setting: msg.setting, errcode: 0}, sender);
    } else if (msg.type === "getSetting") {
        console.debug("recieved getSetting for setting " + msg.setting);
        sendMessage({type: "settingValue", setting: msg.setting, value: window.aboutbrowser.settings.getSetting(msg.setting), errcode: 0}, sender);
    } else if (msg.type === "resetSettings") {
        console.debug("recieved resetSettings");
        window.aboutbrowser.settings.reset();
    } else if (msg.type === "openUrl") {
        console.debug("recieved openUrl for url " + msg.value);
        window.aboutbrowser.openTab(msg.value);
    } else if (msg.type === "setUrl") {
        console.debug("recieved setUrl for url " + msg.value);
        window.aboutbrowser.navigateTo(msg.value);
    } else if (msg.type === "reloadBookmarks") {
        console.debug("recieved reloadBookmarks");
        window.aboutbrowser.bookmarks.reload();
    } else if (msg.type === "reloadHistory") {
        console.debug("recieved reloadHistory");
        window.aboutbrowser.history.reload();
    } else if (msg.type === "getHistoryDomainViewCounts") {
        console.debug("recieved getHistoryDomainViewCounts");
        sendMessage({ type: "historyDomainViewCounts", data: window.aboutbrowser.history.getSortedDomainViewCounts() }, sender);
    } else if (msg.type === "getExtensions") {
        console.debug("recieved getExtensions");
        sendMessage({ type: "extensionList", data: JSON.stringify(window.aboutbrowser.extensions.getExtensionMetadata()) }, sender);
    } else if (msg.type === "importExtensionCrx") {
        console.debug("recieved importExtensionCrx");
        (async ()=>{
            await window.aboutbrowser.extensions.installFromCrxBlob(await fetch(msg.base64).then(r=>r.blob()));
            sendMessage({ type: "reloadExtensions" }, sender);
        })();
    } else if (msg.type === "importExtensionZip") {
        console.debug("recieved importExtensionZip");
        (async ()=>{
            await window.aboutbrowser.extensions.installFromUnpackedZipBlob(await fetch(msg.base64).then(r=>r.blob()), msg.name);
            sendMessage({ type: "reloadExtensions" }, sender);
        })();
    } else if (msg.type === "removeExtension") {
        console.debug("recieved removeExtension");
        (async ()=>{
            await window.aboutbrowser.extensions.uninstallExtension(msg.id);
            sendMessage({ type: "reloadExtensions" }, sender);
        })();
    } else if (msg.type === "setExtensionEnabled") {
        console.debug("recieved setExtensionEnabled");
        window.aboutbrowser.extensions.setExtensionEnabled(msg.id, msg.enabled);
        sendMessage({ type: "reloadExtensions" }, sender);
    } else if (msg.type === "setCurrentTheme") {
        console.debug("recieved setCurrentTheme")
        const id = msg.id == "default" ? window.aboutbrowser.extensions.internalThemeId : msg.id;
        window.aboutbrowser.extensions.setCurrentTheme(id);
        sendMessage({ type: "reloadExtensions" }, sender);
    } else if (msg.type === "getBranding") {
        console.debug("recieved getBranding");
        sendMessage({ type: "branding", branding: window.aboutbrowser.branding }, sender);
    } else if (msg.type === "getSettingsMetadata") {
        console.debug("recieved getSettingsMetadata");
        sendMessage({ type: "settingsMetadata", metadata: window.aboutbrowser.settings.settingsMetadata, values: window.aboutbrowser.settings.getSettingsMetadataValues() }, sender);
    }
})
