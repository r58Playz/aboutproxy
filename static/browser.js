// todo private methods+variables maybe?

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
        this.history = JSON.parse(localStorage.getItem("history"));
        if(this.history == null) this.history = {history: [], statistics: {domainViewCounts: []}};
    }

    push(url) {
        this.history.history.push(url);
        // recalculate domainViewCounts here
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

    getList() {
        return this.history.history;
    }

    getSortedDomainViewCounts() {
        // sort here
        return [];
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

        this.browserTitle = "New Tab - AboutBrowser";
        this.activeTabTitle = "New Tab";
        this.activeTabUrl = "aboutbrowser://blank";

        this.activeIframe = null;


        this.tabs = new ChromeTabs();
        var tabsEl = document.querySelector(".chrome-tabs");
        this.tabs.init(tabsEl);
        tabsEl.classList.add("chrome-tabs-dark-theme");

        this.tabContents = [];

        var self = this;

        tabsEl.addEventListener("activeTabChange", (event) => {
            console.debug("Active tab changed: ", event.detail.active, event.detail.tabEl);
            self.switchTabs(event.detail);
        });

        tabsEl.addEventListener("tabAdd", (event) => {
            console.debug("Tab created: ", event.detail.tabEl);
            self.createTab(event.detail); // make private maybe idk
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
        for (const iframe of this.tabContents) {
            iframe.iframe.contentWindow.postMessage(msg);
        }
    }

    findTabIndexFromTabEl(tabEl) {
        for (const tab of this.tabContents) {
            if (tab.tabEl == tabEl) return this.tabContents.indexOf(tab);
        }
        console.error("failed to find tab!")
    }

    findTabDictFromTabEl(tabEl) {
        return this.tabContents[this.findTabIndexFromTabEl(tabEl)];
    }

    createTab(detail) {
        var tabEl = detail.tabEl;
        var iframe = document.createElement("iframe");
        iframe.classList.add("browserTabContents");
        iframe.style.setProperty("display", "none");
        var self = this;
        iframe.onload = () => {self.handleOnload()};
        this.iFrameContainer.appendChild(iframe);
        this.tabContents.push({tabEl: tabEl, iframe: iframe});
    }

    openTab(url) {
        if(!url) url = this.settings.getSetting("startUrl");
        this.tabs.addTab();
        this.navigateTo(url)
    }

    closeTab(detail) {
        var tabEl = detail.tabEl;
        var tabIndex = this.tabContents.indexOf(this.tabContents.find(obj => { obj.tabEl === tabEl }));
        this.tabContents[index].iframe.remove();
        this.tabContents.splice(tabIndex, 1);
    }

    switchTabs(detail) {
        var oldTab = detail.active;
        var newTab = detail.tabEl;
        if(oldTab) {
            var oldTabIframe = this.findTabDictFromTabEl(oldTab).iframe;
            oldTabIframe.style.setProperty("display", "none");
        }
        var newTabIframe = this.findTabDictFromTabEl(newTab).iframe;
        newTabIframe.style.removeProperty("display");
        this.activeIframe = newTabIframe;
        this.handleOnload();
    }

    setUrl(url) {
        this.activeIframe.src = url
    }

    navigateTo(url) {
        if (url == "" || url.startsWith("aboutbrowser://")) {
            if (url == "") {
                url = this.aboutBrowserPrefix + "blank.html";
            } else if (url.startsWith("aboutbrowser://")) {
                url = url.replace('aboutbrowser://', this.aboutBrowserPrefix);
                url = url + ".html"
            }
            this.activeIframe.src = url;
            return;
        } else if (isUrl(url)) {
            if (hasHttps(url)) {
                proxyUsing(url, this.settings.getSetting("currentProxyId"));
            } else {
                proxyUsing('https://' + url, this.settings.getSetting("currentProxyId"))
            }
            return;
        } else {
            proxyUsing(this.settings.getSetting("searchEngineUrl") + url, this.settings.getSetting("currentProxyId"));
        }
    }

    handleOnload() {
        var url = this.activeIframe.contentWindow.location.toString();
        if (url == "about:blank") {
            return;
        }
        if (url.startsWith(this.aboutBrowserPrefix)) {
            url = url.replace(this.aboutBrowserPrefix, '');
            url = url.substring(0, url.length - 5);
            url = "aboutbrowser://" + url;
        } else {
            url = url.replace(window.location.protocol + "//" + window.location.host + baseUrlFor(this.settings.getSetting("currentProxyId")), '')
            url = decodeUrl(url, this.settings.getSetting("currentProxyId"));
        }
        this.addressBar.value = url;
        this.history.push(url)

        // get title of iframe
        var title = this.activeIframe.contentWindow.document.title;
        if (title == "") {
            title = url;
        }
        this.activeTabTitle = title;
        this.browserTitle = title + " - AboutBrowser";
        this.activeTabUrl = url;

        var self = this;
        (async (url) => {
            // get favicon of iframe
            var favi = null;
            if(url.startsWith("aboutbrowser://")) {
                favi = getIconNoFallback(self.activeIframe.contentWindow.document);
            } else if (url != "") {
                var faviUrl = getIcon(self.activeIframe.contentWindow.document, new URL(url));
                var blob = await fetch(baseUrlFor("UV") + encodeUrl(faviUrl, "UV")).then((r) => r.blob())
                if (blob != null) {
                    favi = URL.createObjectURL(blob);
                }
            }

            console.debug("got favi: ", favi);

            if (favi == null) {
                console.warn("falling back to default icon");
                favi = "/aboutbrowser/darkfavi.png";
            }

            // update tab
            self.tabs.updateTab(self.tabs.activeTabEl, {
                favicon: favi,
                title: title
            });
        })(url);
    }

    handleReload() {
        this.activeIframe.contentWindow.location.reload();
    }

    handleSettings() {
        this.openTab("aboutbrowser://settings");
    }

    handleBack() {
        this.activeIframe.contentWindow.history.back();
    }

    handleForward() {
        this.activeIframe.contentWindow.history.forward();
    }

    handleBookmarks() {
        this.bookmarks.add(this.activeTabTitle, this.activeTabUrl);
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

aboutBrowser = null;

function init() {
    aboutBrowser = new AboutBrowser();
}
