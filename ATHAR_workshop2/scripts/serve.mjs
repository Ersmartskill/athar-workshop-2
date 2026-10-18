import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize,resolve,sep} from 'node:path';
const ROOT=resolve('dist');
const PORT=Number(process.env.PORT||4173);
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const send=(res,code,body,type)=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-cache'});res.end(body)};
createServer(async (req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=join(ROOT,normalize(pathname));
  if(file!==ROOT&&!file.startsWith(ROOT+sep))return send(res,403,'Forbidden','text/plain; charset=utf-8');
  try{if((await stat(file)).isDirectory())file=join(file,'index.html')}catch{}
  let body;
  try{body=await readFile(file)}catch{
   try{return send(res,404,await readFile(join(ROOT,'404.html')),'text/html; charset=utf-8')}
   catch{return send(res,404,'Not found','text/plain; charset=utf-8')}
  }
  send(res,200,body,TYPES[extname(file).toLowerCase()]||'application/octet-stream');
 }catch{send(res,500,'Server error','text/plain; charset=utf-8')}
}).listen(PORT,()=>console.log(`ATHAR preview: http://localhost:${PORT}/  (serving ${ROOT})`));
