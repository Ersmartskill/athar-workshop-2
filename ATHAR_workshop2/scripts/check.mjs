import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const PAGES=['index.html','about.html','offline.html'];
const docs=Object.fromEntries(await Promise.all(PAGES.map(async p=>[p,await readFile(p,'utf8')])));
const ids=Object.fromEntries(PAGES.map(p=>[p,[...docs[p].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])]));
for(const p of PAGES){
 assert.match(docs[p],/<html lang="ar" dir="rtl">/,`${p}: not Arabic RTL`);
 assert.ok(!/https?:\/\//.test(docs[p]),`${p}: unexpected external dependency`);
 assert.equal(new Set(ids[p]).size,ids[p].length,`${p}: duplicate HTML IDs`);
 for(const m of docs[p].matchAll(/href="#([^"]+)"/g))assert.ok(ids[p].includes(m[1]),`${p}: missing anchor: ${m[1]}`);
 for(const m of docs[p].matchAll(/(?:href|src)="(\.\/[^"]+)"/g)){
  const [rawFile,fragment]=m[1].split('#');
  const file=rawFile==='./'?'index.html':rawFile.slice(2);
  await access(file);
  if(fragment)assert.ok((docs[file]??await readFile(file,'utf8')).includes(`id="${fragment}"`),`${p}: missing cross-page anchor: ${m[1]}`);
 }
}
const manifest=JSON.parse(await readFile('manifest.webmanifest','utf8'));
for(const key of ['name','short_name','start_url','scope','display','theme_color','icons'])assert.ok(key in manifest,`manifest: missing ${key}`);
assert.match(manifest.start_url,/^\.\//,'manifest: start_url must stay relative');
for(const icon of manifest.icons){
 const file=icon.src.slice(2),bytes=await readFile(file);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`manifest: ${file} is not a PNG`);
 const [w,h]=icon.sizes.split('x').map(Number);
 assert.ok(bytes.readUInt32BE(16)===w&&bytes.readUInt32BE(20)===h,`manifest: ${file} is not ${icon.sizes}`);
}
assert.ok(manifest.icons.some(i=>i.sizes==='192x192')&&manifest.icons.some(i=>i.sizes==='512x512'),'manifest: missing installable 192/512 icons');
const sw=await readFile('sw.js','utf8');
for(const m of sw.match(/const FILES = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g))await access(m[1]==='./'?'index.html':m[1].slice(2));
const context={window:{}};vm.runInNewContext(await readFile('data.js','utf8'),context);
const d=context.window.ATHAR_DATA;assert.equal(d.paths.length,6);assert.equal(d.challenges.length,5);
assert.equal(new Set(d.paths.map(p=>p.id)).size,6);assert.equal(new Set(d.challenges.map(c=>c.id)).size,5);
for(const p of d.paths){assert.equal(p.lessons.length,3);assert.equal(p.exercises.length,3)}
console.log('Passed: Arabic RTL, unique IDs, navigation targets, local assets, independent about page, manifest icons and dimensions, service-worker cache list, six paths and five challenges.');
