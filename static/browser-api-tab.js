function sendMessage(msg) {
    window.parent.postMessage(msg, window.origin);
}

window.addEventListener("message", (event) => {
    if (event.origin != window.origin) {
        console.error("get rekt malware");
    }
    let msg = event.data;
    if (msg.type == "settingSet") {
        console.debug("recieved settingSet for " + msg.setting)
        settingSetCallback(msg);
    } else if (msg.type == "settingValue") {
        console.debug("recieved settingValue for " + msg.setting + " and value is " + msg.value)
        settingValueCallback(msg);
    } else if (msg.type == "reloadBookmarks") {
        console.debug("recieved reloadBookmarks");
        reloadBookmarksCallback(msg);
    } else if (msg.type == "historyDomainViewCounts") {
        console.debug("recieved historyDomainViewCounts - redacted because it may be giant");
        historyDomainViewCountsCallback(msg);
    }
})
