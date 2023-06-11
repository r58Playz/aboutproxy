// todo private methods+variables maybe?
class AboutBrowser {
    constructor() {
        // initialize themes as early as possible
        this.themes = new ThemeController();
        this.themes.applyTheme();

        this.resourcesProtocol = "aboutbrowser://"
        this.resourcesPrefix = window.location.origin + "/aboutbrowser/";
        this.titleSuffix = " - AboutBrowser";
        this.browserTite = "New Tab" + this.titleSuffix;
        document.title = this.browserTitle;

        this.bookmarks = new Bookmarks(document.querySelector(".bookmarksContainer"));
        this.bookmarks.load();

        this.addressBar = document.querySelector("#browserUrl");
        this.iFrameContainer = document.querySelector("#tabContents");

        this.history = new History();

        this.settings = new Settings(this);

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
        this.ctxMenuClickChecker = document.querySelector(".ctxMenuClickChecker");
        this.ctxMenuClickChecker.addEventListener("click", () => {
            self.settingsCtxMenu.style.setProperty('display', 'none');
            self.ctxMenuClickChecker.style.setProperty('display', 'none');
        })

        window.addEventListener("bookmarkClicked", (event) => { self.navigateTo(event.detail.url) });

        // the best line of code in this codebase
        // it used to be:
        // if(probeForChrome()) unfuckChrome();
        // sadly got removed
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
        this.ctxMenuClickChecker.style.removeProperty("display");
    }

    handleSettingsCtxMenu(menuItem) {
        this.settingsCtxMenu.style.setProperty("display", "none");
        switch(menuItem) {
            case "newTab":
                this.openTab();
                break;
            case "history":
                this.openTab(this.resourcesProtocol + "history");
                break;
            case "downloads":
                this.openTab(this.resourcesProtocol + "downloads");
                break;
            case "bookmarks":
                this.openTab(this.resourcesProtocol + "bookmarks");
                break;
            case "settings":
                this.openTab(this.resourcesProtocol + "settings");
                break;
            case "about":
                this.openTab(this.resourcesProtocol + "versionHistory");
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
        this.openTab(this.resourcesProtocol + "extensions");
    }
}

function init() {
    try{
        var aboutbrowser = new AboutBrowser();
        window.aboutbrowser = aboutbrowser;
    }catch(err){
        alert(err.stack);
    }
}
