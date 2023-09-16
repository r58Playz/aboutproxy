function string2el(str) {
  let el = document.createElement("div");
  el.innerHTML = str;
  return el.childNodes[0];
}

document.querySelector("#loadAsZip").addEventListener("click", async ()=>{
  sendMessage({ type: "importExtensionZip", base64: await blobToDataUrl(document.querySelector("#fileInput").files[0]), name: document.querySelector("#fileInput").files[0].name });
});


document.querySelector("#loadAsCrx").addEventListener("click", async ()=>{
  sendMessage({ type: "importExtensionCrx", base64: await blobToDataUrl(document.querySelector("#fileInput").files[0]) });
});

async function extensionListCallback(msg) {
  const {extensions, themeExtensions} = JSON.parse(msg.data);
  console.debug("current themeExtensions: ", themeExtensions);
  document.querySelector("#extensions").innerHTML = '';
  for(const extension of extensions) {
    let extIcon = "/aboutbrowser/darkfavi.png";
    if(extension.icon) extIcon = extension.icon;
    const extName = extension.name;
    const extVer = extension.version;
    const extId = extension.id;
    const extDesc = extension.description;
    let el = string2el(`<div class="tileItem"><div class="info"><img class="icon" src="${extIcon}" /><div class="name"><span>${extName}<span class="version">${extVer}</span></span><span class="desc">${extDesc}</span><div class="expand"></div><span class="id">ID: ${extId}</span></div></div><div class="controls"><button id="removeButton">Remove</button><div class="expand"></div><span>Enabled: <input type="checkbox" data-id="enabledCheckbox" /></span></div></div>`);
    el.setAttribute("data-ext-id", extId);
    el.querySelector("[data-id=\"enabledCheckbox\"]").checked = extension.enabled;
    if(extension.internal) {
      el.querySelector("#removeButton").disabled = true;
    }
    if(extension.internalTheme) {
      if(extension.enabled) el.querySelector("#removeButton").disabled = true;
      if(themeExtensions.length == 1 || (extensions.some(extension=>extension.enabled && themeExtensions.includes(extension.id)) && extension.enabled)) el.querySelector("[data-id=\"enabledCheckbox\"]").disabled = true;
    }
    el.querySelector("#removeButton").addEventListener("click", ({currentTarget})=>{
      sendMessage({ type: "removeExtension", id: currentTarget.parentElement.parentElement.getAttribute("data-ext-id")});
    });
    el.querySelector("[data-id=\"enabledCheckbox\"]").addEventListener("click", ({currentTarget})=>{
      const id = currentTarget.parentElement.parentElement.parentElement.getAttribute("data-ext-id");
      sendMessage({
        type: "setExtensionEnabled",
        id: id,
        enabled: currentTarget.checked
      });
      if(themeExtensions.includes(id)) {
        if(currentTarget.checked) {
          sendMessage({ type: "setCurrentTheme", id: id});
        } else {
          sendMessage({ type: "setCurrentTheme", id: "default" });
        }
      }
    });
    document.querySelector("#extensions").appendChild(el);
  }
}

function reloadExtensionsCallback() {
  console.debug("reloading")
  sendMessage({type:"getExtensions"});
}

sendMessage({type:"getExtensions"});
