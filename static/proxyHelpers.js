function proxyUsingDIP(url) {
    window.navigator.serviceWorker.register('./sw.js', {
        scope: window.__DIP.config.prefix
    }).then(() => {
        setUrl(window.__DIP.config.prefix + window.__DIP.encodeURL(url))
    });
}