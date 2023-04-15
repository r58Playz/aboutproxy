class Bookmarks {
    constructor(bookmarkEl) {
        this.bookmarkContainer = bookmarkEl;
        this.bookmarkTemplate = '<button class="bookmark"><img class="bookmarkIcon" src="/aboutbrowser/darkfavi.png"></img></button>'
    }

    add(title = 'A', url = "https://google.com") {
        var node = htmlToElement(this.bookmarkTemplate);
        node.onclick = this.bookmarkHandler;
        node.setAttribute("data-url", url)
        var bookmarkTitle = document.createTextNode(title);
        node.appendChild(bookmarkTitle);
        this.bookmarkContainer.appendChild(node);
    }

    delete(number = 0) {
        var bookmarks = this.bookmarkContainer.childNodes;
        bookmarks[number].remove();
    }

    bookmarkHandler() {
        dispatchEvent(new CustomEvent("bookmarkClicked", {
            'detail': {
                el: this,
                name: this.childNodes[1].data,
                url: this.dataset.url
            }
        }));
    }

    changeName(index, name) {
        var bookmarks = this.bookmarkContainer.childNodes;
        var bookmark = bookmarks[index];
        var textNode = bookmark.childNodes[1]; // hack fix never
        textNode.data = name;
    }

    changeUrl(index, url) {
        var bookmarks = this.bookmarkContainer.childNodes;
        var bookmark = bookmarks[index];
        bookmark.dataset.url = url;
    }

    getName(index) {
        var bookmarks = bookmarkContainer.childNodes;
        var bookmark = bookmarks[index];
        var textNode = bookmark.childNodes[1]; // hack fix never
        return textNode.data;
    }

    getUrl(index) {
        var bookmarks = this.bookmarkContainer.childNodes;
        var bookmark = bookmarks[index];
        return bookmark.dataset.url;
    }

    save(localStorageKey = "bookmarks") {
        var localStorageData = [];
        for (const bookmark of this.bookmarkContainer.childNodes) {
            localStorageData.push({
                name: bookmark.childNodes[1].data,
                url: bookmark.dataset.url
            })
        }
        localStorage.setItem(localStorageKey, JSON.stringify(localStorageData));
    }

    load(localStorageKey = "bookmarks") {
        var localStorageData = this.archive(localStorageKey);
        for (const bookmark of localStorageData) {
            this.add(bookmark.name, bookmark.url);
        }
    }

    reload(localStorageKey = "bookmarks") {
        this.bookmarkContainer.innerHTML = "";
        this.load(localStorageKey);
    }

    archive(localStorageKey = "bookmarks") {
        return JSON.parse(localStorage.getItem(localStorageKey));
    }

    loadFromArchive(localStorageData) {
        for (const bookmark of localStorageData) {
            add(bookmark.name, bookmark.url);
        }
    }
}
