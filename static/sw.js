importScripts('./dip/dip.worker.js');

const sw = new DIPServiceWorker('./dip/dip.worker.js');

self.addEventListener('fetch', event =>
    event.respondWith(
        sw.fetch(event)
    )
);