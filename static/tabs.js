var tabContainer = document.getElementById("tabContainer")
var tabContent = document.getElementById("tabContents")
var tabNumber = 0;
var activeTab = ""
var tabs = [];
var tabContents = [];

function h(tag, contents) {
    var tmp = document.createElement(tag);
    tmp.innerHTML = contents;
    return tmp
}

function addTab(contents, tabinsides) {
    var tab = document.createElement("div");
    tab.className = "tabItem";
    tab.innerHTML = '<i class="fa-solid fa-globe icon"></i>' + contents;
    tab.addEventListener("click", () => { switchToTab(getTabNumber(tab)) })
    tabContainer.appendChild(tab);
    tab.setAttribute("number", tabNumber);
    tabs[tabNumber] = tab;
    tabContents[tabNumber] = tabinsides
    tabNumber++;
}

function removeTab(index) {
    var tabsToChange = tabs.slice(index + 1);
    for (const tab of tabsToChange) {
        setTabNumber(tab, getTabNumber(tab) - 1);
        setTabTitle(tab, getTabNumber(tab));
    }
    tabNumber -= 1;
    tabs[index].remove();
    tabContents[index].remove();
    tabContents.splice(index, 1)
    tabs.splice(index, 1);
}

function switchToTab(number) {
    tabContents.
}

function getTabNumber(tab) {
    return parseInt(tab.getAttribute("number"));
}

function setTabTitle(tab, contents) {
    tab.innerHTML = '<i class="fa-solid fa-globe icon"></i>' + contents;
}

function setTabNumber(tab, number) {
    tab.setAttribute("number", number);
}