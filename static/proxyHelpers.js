function proxyUsing(url, proxy) {
    if (proxy == "DIP") {
        proxyUsingDIP(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function baseUrlFor(proxy) {
    if (proxy == "DIP") {
        return window.__DIP.config.prefix;
    } else {
        console.error("Invalid proxy!");
    }
}

function decodeUrl(url, proxy) {
    if (proxy == "DIP") {
        return window.__DIP.decodeURL(url)
    } else {
        console.error("Invalid proxy!");
    }
}

function proxyUsingDIP(url) {
    window.navigator.serviceWorker.register('./sw.js', {
        scope: window.__DIP.config.prefix
    }).then(() => {
        setUrl(window.__DIP.config.prefix + window.__DIP.encodeURL(url))
    });
}