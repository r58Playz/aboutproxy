function aboutBrowser(page) {
  var HOSTURL = "https://aboutbrowser.r58.repl.co/";
  var base = HOSTURL + "aboutbrowser/";
  return base + page + ".html";
}

function init() {
  var url = document.getElementById("browserUrl");
  url.addEventListener("keydown", function(e) {
    if (e.code === "Enter") {
      changeUrl(url.value);
    }
  });
}

function changeUrl(url) {
  if (url == "") {
    url = aboutBrowser("blank")
  }
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  var browser = document.getElementById("browser");
  browser.src = url;
}
