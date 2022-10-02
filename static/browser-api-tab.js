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
    }
})