// Indice del database centrale: legge gli inventari esistenti e scrive content/catalog/index.json e GAPS.md.
// Non modifica HTML, non pubblica, non assegna date di verifica: riporta solo quelle gia' presenti nelle fonti.
import fs from 'node:fs';
const J=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const out=[];const gaps=[];
const races=J('content/races.json');
for(const r of races.races){out.push({type:'race',id:r.id,name:r.name,path:'/gare/'+r.slug.it+'/',collectionVerified:races.verified,itemVerified:null,course:r.courseSource?'official-source':'not-verified'});
 if(!r.courseSource)gaps.push(`Gara ${r.name}: percorso non verificato da fonte ufficiale`);}
const news=J('content/news.json');
for(const n of news.items){out.push({type:'news',id:n.id,name:n.name,collectionVerified:news.verified,itemVerified:null,date:n.date});}
const trips=J('content/trips.json');
for(const t of trips.trips){out.push({type:'trip',id:t.id,name:t.name,collectionVerified:trips.verified,itemVerified:null});}
const rev=J('content/article-review.json');
for(const k of Object.keys(rev)){out.push({type:'article',id:k,evidence:rev[k].lv??null,stars:rev[k].stars??null,itemVerified:null});}
const prods=J('content/catalog/products.json').products;
for(const p of prods){out.push({type:'product',id:p.id,name:p.brand+' '+p.model,status:p.status,itemVerified:p.lastVerified,affiliate:p.affiliate.program,ownTest:p.ownTest});
 if(!p.ownTest)gaps.push(`Prodotto ${p.brand} ${p.model}: nessun test nostro (non e' un requisito, ma non va simulato)`);
 if(!p.affiliate.program)gaps.push(`Prodotto ${p.brand} ${p.model}: nessun programma affiliato attivo`);}
fs.writeFileSync('content/catalog/index.json',JSON.stringify({schema:'wolflab-catalog-index/1',generated:'by tools/catalog.mjs',items:out},null,1));
fs.writeFileSync('content/catalog/GAPS.md','# Lacune del database centrale (generato da tools/catalog.mjs)\n\nUn elemento ha "itemVerified" solo se la verifica e\' stata fatta e registrata su quell\'elemento. "collectionVerified" e\' la data dell\'ultima verifica dichiarata per l\'intero inventario, non per ogni voce.\n\n'+gaps.map(g=>'- '+g).join('\n')+'\n');
console.log(out.length,'voci,',gaps.length,'lacune');
