const dropdownSetting = `<div class="setting dropdown"><span></span><div class="expand"></div><div class="control"><select name="setting"></select></div></div>`;
const textSetting = `<div class="setting text"><span></span><div class="expand"></div><div class="control"><input type="text"/></div></div>`; 
const switchSetting = `<div class="setting switch"><span></span><div class="expand"></div><div class="control"><input type="checkbox" /></div></div>`;

function settingsMetadataCallback(msg) {
  const data = msg.metadata;
  const values = msg.values;
  const settings = document.querySelector(".settingsView");
  settings.innerHTML='';
  for(const setting of data) {
    let node = null;
    switch (setting.type) {
      case "text":
        node = htmlToElement(textSetting);
        break;
      case "dropdown":
        node = htmlToElement(dropdownSetting);
        break;
      default:
        console.error(`invalid setting type ${setting.type}`);
        continue;
    }
    node.id = setting.id;
    node.querySelector("span").innerText = setting.name;
    switch (setting.type) {
      case "text":
        const textNode = node.querySelector("input");
        textNode.value = msg.values[setting.id];
        textNode.addEventListener("input", () => {
          if(textNode.value === "") return;
          sendMessage({type: "setSetting", setting: setting.id, value: textNode.value});
        })
        break;
      case "dropdown":
        const dropdownNode = node.querySelector("select");
        for (const option of setting.values) {
          const el = document.createElement("option");
          el.value = option[0];
          el.innerText = option[1];
          dropdownNode.appendChild(el);
        }
        dropdownNode.value = msg.values[setting.id];
        dropdownNode.addEventListener("change", ()=>{
          sendMessage({type: "setSetting", setting: setting.id, value: dropdownNode.value});
        })
        break;
      default:
        break;
    }
    settings.appendChild(node);
  }
}

sendMessage({type: "getSettingsMetadata"});
