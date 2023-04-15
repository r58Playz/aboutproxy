function proxyUsing(url, proxy) {
    if (proxy === "DIP") {
        proxyUsingDIP(url);
    } else if (proxy === "UV") {
        proxyUsingUV(url);
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

function proxyUsingDIP(url) {
    window.navigator.serviceWorker.register('./sw.js').then(() => {
        setUrl(window.__DIP.config.prefix + window.__DIP.encodeURL(url))
    });
}

function proxyUsingUV(url) {
    window.navigator.serviceWorker.register('./sw.js').then(() => {
        setUrl(__uv$config.prefix + __uv$config.encodeUrl(url));
    });
}
