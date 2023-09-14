BOOKMARK_TEMPLATE = '<div class="bookmarksRow"><div class="bookmarksIconDiv"><img class="bookmarksIcon"></img></div><input class="bookmarkTitle"></input><input class="bookmarkUrl"></input><div class="bookmarkButtons"><button class="themedBtn" id="deleteBtn"><span class="material-symbols-outlined">delete</span></button></div></div>'
var bookmarksTable = document.querySelector("#bookmarksTable");
var localStorageData = JSON.parse(localStorage.getItem("bookmarks"));

currentlySelectedBookmark = null;

function onclickBookmark(event) {
    el = event.currentTarget;
    if (currentlySelectedBookmark) {
        currentlySelectedBookmark.removeAttribute("data-active");
    }
    el.setAttribute("data-active", "true");
    currentlySelectedBookmark = el;
}

function init() {
    localStorageData.forEach(function(bookmark, i) {
        addBookmark(bookmark.name, bookmark.url, bookmark.favicon, i)
    });
}

function save() {
    localStorage.setItem("bookmarks", JSON.stringify(localStorageData));
}


function createBookmark(title, url) {
    var index = localStorageData.push({name: title, url: url, favicon: "/aboutbrowser/darkfavi.png"});
    addBookmark(title, url, "/aboutbrowser/darkfavi.png", index);
    save();
    sendMessage({
        type: "reloadBookmarks"
    });
}

function addBookmark(title, url, favicon, i) {
    el = htmlToElement(BOOKMARK_TEMPLATE);
    el.setAttribute("data-index", i);
    el.querySelector(".bookmarkTitle").value = title;
    el.querySelector(".bookmarkUrl").value = url;
    el.querySelector("#deleteBtn").onclick = deleteBookmark;
    el.querySelector(".bookmarkTitle").addEventListener("blur", updateBookmark);
    el.querySelector(".bookmarkUrl").addEventListener("blur", updateBookmark);
    el.querySelector("img").setAttribute("src", favicon);
    el.onclick = onclickBookmark;
    bookmarksTable.appendChild(el);
}

function deleteBookmark(event) {
    bookmarkEl = event.currentTarget.parentElement.parentElement;
    index = bookmarkEl.getAttribute("data-index");
    localStorageData.splice(index, 1);
    save();
    sendMessage({
        type: "reloadBookmarks"
    });
    reloadBookmarks();
}

function updateBookmark(event) {
    bookmarkEl = event.currentTarget.parentElement;
    title = bookmarkEl.querySelector(".bookmarkTitle").value;
    url = bookmarkEl.querySelector(".bookmarkUrl").value;
    index = bookmarkEl.getAttribute("data-index");
    localStorageData[index].name = title;
    localStorageData[index].url = url;
    save();
    sendMessage({
        type: "reloadBookmarks"
    });
}

function reloadBookmarks() {
    localStorageData = JSON.parse(localStorage.getItem("bookmarks"));
    bookmarksTable.innerHTML = '';
    init();
}

function reloadBookmarksCallback() {
    reloadBookmarks();
}
