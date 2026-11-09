import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      input:{main:resolve('index.html'),schulte:resolve('schulte/index.html')},
      output: { manualChunks: (id: string) => id.includes('/node_modules/phaser/') ? 'phaser' : undefined },
    },
  },
  plugins: [{
    name: 'neurons-offline',
    closeBundle() {
      const html=readFileSync(resolve('dist/index.html'),'utf8');
      const shell=[...html.matchAll(/\b(?:src|href)="\.\/(assets\/[^"?]+\.(?:js|css))"/g)].map(match=>'./'+match[1]);
      const version = 'neurons-' + Date.now().toString(36);
      const homeFiles=[
        './art/Vinch.webp','./art/cloud.webp','./art/world.webp','./art/star.webp',
        ...readdirSync(resolve('public/fonts')).map((p)=>'./fonts/'+p),
        ...readdirSync(resolve('public/props')).map((p)=>'./props/'+p),
      ];
      const script = [
        "const CACHE = " + JSON.stringify(version) + ";",
        "const SCHULTE_PATH = new URL('./schulte/',self.registration.scope).pathname;",
        "const SHELL = " + JSON.stringify(['./', './index.html', './manifest.webmanifest', './icon-192.png', ...homeFiles, ...shell]) + ";",
        "self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));",
        "self.addEventListener('message',e=>{if(e.data==='activate-update')self.skipWaiting()});",
        "self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('neurons-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));",
        "self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;",
        "if(e.request.mode==='navigate'){const key=new URL(e.request.url).pathname.startsWith(SCHULTE_PATH)?'./schulte/index.html':'./index.html';e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)).catch(()=>{}))}return r}).catch(()=>caches.match(key,{ignoreVary:true})));return}",
        // Same-origin static content is identical for install-time and CORS module/font requests.
        "e.respondWith(caches.match(e.request,{ignoreVary:true}).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}))}return r})))})"
      ].join('\n');
      writeFileSync(resolve('dist/sw.js'), script);
    },
  }],
});
