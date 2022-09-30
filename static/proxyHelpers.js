function proxyUsingUV(url) {
    window.navigator.serviceWorker.register('./sw.js', {
        scope: __uv$config.prefix
    }).then(() => {
        setUrl(__uv$config.prefix + __uv$config.encodeUrl(url))
    });
}