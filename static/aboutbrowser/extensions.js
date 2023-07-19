function string2el(str) {
  let el = document.createElement("div")
  div.innerHTML = str;
  return el.content.childNodes; 
}

function extensionListCallback(msg) {
  let data = JSON.parse(msg.data);
  document.querySelector("#extensionList").innerHTML = '';
  for(const extension of data) {
    const extIcon = "/aboutbrowser/darkfavi.png"
    let el = string2el(`<div class="tileItem"><div class="info"><img class="icon" src="${extIcon}" /><div class="name"><span>${extName}<span class="version">${extVer}</span></span><span class="desc">${extDesc}</span><div class="expand"></div><span class="id">ID: ${extId}</span></div></div><div class="controls"><button id="removeButton">Remove</button><div class="expand"></div><span>Enabled: <input type="checkbox" id="enabledCheckbox" /></span></div></div>`);
    el.innerText = "\"" + extension.name + "\" type: " + extension.type + " enabled: " + extension.enabled;
    el.value = extension.id;
    document.querySelector("#extensionList").appendChild(el);
  }
}
