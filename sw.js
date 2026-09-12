const CACHE_NAME = 'kejian-pwa-v7-1';
const APP_SHELL = ['./','./index.html','./style.css','./theme.css','./course-density.css','./importers.js','./appearance.js','./app.js','./v5.js','./v6.js','./v7.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
const ASSET_DB='kejian-assets-v1', ASSET_STORE='assets';
const CUSTOM_ICONS={
  'custom-apple-touch-icon.png':['icon180','./icons/apple-touch-icon.png'],
  'custom-icon-192.png':['icon192','./icons/icon-192.png'],
  'custom-icon-512.png':['icon512','./icons/icon-512.png']
};
function openAssetDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(ASSET_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(ASSET_STORE))db.createObjectStore(ASSET_STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function getAsset(key){const db=await openAssetDb();return new Promise((resolve,reject)=>{const tx=db.transaction(ASSET_STORE,'readonly');const r=tx.objectStore(ASSET_STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);const custom=CUSTOM_ICONS[url.pathname.split('/').pop()];if(custom){event.respondWith((async()=>{const blob=await getAsset(custom[0]).catch(()=>null);if(blob)return new Response(blob,{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}});return caches.match(custom[1]).then(r=>r||fetch(custom[1]))})());return}event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))))});
