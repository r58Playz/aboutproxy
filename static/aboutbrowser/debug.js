function themeListCallback(msg) {
  let data = JSON.parse(msg.data);
  document.querySelector("#themeList").innerHTML = '';
  for(const theme of data) {
    let el = document.createElement("option");
    el.innerText = theme;
    document.querySelector("#themeList").appendChild(el);
  }
}
function importThemeCallback(msg) {
  let data = JSON.parse(msg.data);
  if(typeof data === "string") { 
    document.querySelector("#themeError").innerText = data;
  } else {
    sendMessage({ type: "getThemes" });
  }
}

function init() {
  sendMessage({ type: "getThemes" });
  document.querySelector("#addTheme").onclick = () => {
    sendMessage({ type: "importTheme", themeJson: document.querySelector("#themeInput").value });
  };

  document.querySelector("#setTheme").onclick = () => {
    sendMessage({ type: "setTheme", theme: document.querySelector("#themeList").value});
  };

  document.querySelector("#removeTheme").onclick = () => {
    sendMessage({ type: "removeTheme", theme: document.querySelector("#themeList").value});
    sendMessage({ type: "getThemes" })
  }
}
