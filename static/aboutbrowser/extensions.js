function string2el(str) {
  let el = document.createElement("div");
  el.innerHTML = str;
  return el.childNodes[0];
}

function extensionListCallback(msg) {
  let data = JSON.parse(msg.data);
  document.querySelector("#extensions").innerHTML = '';
  for(const extension of data) {
    let extIcon = "/aboutbrowser/darkfavi.png"
    if(extension.icon) extIcon = extension.icon;
    const extName = extension.name;
    const extVer = extension.version;
    const extId = extension.id;
    const extDesc = extension.description;
    let el = string2el(`<div class="tileItem"><div class="info"><img class="icon" src="${extIcon}" /><div class="name"><span>${extName}<span class="version">${extVer}</span></span><span class="desc">${extDesc}</span><div class="expand"></div><span class="id">ID: ${extId}</span></div></div><div class="controls"><button id="removeButton">Remove</button><div class="expand"></div><span>Enabled: <input type="checkbox" id="enabledCheckbox" /></span></div></div>`);
    el.setAttribute("data-ext-id", extId);
    el.querySelector("#enabledCheckbox").checked = extension.enabled;
    if(extension.internal) {
      el.querySelector("#removeButton").disabled = true;
    }
    if(extension.internalTheme && extension.enabled) el.querySelector("#removeButton").disabled = true;
    document.querySelector("#extensions").appendChild(el);
  }
}

sendMessage({type:"getExtensions"});
