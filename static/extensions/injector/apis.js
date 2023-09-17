(()=>{
  function sendMessage(msg) {
    window.parent.postMessage({type: "extApisMessage", msg: msg}, window.origin);
  }
  chrome.runtime = {
    connect(id, connectInfo) {throw new Error("chrome.runtime.connect() not implemented.")},
    getManifest() {
      return JSON.parse(document.currentScript.getAttribute("data-aboutproxy-manifest"));
    },
    getURL(path) {
      return `${window.location.origin}/extensions/${this.id}/${path}`;
    },
    get id() {
      return document.currentScript.getAttribute("data-aboutproxy-extid");
    },
    onConnect(callback) {throw new Error("chrome.runtime.onConnect() not implemented.")},
    onMessage(callback) {throw new Error("chrome.runtime.onMessage() not implemented.")},
    sendMessage(id, message, options, callback) {throw new Error("chrome.runtime.connect() not implemented.")}
  };
})();
