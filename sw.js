importScripts('https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js');
importScripts('/assets/js/utils/db-utils.js');
importScripts('/assets/js/utils/sw-utils.js');

const DYNAMIC_CACHE = 'dynamic1'
const STATIC_CACHE = 'staticv1';
const INMUTABLE_CACHE = 'inmutablev1';
//const STATIC_LIMIT = 15;

const DYNAMIC_LIMIT = 30;

const APP_SHELL = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/img/img-404.png',
    '/assets/img/not-found.svg',
    '/assets/img/report.ico',
    '/assets/img/reports.png',
    '/assets/js/auth/signin.js',
    '/assets/js/admin/admin.home.controller.js',
    '/assets/js/admin/admin.users.controller.js',
    '/assets/js/axios/axios-intance.js',
    '/assets/js/toast/toasts.js',
    '/assets/js/main.js'
];
const APP_SHELL_INMUTABLE = [
    '/assets/js/jquery-3.7.1.min.js',
    '/assets/vendor/bootstrap/css/bootstrap.css',
    '/assets/vendor/bootstrap/js/bootstrap.js',
    '/assets/vendor/bootstrap-icons/bootstrap-icons.css',
    '/assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff',
    '/assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2',
    '/assets/vendor/boxicons/css/animations.css',
    '/assets/vendor/boxicons/fonts/boxicons.eot',
    '/assets/vendor/boxicons/fonts/boxicons.svg',
    '/assets/vendor/boxicons/fonts/boxicons.ttf',
    '/assets/vendor/boxicons/fonts/boxicons.woff',
    '/assets/vendor/boxicons/fonts/boxicons.woff2',
    '/assets/vendor/simple-datatables/simple-datatables.js',
    '/assets/vendor/simple-datatables/style.css',
    '/pages/admin/home.html',
    '/pages/admin/users.html',
    '/pages/attendant/home.html',
    '/pages/auth/register.html',
    '/pages/docent/home.html',
    '/pages/docent/incidences.html'
];

const clear = (cachesName, items = 50) => {
    caches.open(cachesName).then((cache) => {
        return cache.keys().then((keys) => {
            if (keys.length > items) {
                cache.delete(keys[0]).then(clear(cachesName, items));
            }
        }).catch();
    }).catch();
}

self.addEventListener("install", (e) => {
    const static = caches.open(STATIC_CACHE).then((cache) => { //(open)abrir un cache si existe
        cache.addAll(APP_SHELL);
    });
    const inmutable = caches.open(INMUTABLE_CACHE).then((cache) => {//(cache) devuelve si encuentra
        cache.addAll(APP_SHELL_INMUTABLE);
    });
    e.waitUntil(Promise.all([static, inmutable]));
    console.log("Instalado");
})

self.addEventListener("activate", e => {
    const response = caches.keys().then((keys) => {
        keys.forEach((key) => {
            if (key !== STATIC_CACHE && key.includes('static')) {
                return caches.delete(key);
            }
            if (key !== DYNAMIC_CACHE && key.includes('dynamic')) {
                return caches.delete(key);
            }
        })
    });
    e.waitUntil(response);
    console.log("Activado");
})
self.addEventListener("fetch", (e) => {
    let response;
    if (e.request.url.includes('/api/')) {
        //Network with cache fallback 
        response = apiIncidenceManager(DYNAMIC_CACHE, e.request);
    }else{
        //cache with network update
        response = caches.match(e.request).then((cacheRes) => {
            if (cacheRes) {
                updateStaticCache(STATIC_CACHE,e.request,APP_SHELL_INMUTABLE);
                return cacheRes;
            }else{
                return fetch(e.request).then( (res) => {
                    return updateDynamicCache(DYNAMIC_CACHE,e.request,res);
                });
            }
        })
    }
    e.respondWith(response);
})

self.addEventListener('sync', e => {
    if (e.tag === 'incidence-post') {
        e.waitUntil(savePostIncidence());
    }
})