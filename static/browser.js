// todo private methods+variables maybe?
class AboutBrowser {
    constructor(plugins) {
        this.branding = {
            name: "AboutBrowser",
            version: "v0.9.0-dev"
        }
        this.addBranding();

        this.plugins = plugins;
        this.resourcesProtocol = "aboutbrowser://"
        this.resourcesPrefix = window.location.origin + "/aboutbrowser/";
        this.titleSuffix = ` - ${this.branding.name}`;
        this.browserTitle = "New Tab" + this.titleSuffix;
        document.title = this.browserTitle;

        // i have no idea why i wasn't initializing this super early
        this.settings = new Settings(this);

        // initialize themes as early as possible
        this.extensions = new ExtensionsController();
        
        this.bookmarks = new Bookmarks(document.querySelector(".bookmarksContainer"));
        this.bookmarks.load();

        this.addressBar = document.querySelector("#browserUrl");
        this.iFrameContainer = document.querySelector("#tabContents");

        this.history = new History();

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
            console.debug("Number of tabs left: ", self.chromeTabs.tabEls.length);
            if(self.chromeTabs.tabEls.length === 0) {
                document.querySelector(".container.browserContainer").style.setProperty("display", "none");
                document.querySelector(".goodbyeContainer").style.removeProperty("display");
            }
        });

        document.querySelector("button[data-add-tab]").addEventListener("click", () => {
            self.openTab();
        })

        this.addressBar.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                self.navigateTo(self.addressBar.value);
            }
        });

        this.settingsCtxMenu = document.querySelector(".moreMenu");
        this.settingsCtxBtn = document.querySelector(".navbarBtn#browserSettings");
        this.ctxMenuClickChecker = document.querySelector(".ctxMenuClickChecker");
        this.ctxMenuClickChecker.addEventListener("click", () => {
            self.settingsCtxMenu.classList.add("hidden");
            self.ctxMenuClickChecker.style.setProperty('display', 'none');
            self.settingsCtxBtn.classList.remove("active");
        })

        window.addEventListener("bookmarkClicked", (event) => { self.navigateTo(event.detail.url) });

        // the best line of code in this codebase
        // it used to be:
        // if(probeForChrome()) unfuckChrome();
        // sadly got removed

        this.bareClient = new Ultraviolet.BareClient(`${window.location.origin}/bare/`)

        this.eventsInit();

        this.asyncInit();
    }

    async asyncInit() {
        // prime the serviceworker
        await new Promise(r=>proxyUsing("https://nya.r58playz.dev", "UV", r));

        this.extensions = new ExtensionsController(this);
        await this.extensions.setup();

        Extension.chromeApis = await fetch("/extensions/injector/apis.js").then(r=>r.text());

        this.reapplyTheme();


        this.openTab();

        document.querySelector(".container.browserContainer").style.removeProperty("visibility");
    }

    eventsInit() {
        let self = this;
        this.eventsEl = document.querySelector(".aboutbrowser-event-el#aboutbrowser-event-el");
        this.eventsEl.addEventListener("aboutbrowser-contextmenu", (event)=>{
            if(event.detail.type === "more") {
                self.settingsCtxMenu.classList.remove("hidden");
                self.settingsCtxMenu.classList.add("transition");
                setTimeout(() => {
                    self.settingsCtxMenu.classList.remove("transition");
                }, 250);
                self.ctxMenuClickChecker.style.removeProperty("display");
                self.settingsCtxBtn.classList.add("active");
            }
        });
    }

    createEvent(name, detail, cancelable) {
        return new CustomEvent(name, {detail: detail, bubbles: false, cancelable: cancelable, composed: false});
    }

    reapplyTheme() {
        this.extensions.injectTheme();
        for (const tab of this.tabs.internalList) {
            tab.value.reinjectTheme();
        }
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
        this.eventsEl.dispatchEvent(this.createEvent("aboutbrowser-contextmenu", {type: "more", browser: this}, true));
    }

    handleSettingsCtxMenu(menuItem) {
        this.settingsCtxMenu.classList.add("hidden");
        this.settingsCtxBtn.classList.remove("active");
        this.ctxMenuClickChecker.style.setProperty("display", "none");
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

    replaceInText(element, pattern, replacement) {
      for (let node of element.childNodes) {
        switch (node.nodeType) {
          case Node.ELEMENT_NODE:
            this.replaceInText(node, pattern, replacement);
            break;
          case Node.TEXT_NODE:
            node.textContent = node.textContent.replace(pattern, replacement);
            break;
          case Node.DOCUMENT_NODE:
            this.replaceInText(node, pattern, replacement);
        }
      }
    }

    addBranding() {
        this.replaceInText(document.body, /\${name}/g, this.branding.name);
        this.replaceInText(document.body, /\${version}/g, this.branding.version);
    }
}

async function init(injectNode) {
    let plugins = new AboutBrowserPlugins();
    await plugins.init();
    await plugins.inject();
    let aboutbrowser = new AboutBrowser(plugins);
    window.aboutbrowser = aboutbrowser;
}
