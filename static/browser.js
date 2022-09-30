var browserAddressBar = document.getElementById("browserUrl");
var browser = document.getElementById("browser");
var currentProxyId = "UV";

function aboutBrowser(page) {
  var base = window.location.protocol + "//" + window.location.host + "/aboutbrowser/";
  return base + page + ".html";
}

function init() {
  browserAddressBar.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
      changeUrl(browserAddressBar.value);
    }
  });
  changeUrl("aboutbrowser://start")
  browser.onload = browserOnload;
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
    proxyUsing(url, currentProxyId);
    return;
  } else {
    proxyUsing('https://www.google.com/search?q=' + url, currentProxyId);
  }
}

function setUrl(url) {
  browser.src = url;
}

function browserOnload() {
  var url = browser.contentWindow.location.toString();
  if (url.startsWith(window.location.protocol + "//" + window.location.host + '/aboutbrowser/')) {
    url = url.replace(window.location.protocol + "//" + window.location.host + '/aboutbrowser/', '');
    url = url.substring(0, url.length - 5);
    url = "aboutbrowser://" + url;
  }
  url = url.replace(window.location.protocol + "//" + window.location.host + baseUrlFor(currentProxyId), '')
  browserAddressBar.value = url;
}

function proxyUsing(url, proxy) {
  if (proxy == "UV") {
    proxyUsingUV(url);
  } else {
    console.error("Invalid proxy!");
  }
}

function baseUrlFor(proxy) {
  if (proxy == "UV") {
    return __uv$config.prefix;
  } else {
    console.error("Invalid proxy!");
  }
}