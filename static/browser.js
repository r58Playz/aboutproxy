function setSetting(setting, value) {
  localStorage.setItem(setting, value);
}

function getSetting(setting) {
  return localStorage.getItem(setting)
}

function resetSetting(setting) {
  localStorage.removeItem(setting);
}

function resetSettings() {
  localStorage.clear();
}

var browserAddressBar = document.getElementById("browserUrl");
var browserIframeContainer = document.getElementById("tabContents");
var browser = undefined;
var currentProxyId;
var searchEngineUrl;
var tabContents = [];
var startUrl;
var chromeTabs = undefined;

function h(type, inner) {
  var tmp = document.createElement(type);
  tmp.innerHTML = inner;
  return tmp;
}

function aboutBrowser(page) {
  var base = window.location.protocol + "//" + window.location.host + "/aboutbrowser/";
  return base + page + ".html";
}

function probeForChrome() {
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

function init() {
  initSettings();
  initTabs();
  if (probeForChrome()) unfuckChrome();
  browserAddressBar.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
      changeUrl(browserAddressBar.value);
    }
  });
}

function getHeightOfElement(element) {
  const cs = getComputedStyle(element);

  const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

  const borderY =
    parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

  return element.offsetHeight - paddingY - borderY;
}

function unfuckChrome() {
  console.error("stupid chrome is broken so i have to go unfuck it")
  var bSettings = document.getElementById("browserSettings");
  bSettings.style.setProperty('width', getHeightOfElement(bSettings) + 2 + 'px');
  console.error('unfucked chrome');
}

function initSettings() {
  currentProxyId = "DIP";
  searchEngineUrl = 'https://www.google.com/search?q='
  startUrl = 'aboutbrowser://start';
  var searchEngineUrlSetting = getSetting("searchEngineUrl");
  if (searchEngineUrlSetting) searchEngineUrl = searchEngineUrlSetting
  var startUrlSetting = getSetting("startUrl");
  if (startUrlSetting) startUrl = startUrlSetting
}

function initTabs() {
  var el = document.querySelector('.chrome-tabs')
  chromeTabs = new ChromeTabs()

  document.documentElement.classList.add('dark-theme')
  el.classList.add('chrome-tabs-dark-theme')

  chromeTabs.init(el)

  el.addEventListener('activeTabChange', ({ detail }) => {
    console.debug('Active tab changed', detail.active, detail.tabEl);
    switchTabsHandler(detail.active, detail.tabEl)
  })
  el.addEventListener('tabAdd', ({ detail }) => {
    console.debug('Tab added', detail.tabEl);
    addTabHandler(detail.tabEl);
  })
  el.addEventListener('tabRemove', ({ detail }) => {
    console.debug('Tab removed', detail.tabEl);
    closeTabHandler(detail.tabEl);
  })

  document.querySelector('button[data-add-tab]').addEventListener('click', _ => {
    addTab();
  })

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 't') {
      addTab();
    } else if (event.ctrlKey && event.key === 'w') {
      chromeTabs.removeTab(chromeTabs.activeTabEl);
    } else if (event.ctrlKey && event.key === 'r') {
      browserReload();
    }
  })
  addTab();
}

function changeUrl(url) {
  if (url == "" || url.startsWith("aboutbrowser://")) {
    if (url == "") {
      url = aboutBrowser("blank");
    } else if (url.startsWith("aboutbrowser://")) {
      url = url.replace('aboutbrowser://', '');
      url = aboutBrowser(url)
    }
    setUrl(url);
    return;
  } else if (isUrl(url)) {
    if (hasHttps(url)) {
      proxyUsing(url, currentProxyId);
    } else {
      proxyUsing('https://' + url, currentProxyId)
    }
    return;
  } else {
    proxyUsing(searchEngineUrl + url, currentProxyId);
  }
}

function setUrl(url) {
  browser.src = url;
}

function setUrlFor(url, iframe) {
  iframe.src = url;
}

function browserOnload() {
  var url = browser.contentWindow.location.toString();
  if (url.startsWith(window.location.protocol + "//" + window.location.host + '/aboutbrowser/')) {
    url = url.replace(window.location.protocol + "//" + window.location.host + '/aboutbrowser/', '');
    url = url.substring(0, url.length - 5);
    url = "aboutbrowser://" + url;
  } else {
    url = url.replace(window.location.protocol + "//" + window.location.host + baseUrlFor(currentProxyId), '')
    url = decodeUrl(url, currentProxyId);
  }
  browserAddressBar.value = url;
}

function browserReload() {
  browser.contentWindow.location.reload();
}

function browserSettings() {
  addTab("aboutbrowser://settings");
}

function browserBack() {
  addTab("aboutbrowser://history")
}

function browserForward() {
  addTab("aboutbrowser://history")
}

function browserBookmarks() {
  addTab("aboutbrowser://bookmarks")
}

function browserExtensions() {
  addTab("aboutbrowser://extensions")
}

function switchTabsHandler(oldTabEl, newTabEl) {
  if (oldTabEl) {
    var oldTabIframe = findTabDictFromTabEl(oldTabEl).iframe;
    oldTabIframe.onload = undefined;
    oldTabIframe.style.setProperty('display', 'none');
  }
  var newTabIframe = findTabDictFromTabEl(newTabEl).iframe;
  newTabIframe.style.removeProperty('display');
  newTabIframe.onload = browserOnload;
  browser = newTabIframe;
  //refresh address bar by running onload handler
  browserOnload();
}

function addTabHandler(tabEl) {
  var iframe = h('iframe');
  iframe.classList.add('browserTabContents');
  iframe.style.setProperty('display', 'none');
  browserIframeContainer.appendChild(iframe);
  tabContents.push({ tabEl, iframe })
}

function closeTabHandler(tabEl) {
  var tabIndex = -1;
  for (const tab of tabContents) {
    if (tab.tabEl == tabEl) tabIndex = tabContents.indexOf(tab);
  }
  if (tabIndex == -1) {
    console.error("how tf did you not find the tab? USER IS HECKER ALERT");
  } else {
    tabContents[tabIndex].iframe.remove()
    tabContents.splice(tabIndex, 1);
  }
}

function findTabIndexFromTabEl(tabEl) {
  for (const tab of tabContents) {
    if (tab.tabEl == tabEl) return tabContents.indexOf(tab);
  }
  console.error("failed to find tab!!!!!!!")
}

function findTabDictFromTabEl(tabEl) {
  return tabContents[findTabIndexFromTabEl(tabEl)];
}

function addTab(url) {
  if (!url) url = startUrl;
  chromeTabs.addTab({
    title: 'New Tab',
    favicon: false
  })
  changeUrl(url);
}