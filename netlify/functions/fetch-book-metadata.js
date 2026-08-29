function decodeHtml(s='') {
  return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#x27;/gi,"'").trim();
}
function first(re, html='') { const m = html.match(re); return m ? decodeHtml(m[1]) : ''; }
function cleanUrl(base, value='') { try { return new URL(value, base).href; } catch { return ''; } }
function jsonLd(html) {
  const out=[];
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m; while((m=re.exec(html))) { try { const v=JSON.parse(m[1].trim()); out.push(...(Array.isArray(v)?v:[v])); } catch {} }
  return out;
}
function findChapter(text='') {
  const patterns=[
    /(?:chapters?|episodes?)\s*[:\-]?\s*(\d{1,5})/i,
    /(?:total\s+chapters?|chapter\s+count)\s*[:\-]?\s*(\d{1,5})/i,
    /(?:chapter|episode)\s+(\d{1,5})(?:\s*\/\s*(\d{1,5}))?/i
  ];
  for(const r of patterns){ const m=text.match(r); if(m) return Number(m[2]||m[1]); }
  return null;
}
export default async (req) => {
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json'};
  if(req.method==='OPTIONS') return new Response('',{status:204,headers:cors});
  try {
    const body=await req.json(); const url=String(body?.url||'').trim();
    const u=new URL(url); if(!/^https?:$/.test(u.protocol)) throw new Error('Only http/https URLs are supported.');
    const r=await fetch(u.href,{headers:{'user-agent':'Mozilla/5.0 (compatible; IzVaultBot/1.0)','accept':'text/html,application/xhtml+xml'},redirect:'follow'});
    if(!r.ok) throw new Error(`Source returned HTTP ${r.status}`);
    const html=(await r.text()).slice(0,500000);
    const ld=jsonLd(html); const work=ld.find(x=>/Book|Comic|Article/i.test(String(x?.['@type']||'')))||ld.find(x=>x?.name||x?.headline)||{};
    const title=work.name||first(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,html)||first(/<title[^>]*>([\s\S]*?)<\/title>/i,html);
    const cover=cleanUrl(r.url,work.image?.url||work.image?.[0]||work.image||first(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,html));
    const author=typeof work.author==='string'?work.author:(work.author?.name||first(/<meta[^>]+(?:name|property)=["'](?:author|book:author)["'][^>]+content=["']([^"']+)/i,html));
    const genre=Array.isArray(work.genre)?work.genre.join(', '):(work.genre||first(/<meta[^>]+(?:name|property)=["'](?:genre|book:genre)["'][^>]+content=["']([^"']+)/i,html));
    const description=work.description||first(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,html);
    const text=decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
    const total_chapter=findChapter(text);
    return new Response(JSON.stringify({ok:true,url:r.url,title:title?.trim()||'',author:String(author||'').trim(),genre:String(genre||'').trim(),description:String(description||'').trim(),cover_url:cover||'',total_chapter}),{status:200,headers:cors});
  } catch(e) { return new Response(JSON.stringify({ok:false,error:e.message||'Unable to read source'}),{status:400,headers:cors}); }
};