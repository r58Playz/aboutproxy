function extensionListCallback(msg) {
  let {extensions} = JSON.parse(msg.data);
  document.querySelector("#extensionList").innerHTML = '';
  for(const extension of extensions) {
    let el = document.createElement("option");
    el.innerText = "\"" + extension.name + "\" type: " + extension.type + " enabled: " + extension.enabled;
    el.value = extension.id;
    document.querySelector("#extensionList").appendChild(el);
  }
}

function init() {
  sendMessage({ type: "getExtensions" });
  document.querySelector("#installCrx").onclick = async () => {
    sendMessage({ type: "importExtensionCrx", base64: await blobToDataUrl(document.querySelector("#fileInput").files[0]) });
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 500)
  };

  document.querySelector("#installZip").onclick = async () => {
    sendMessage({ type: "importExtensionZip", base64: await blobToDataUrl(document.querySelector("#fileInput").files[0]), name: document.querySelector("#fileInput").files[0].name });
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 500)
  };

  document.querySelector("#setTheme").onclick = () => {
    sendMessage({ type: "setCurrentTheme", id: document.querySelector("#extensionList").value});
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 100)
  };

  document.querySelector("#removeExtension").onclick = () => {
    sendMessage({ type: "removeExtension", id: document.querySelector("#extensionList").value});
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 500)
  }

  document.querySelector("#disableExtension").onclick = () => {
    sendMessage({ type: "setExtensionEnabled", id: document.querySelector("#extensionList").value, enabled:false}); 
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 100)
  }

  document.querySelector("#enableExtension").onclick = () => {
    sendMessage({ type: "setExtensionEnabled", id: document.querySelector("#extensionList").value, enabled:true}); 
    setTimeout(()=>{sendMessage({ type: "getExtensions" })}, 100)
  }
}
