function proxyUsing(url, proxy, callback) {
    if (proxy === "DIP") {
        proxyUsingDIP(url, callback);
    } else if (proxy === "UV") {
        proxyUsingUV(url, callback);
    } else {
        console.error("Invalid proxy!");
    }
}

function baseUrlFor(proxy) {
    if (proxy === "DIP") {
        return window.__DIP.config.prefix;
    } else if (proxy === "UV") {
        return __uv$config.prefix;
    } else {
        console.error("Invalid proxy!");
    }
}

function decodeUrl(url, proxy) {
    if (proxy === "DIP") {
        return window.__DIP.decodeURL(url)
    } else if (proxy === "UV") {
        return __uv$config.decodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function encodeUrl(url, proxy) {
    if (proxy === "DIP") {
        return window.__DIP.encodeURL(url)
    } else if (proxy === "UV") {
        return __uv$config.encodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function proxyUsingDIP(url, callback) {
    window.navigator.serviceWorker.register('./sw.js').then(() => {
        callback(baseUrlFor("DIP") + encodeUrl(url, "DIP"))
    });
}

function proxyUsingUV(url, callback) {
    window.navigator.serviceWorker.register('./sw.js').then(() => {
        callback(baseUrlFor("UV") + encodeUrl(url, "UV"));
    });
}
