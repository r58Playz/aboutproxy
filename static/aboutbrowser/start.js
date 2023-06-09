var omnibox = document.querySelector("#omnibox");
omnibox.addEventListener("keydown", function(e) {
    if (e.code === "Enter") {
        console.debug("user pressed enter on omnibox");
        if (omnibox.value === "") return;
        sendMessage({
            type: "setUrl",
            value: omnibox.value
        });
    }
});

function openVerHistory() {
    sendMessage({
        type: "setUrl",
        value: "aboutbrowser://versionHistory"
    });
}

function historyDomainViewCountsCallback(msg) {
    var domainViewCounts = msg.data;
    var topSix = domainViewCounts.slice(0, 6);
    for(const site of topSix) {
        var siteData = JSON.parse(site[0]);
        var el = document.createElement('div');
        el.className = "recent";
        var imgWrapperEl = document.createElement('div');
        imgWrapperEl.className = "recentIconWrapper";
        var imgEl = document.createElement('img');
        imgEl.src = siteData['icon'];
        imgWrapperEl.appendChild(imgEl);
        el.appendChild(imgWrapperEl);
        var titleEl = document.createElement('span');
        titleEl.innerHTML = siteData['title']; // i was gonna use innerText but let's allow an html injection for "funsies"
        el.appendChild(titleEl);
        document.querySelector('#recents').appendChild(el);
    }
}

sendMessage({ type: "getHistoryDomainViewCounts" });
