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
    for(const site in topSix) {
        var siteData = JSON.parse(topSix[site][0]);
        var el = document.createElement('div');
        el.className = "recent";
        el.setAttribute("data-url", siteData.url); // for some reason just directly using siteData.url doesn't work properly
        el.addEventListener('click', (event) => {sendMessage({type: "setUrl", value: event.currentTarget.getAttribute("data-url")})});
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
