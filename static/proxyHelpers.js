function proxyUsing(url, proxy, callback) {
    if (proxy === "UV") {
        proxyUsingUV(url, callback);
    } else {
        console.error("Invalid proxy!");
    }
}

function baseUrlFor(proxy) {
    if (proxy === "UV") {
        return __uv$config.prefix;
    } else {
        console.error("Invalid proxy!");
    }
}

function decodeUrl(url, proxy) {
    if (proxy === "UV") {
        return __uv$config.decodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function encodeUrl(url, proxy) {
    if (proxy === "UV") {
        return __uv$config.encodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function proxyUsingUV(url, callback) {
    window.navigator.serviceWorker.register('./sw.js', {scope: "/service"}).then(() => {
        callback(baseUrlFor("UV") + encodeUrl(url, "UV"));
    });
}
