importScripts('./uv/uv.bundle.js');
importScripts('./uv/uv.config.js');
importScripts('./uv/uv.sw.js');

importScripts('./dynamic/dynamic.config.js');
importScripts('./dynamic/dynamic.worker.js');

const uv = new UVServiceWorker();
const dynamic = new Dynamic();

self.addEventListener('fetch', event => {
    event.respondWith(
        (async ()=>{
            if(event.request.url.startsWith(location.origin + __uv$config.prefix)) {
                return await uv.fetch(event);
            } else if(await dynamic.route(event)) {
                return await dynamic.fetch(event);
            }
            return await fetch(event.request);
        })()
    );
});
