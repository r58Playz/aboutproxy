importScripts('./dip/dip.worker.js');
importScripts('./uv/uv.sw.js')

const dip = new DIPServiceWorker('./dip/dip.worker.js');
const uv = new UVServiceWorker();

self.addEventListener('fetch', event => {
    if (event.request.url.startsWith(location.origin + '/dip/')) { event.respondWith(dip.fetch(event)) }
    else if (event.request.url.startsWith(location.origin + '/uv/')) { event.respondWith(uv.fetch(event)) }
});