// todo private methods+variables maybe?

class ElementMap {
    constructor() {
        this.internalList = [];
    }

    set(key, value) {
        this.internalList.push({ key: key, value: value });
    }

    get(key) {
        for (const pair of this.internalList) {
            console.log(pair, key)
            if(key.isSameNode(pair.key)) {
                return pair.value;
            }
        }
        return undefined;
    }

    remove(key) {
        for (var i=0; i<this.internalList.length; i++) {
            if(this.internalList[i].key.isSameNode(key)) {
                delete this.internalList[i]; // may not be necessary but ok
                this.internalList.splice(i, 1);
                return;
            }
        }
    }

    // alias
    delete(key) {
        this.remove(key);
    }
}

class Tab {
    constructor(browser, background = false) {
        this.browser = browser;

        this.tabEl = this.browser.chromeTabs.addTab({}, {background: true});
        this.browser.tabs.set(this.tabEl, this);
        
        this.iframe = document.createElement("iframe");
        this.iframe.classList.add("browserTabContents");
        this.iframe.style.setProperty("display", "none");
        var self = this;
        this.iframe.onload = () => { self.handleOnload() };
        this.browser.iFrameContainer.appendChild(this.iframe);

        this.currentUrl = '';
        this.currentTitle = '';
        this.currentFavi = '';
        this.isActive = false;

        if(!background) this.browser.chromeTabs.setCurrentTab(this.tabEl);
    }

    handleOnload() {
        var url = this.iframe.contentWindow.location.toString();
        if (url == "about:blank") {
            return;
        }
        if (url.startsWith(this.browser.aboutBrowserPrefix)) {
            url = url.replace(this.browser.aboutBrowserPrefix, '');
            url = url.substring(0, url.length - 5);
            url = "aboutbrowser://" + url;
        } else {
            url = url.replace(window.location.protocol + "//" + window.location.host + baseUrlFor(this.browser.settings.getSetting("currentProxyId")), '')
            url = decodeUrl(url, this.browser.settings.getSetting("currentProxyId"));
        }
        this.currentUrl = url;

        // get title of iframe
        var title = this.iframe.contentWindow.document.title;
        if (title == "") {
            title = url;
        }
        this.currentTitle = title;

        this.iframe.contentWindow.document.querySelectorAll("a").forEach((e) => {
            e.removeAttribute("target");
        });

        if(this.isActive) this.setBrowserAttributes();

        var self = this;
        (async (url) => {
            // get favicon of iframe
            var favi = null;
            if(url.startsWith("aboutbrowser://")) {
                favi = getIconNoFallback(self.iframe.contentWindow.document);
            } else if (url != "") {
                var faviUrl = getIcon(self.iframe.contentWindow.document, new URL(url));
                var blob = await fetch(baseUrlFor("UV") + encodeUrl(faviUrl, "UV")).then((r) => r.blob())
                if (blob != null) {
                    favi = faviUrl;
                }
            }

            console.debug("got favi: ", favi);

            if (favi == null) {
                console.warn("falling back to default icon");
                favi = "/aboutbrowser/darkfavi.png";
            }

            this.browser.history.push(url, title, favi);
            this.currentFavi = favi;

            // update tab
            self.browser.chromeTabs.updateTab(self.tabEl, {
                favicon: favi,
                title: title
            });
        })(url);
    }

    handleSwitchAway() {
        this.iframe.style.setProperty("display", "none");
        this.isActive = false;
    }

    handleSwitchTo() {
        this.isActive = true;
        this.browser.activeTab = this;
        this.iframe.style.removeProperty("display");
        this.setBrowserAttributes();
    }

    handleHistoryBack() {
        this.iframe.contentWindow.history.back();
    }

    handleHistoryForward() {
        this.iframe.contentWindow.history.forward();
    }

    handleReload() {
        this.iframe.contentWindow.location.reload();
    }

    handleClose() {
        this.iframe.remove();
    }

    setBrowserAttributes() {
        this.browser.addressBar.value = this.currentUrl;
        this.browser.browserTitle = this.currentTitle + this.browser.titleSuffix;
        document.title = this.browser.browserTitle;
    }
    
    navigateTo(url, callback) {
        var self = this;
        if (url == "" || url.startsWith("aboutbrowser://")) {
            if (url == "") {
                url = this.browser.aboutBrowserPrefix + "blank.html";
            } else if (url.startsWith("aboutbrowser://")) {
                url = url.replace('aboutbrowser://', this.browser.aboutBrowserPrefix);
                url = url + ".html"
            }
            this.iframe.src = url;
            if(callback) callback();
        } else if (isUrl(url)) {
            if (hasHttps(url)) {
                proxyUsing(url, this.browser.settings.getSetting("currentProxyId"), (url) => {
                    self.iframe.src = url;
                    if(callback) callback();
                });
            } else {
                proxyUsing('https://' + url, this.browser.settings.getSetting("currentProxyId"), (url) => {
                    self.iframe.src = url;
                    if(callback) callback();
                })
            }
            return;
        } else {
            proxyUsing(this.settings.getSetting("searchEngineUrl") + url, this.browser.settings.getSetting("currentProxyId"), (url) => {
                self.iframe.src = url;
                if(callback) callback();
            });
        }
    }
}

class Settings {
    constructor() {
        this.defaults = {currentProxyId: "UV", searchEngineUrl: "https://www.google.com/search?q=", startUrl: "aboutbrowser://start"};
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

class History {
    constructor() {
        this.reload();
    }

    push(url, title, icon) {
        this.history.history.push({url: url, title: title, icon: icon});
        this.recalculateDomainViewCounts();
        this.save();
    }

    clear() {
        this.history.history = [];
        this.history.statistics.domainViewCounts = [];
        this.save();
    }

    save() {
        localStorage.setItem("history", JSON.stringify(this.history));
    }

    reload() {
        this.history = JSON.parse(localStorage.getItem("history"));
        if(this.history == null) this.history = {history: [], statistics: {domainViewCounts: {}}}; this.save();
    }

    getList() {
        return this.history.history;
    }

    recalculateDomainViewCounts() {
        var domainViewCounts = {};
        for(const site of this.history.history) {
            var sSite = JSON.stringify(site);
            if(domainViewCounts[sSite]) {
                domainViewCounts[sSite] += 1;
            } else {
                domainViewCounts[sSite] = 1;
            }
        }
        this.history.statistics.domainViewCounts = domainViewCounts;
        this.save();
    }

    getSortedDomainViewCounts() {
        return Object.entries(this.history.statistics.domainViewCounts).sort(([,a],[,b]) => b-a);
    }
}


class AboutBrowser {
    constructor() {
        this.bookmarks = new Bookmarks(document.querySelector(".bookmarksContainer"));
        this.bookmarks.load();

        this.addressBar = document.querySelector("#browserUrl");
        this.iFrameContainer = document.querySelector("#tabContents");

        this.history = new History();

        this.settings = new Settings();

        this.aboutBrowserPrefix = window.location.protocol + "//" + window.location.host + "/aboutbrowser/";

        this.titleSuffix = " - AboutBrowser";
        this.browserTite = "New Tab" + this.titleSuffix;
        document.title = this.browserTitle;

        this.activeIframe = null;


        this.chromeTabs = new ChromeTabs();
        var tabsEl = document.querySelector(".chrome-tabs");
        this.chromeTabs.init(tabsEl);
        tabsEl.classList.add("chrome-tabs-dark-theme");

        this.tabs = new ElementMap();

        var self = this;

        tabsEl.addEventListener("activeTabChange", (event) => {
            console.debug("Active tab changed: ", event.detail.active, event.detail.tabEl);
            self.switchTabs(event.detail);
        });

        tabsEl.addEventListener("tabAdd", (event) => {
            console.debug("Tab created: ", event.detail.tabEl);
            // we no longer handle this event since each `Tab` recieves its tabEl when calling the tab create function
        });

        tabsEl.addEventListener("tabRemove", (event) => {
            console.debug("Tab closed: ", event.detail.tabEl);
            self.closeTab(event.detail);
        });

        document.querySelector("button[data-add-tab]").addEventListener("click", () => {
            self.openTab();
        })

        this.openTab();

        this.addressBar.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                self.navigateTo(self.addressBar.value);
            }
        });

        this.settingsCtxMenu = document.querySelector(".settingsCtxMenu");
        this.settingsCtxMenu.addEventListener("mouseleave", (e) => {
            self.settingsCtxMenu.style.setProperty("display", "none");
        })

        window.addEventListener("bookmarkClicked", (event) => { self.navigateTo(event.detail.url) });

        // the best line of code in this codebase
        if (this.probeForChrome()) this.unfuckChrome();
    }

    probeForChrome() {
        // chrome is trash but firefox breaks proxies so :/
        var isChromium = window.chrome;
        var winNav = window.navigator;
        var vendorName = winNav.vendor;
        var isOpera = typeof window.opr !== "undefined";
        var isIEedge = winNav.userAgent.indexOf("Edg") > -1;
        var isIOSChrome = winNav.userAgent.match("CriOS");

        if (isIOSChrome) {
            return false;
        } else if (
            isChromium !== null &&
            typeof isChromium !== "undefined" &&
            vendorName === "Google Inc." &&
            isOpera === false &&
            isIEedge === false
        ) {
            return true;
        } else {
            return false;
        }
    }

    unfuckChrome() {
        console.error("stupid chrome is broken so i have to go unfuck it")
        var el = document.getElementById("browserSettings");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        el = document.getElementById("browserBack");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        el = document.getElementById("browserForward");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        el = document.getElementById("browserReload");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        el = document.getElementById("browserExtensions");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        el = document.getElementById("games");
        el.style.setProperty('width', this.getHeightOfElement(el) + 2 + 'px');
        console.error('unfucked chrome');
    }

    getHeightOfElement(element) {
        const cs = getComputedStyle(element);

        const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

        const borderY =
            parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

        return element.offsetHeight - paddingY - borderY;
    }


    propagateMessage(msg) {
        for (const tab of this.tabs.internalList) {
            tab.value.iframe.contentWindow.postMessage(msg);
        }
    }

    openTab(url) {
        if(!url) url = this.settings.getSetting("startUrl");
        var tab = new Tab(this);
        tab.navigateTo(url);
    }

    closeTab(detail) {
        var tabEl = detail.tabEl;
        this.tabs.get(tabEl).handleClose();
        this.tabs.delete(tabEl);
    }

    switchTabs(detail) {
        var oldTab = detail.active;
        var newTab = detail.tabEl;
        if(oldTab) this.tabs.get(oldTab).handleSwitchAway();
        this.tabs.get(newTab).handleSwitchTo(); 
    }

    navigateTo(url) {
        this.activeTab.navigateTo(url);
    }

    handleReload() {
        this.activeTab.handleReload();
    }

    handleSettings() {
        this.settingsCtxMenu.style.removeProperty("display");
    }

    handleSettingsCtxMenu(menuItem) {
        this.settingsCtxMenu.style.setProperty("display", "none");
        switch(menuItem) {
            case "newTab":
                this.openTab();
                break;
            case "history":
                this.openTab("aboutbrowser://history");
                break;
            case "downloads":
                this.openTab("aboutbrowser://downloads");
                break;
            case "bookmarks":
                this.openTab("aboutbrowser://bookmarks");
                break;
            case "settings":
                this.openTab("aboutbrowser://settings");
                break;
            case "about":
                this.openTab("aboutbrowser://versionHistory");
                break;
        }
    }

    handleBack() {
        this.activeTab.handleHistoryBack();
    }

    handleForward() {
        this.activeTab.handleHistoryForward();
    }

    handleBookmarks() {
        this.bookmarks.add(this.activeTab.currentTitle, this.activeTab.currentUrl, this.activeTab.currentFavi);
        this.bookmarks.save();
        this.propagateMessage({ type: "reloadBookmarks" });
    }

    handleExtensions() {
        this.openTab("aboutbrowser://extensions");
    }

    handleGames() {
        this.openTab("aboutbrowser://games/index");
    }
}

function init() {
    var aboutbrowser = new AboutBrowser();
    window.aboutbrowser = aboutbrowser;
}
