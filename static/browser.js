function aboutBrowser(page) {
  var base = window.location.protocol + "//" + window.location.host + "/aboutbrowser/";
  return base + page + ".html";
}

function init() {
  var url = document.getElementById("browserUrl");
  url.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
      changeUrl(url.value);
    }
  });
}

function changeUrl(url) {
  if (url == "" || url.includes("aboutbrowser://")) {
    if (url == "") {
      url = aboutBrowser("blank");
    } else if (url.includes("aboutbrowser://")) {
      url = url.replace('aboutbrowser://', '');
      url = aboutBrowser(url)
    }
    setUrl(url);
    return;
  } else if (isUrl(url)) {
    setUrl(url);
    return;
  } else {
    setUrl('https://www.google.com/search?q=' + url);
  }
}

function setUrl(url) {
  var browser = document.getElementById("browser");
  browser.src = url;
}
