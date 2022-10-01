var tabContainer = document.getElementById("tabContainer");
var addTabBtn = document.getElementById("addTab");
var tabContent = document.getElementById("tabContents");
var tabNumber = 0;
var activeTab = 0;
var tabs = [];
var tabContents = [];
var switchToTabH = undefined;

function initTabs(switchHandler = () => { }) {
    switchToTabH = switchHandler;
}

function h(tag, contents) {
    var tmp = document.createElement(tag);
    tmp.innerHTML = contents;
    return tmp
}

function addTab(title = 'New Tab', contents = h('h1', 'New Tab')) {
    console.info(activeTab, tabNumber, tabs, tabContents)
    var tab = document.createElement("div");
    tab.innerHTML = '<div class="tabTitle tabIcon"><i class="fa-solid fa-globe tabIcon"></i></div><div class="tabTitle"><div class="tabTitleContent"></div></div><button class="tabTitle tabIcon navbarBtn tabBtn"><i class="fa-solid fa-xmark"></i></div>'
    tab.classList.add("tabItem");
    tab.classList.add("unfocusedTab");
    tab.addEventListener("click", () => { switchToTab(getTabNumber(tab)) });
    tab.childNodes[2].addEventListener("click", (event) => { event.stopPropagation(); removeTab(getTabNumber(tab)) });
    setTabNumber(tab, tabNumber);
    var currentTabNumber = tabNumber;
    setTabTitle(tab, title);
    tabContainer.insertBefore(tab, addTabBtn);
    tabs[tabNumber] = tab;

    contents.classList.add("tabContents");
    hideElement(contents);
    tabContent.appendChild(contents);
    tabContents[tabNumber] = contents;
    console.info(activeTab, tabNumber, tabs, tabContents)

    tabNumber++;
    return currentTabNumber;
}

function removeTab(index) {
    if (activeTab == index && index != 0) {
        switchToTab(index - 1);
    } else if (index == 0) {
        console.error("l bozo + ratio + ur bad + fatherless + orphan \\j")
        return;
    }
    console.warn(activeTab, index, tabNumber, tabs, tabContents)
    var tabsToChange = tabs.slice(index + 1);
    for (const tab of tabsToChange) {
        setTabNumber(tab, getTabNumber(tab) - 1);
    }
    tabNumber -= 1;
    tabs[index].remove();
    tabContents[index].remove();
    tabContents.splice(index, 1)
    tabs.splice(index, 1);
    console.warn(activeTab, index, tabNumber, tabs, tabContents)
}

function switchToTab(number) {
    setTabFocused(tabs[activeTab], false);
    setTabFocused(tabs[number], true);
    hideElement(tabContents[activeTab]);
    showElement(tabContents[number]);
    switchToTabH(activeTab, number, tabs, tabContents);
    activeTab = number;
}

function getTabNumber(tab) {
    return parseInt(tab.getAttribute("number"));
}

function setTabTitle(tab, contents) {
    tab.childNodes[1].childNodes[0].innerText = contents;
}

function getTabTitle(tab) {
    return tab.childNodes[1].childNodes[0].innerText;
}

function setTabNumber(tab, number) {
    tab.setAttribute("number", number);
}

function setTabFocused(tab, focused) {
    if (focused) {
        tab.classList.remove("unfocusedTab")
        tab.classList.add("focusedTab")
    } else {
        tab.classList.remove("focusedTab")
        tab.classList.add("unfocusedTab")
    }
}

function hideElement(element) {
    element.style.setProperty("display", "none");
}

function showElement(element) {
    element.style.removeProperty("display");
}