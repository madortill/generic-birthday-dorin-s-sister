/// <reference lib="webworker"/>
/// <reference lib="es2015"/>
/// <reference no-default-lib="true"/>
let cacheName = "till-service-worker";
// let location = "/";

// addEventListener("message", (e) => {
//     if ('location' in e.data)
//         location = e.data.location;
// }, false);

/**
 * 
 * @param {Client} client 
 */
function setup(client) {
    if (client) return Promise.resolve();
    let statusFile = fetch("build.version");
    return statusFile.then(statusBody => statusBody.clone().text().then(status =>
        caches.open(cacheName).then(c =>
            c.match("build.version").then(file => (file && file.text()) || Promise.resolve("")).then(onlineStatus => {
                self.refetch = status !== onlineStatus;
                if (self.refetch) {
                    caches.delete(cacheName);
                    caches.open(cacheName).then(c => c.put("build.version", statusBody.clone()));
                }
            })
        )
    )).catch(e => {
        return Promise.resolve();
    });
}

addEventListener("fetch", function (e) {
    e.respondWith(
        clients.get(e.clientId).then(client => {
            return setup(client).then(() =>
                caches.match(e.request).then(r => {
                    return (!self.refetch && e.request.method === "GET" && r) || fetch(e.request).then(response => {
                        if (!response.ok) return r || response;
                        return caches.open(cacheName).then(c => {
                            c.put(e.request, response.clone());
                            return response;
                        });
                    });
                })
            );
        })
    );
}, false);

