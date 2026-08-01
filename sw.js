// Prefix stays 'flick-' rather than 'flick-fc-' so activate() still recognises
// and evicts the pre-rename 'flick-pro-*' caches instead of orphaning them.
const CACHE='flick-fc-v127';
const CACHE_PREFIX='flick-';
const CORE=[
  './index.html',
  './ai-trainer.html',
  './pwa-logo-lab.html',
  './visual-design-lab.html',
  './manifest.webmanifest',
  './icons/flick-fc-192.png',
  './icons/flick-fc-512.png',
  './icons/flick-fc-180.png',
  './icons/flick-fc-maskable-512.png',
  './icons/flick-fc.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Cache each resource independently. One missing/redirected optional icon
    // must not reject the entire worker installation and strand a PWA update.
    await Promise.allSettled(CORE.map(async url=>{
      const request=new Request(url,{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok)throw new Error(`Precache failed: ${url} (${response.status})`);
      await cache.put(request,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone(),isShell=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');caches.open(CACHE).then(cache=>cache.put(isShell?'./index.html':event.request,copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
    return;
  }
  if(url.origin===location.origin){
    event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
      return response;
    })));
  }
});
