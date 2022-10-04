var omnibox = document.querySelector("#omnibox");
omnibox.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        console.debug("user pressed enter on omnibox");
        if (omnibox.value === "") return;
        sendMessage({ type: "setUrl", value: omnibox.value });
    }
});

function openVerHistory() {
    sendMessage({ type: "setUrl", value: "aboutbrowser://versionHistory" });
}