var browserAddressBar = document.getElementById("browserUrl");
var browser = undefined;
var currentProxyId = "DIP";

function aboutBrowser(page) {
  var base = window.location.protocol + "//" + window.location.host + "/aboutbrowser/";
  return base + page + ".html";
}

function init() {
  initTabs(switchTabsHandler);
  addNewABTab(true);
  browserAddressBar.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
      changeUrl(browserAddressBar.value);
    }
  });
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
    proxyUsing('https://www.google.com/search?q=' + url, currentProxyId);
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

function switchTabsHandler(oldTab, newTab, _, tabContents) {
  tabContents[oldTab].onload = undefined;
  tabContents[newTab].onload = browserOnload;
  browser = tabContents[newTab];
  //refresh address bar by running onload handler
  browserOnload();
}

function addNewABTab(setAsActive = false) {
  var newBrowser = h("iframe", "");
  newBrowser.classList.add("browserTabContents")
  var tabnum = addTab("New Tab", newBrowser);
  if (setAsActive) switchToTab(tabnum);
  setUrlFor(aboutBrowser('start'), tabContents[tabnum])
}