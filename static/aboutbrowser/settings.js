var startUrlInput, startUrlStatus;
var searchEngineUrlInput, searchEngineUrlStatus;
var proxyInput, proxyStatus;

function init() {
    var startUrlSetting = document.querySelector("settings setting#startUrl");
    startUrlInput = startUrlSetting.querySelector("input");
    startUrlStatus = startUrlSetting.querySelector("settingStatus");
    startUrlInput.addEventListener("input", () => {
        console.debug("startUrl value = " + startUrlInput.value)
        if (startUrlInput.value == "") {
            return;
        }
        sendMessage({
            type: "setSetting",
            setting: "startUrl",
            value: startUrlInput.value
        });
    })

    var searchEngineUrlSetting = document.querySelector("settings setting#searchEngineUrl");
    searchEngineUrlInput = searchEngineUrlSetting.querySelector("input");
    searchEngineUrlStatus = searchEngineUrlSetting.querySelector("settingStatus");
    searchEngineUrlInput.addEventListener("input", () => {
        console.debug("searchEngineUrl value = " + searchEngineUrlInput.value)
        if (searchEngineUrlInput.value == "") {
            return;
        }
        sendMessage({
            type: "setSetting",
            setting: "searchEngineUrl",
            value: searchEngineUrlInput.value
        });
    })

    var proxySetting = document.querySelector("settings setting#proxy");
    proxyInput = proxySetting.querySelector("#proxyselector");
    proxyStatus = proxySetting.querySelector("settingStatus");
    proxyInput.addEventListener("change", () => {
        console.debug("proxy value = " + proxyInput.value);
        sendMessage({
            type: "setSetting",
            setting: "currentProxyId",
            value: proxyInput.value
        });
    })

    getAllSettings();
}

function getAllSettings() {
    sendMessage({
        type: "getSetting",
        setting: "startUrl"
    });
    sendMessage({
        type: "getSetting",
        setting: "searchEngineUrl"
    });
    sendMessage({
        type: "getSetting",
        setting: "currentProxyId"
    });
}

function resetAllSettings() {
    console.debug("resetting all settings...");
    sendMessage({
        type: "resetSettings"
    });
    setTimeout(() => {
        getAllSettings();
    }, 100);
}

function settingSetCallback(msg) {
    if (msg.setting == "startUrl") {
        startUrlStatus.innerText = "Saved!";
        setTimeout(() => {
            startUrlStatus.innerText = "";
        }, 1000)
    } else if (msg.setting == "searchEngineUrl") {
        searchEngineUrlStatus.innerText = "Saved!";
        setTimeout(() => {
            searchEngineUrlStatus.innerText = "";
        }, 1000)
    } else if (msg.setting == "currentProxyId") {
        proxyStatus.innerText = "Saved!";
        setTimeout(() => {
            proxyStatus.innerText = "";
        }, 1000)
    }
}

function settingValueCallback(msg) {
    if (msg.setting == "startUrl") {
        startUrlInput.value = msg.value;
    } else if (msg.setting == "searchEngineUrl") {
        searchEngineUrlInput.value = msg.value;
    } else if (msg.setting == "currentProxyId") {
        proxyInput.value = msg.value;
    }
}
