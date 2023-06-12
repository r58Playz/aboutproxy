SITE_TEMPLATE = '<div class="historyRow"><img class="siteIcon"></img><div class="siteTitle"><span></span></div><div class="siteUrl"><span></span></div><div class="siteButtons"><button class="themedBtn" id="deleteBtn"><span class="material-symbols-outlined">delete</span></button></div></div>'

var historyTable = document.querySelector("#historyTable");
var localStorageData = JSON.parse(localStorage.getItem("history"));

currentlySelectedSite = null;

function onClickSite(event) {
    el = event.currentTarget;
    if (currentlySelectedSite) {
        currentlySelectedSite.classList.remove("selected");
    }
    currentlySelectedSite = el;
    el.classList.add("selected");
}

function init() {
    localStorageData.history.reverse().forEach(function(site, i) {
        addSite(site.title, site.url, site.icon, i)
    });
    setInterval(reloadHistory, 10000);
}

function save() {
    localStorage.setItem("history", JSON.stringify(localStorageData));
}

function addSite(title, url, favicon, i) {
    el = htmlToElement(SITE_TEMPLATE);
    el.setAttribute("data-index", i);
    el.querySelector(".siteTitle > span").innerText = title;
    el.querySelector(".siteUrl > span").innerText = url;
    el.querySelector("#deleteBtn").onclick = deleteSite;
    el.querySelector("img").setAttribute("src", favicon);
    el.onclick = onClickSite;
    historyTable.appendChild(el);
}

function deleteSite(event) {
    el = event.currentTarget.parentElement.parentElement;
    index = el.getAttribute("data-index");
    localStorageData.history.splice(index, 1);
    save();
    sendMessage({
        type: "reloadHistory"
    });
    reloadHistory();
}

function clearHistory() {
    localStorageData = null;
    save();
    sendMessage({
        type: "reloadHistory"
    });
    setTimeout(reloadHistory, 500); // wait for browser to repopulate and save history
}

function reloadHistory() {
    localStorageData = JSON.parse(localStorage.getItem("history"));
    historyTable.innerHTML = '';
    init();
}

function reloadHistoryCallback() {
    reloadHistory();
}
