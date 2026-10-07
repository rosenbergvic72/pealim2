// Pure data helpers. IDs from spreadsheets may be either numbers or strings.
export const text = value => String(value == null ? '' : value).trim();
export const clean = value => text(value).normalize('NFC').replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ');
export const labelKey = value => text(value).normalize('NFKC').toLowerCase().replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/\s+/g, ' ');
export function normalizeLanguage(value) {
  const key = text(value).toLowerCase();
  const aliases = { russian:'ru', русский:'ru', english:'en', french:'fr', français:'fr', francais:'fr', spanish:'es', español:'es', portuguese:'pt', português:'pt', arabic:'ar', arab:'ar', العربية:'ar', amharic:'am', 'አማርኛ':'am' };
  return aliases[key] || (['ru','en','fr','es','pt','ar','am'].includes(key.split(/[-_]/)[0]) ? key.split(/[-_]/)[0] : 'en');
}
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
// Match a complete Hebrew token, retaining punctuation and the original sentence.
export function splitTarget(item) {
  const sentence = text(item.hebrew);
  const words = [...sentence.matchAll(/[\u05d0-\u05ea\u0591-\u05c7]+/g)];
  const matches = words.filter(m => clean(m[0]) === clean(item.answer));
  if(matches.length !== 1) return null;
  const m=matches[0];
  return { before:sentence.slice(0,m.index), word:m[0], after:sentence.slice(m.index+m[0].length) };
}
export function normalizeData(raw) {
  const source = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
  const counts = new Map();
  source.forEach(x => { const id=text(x?.id); counts.set(id,(counts.get(id)||0)+1); });
  const issues=[],items=[];
  source.forEach((x,index) => {
    if(!x || typeof x!=='object') { issues.push({row:index+1,reason:'not_object'}); return; }
    const item = Object.fromEntries(Object.entries(x).map(([k,v])=>[k,text(v)]));
    if(!item.id || counts.get(item.id)!==1 || !item.hebrew || !item.infinitive || !item.answer || !['present','past','future'].includes(item.tense) || !['man','woman','men','women'].includes(item.gender) || !splitTarget(item)) {
      issues.push({row:index+1,id:item.id,reason:'invalid_or_duplicate_record'}); return;
    }
    items.push(item);
  });
  return {items,byId:new Map(items.map(x=>[x.id,x])),issues};
}
export function createOptions(item, mode, language, byId) {
  if(mode===9) {
    const values=[item.answer,item.wrong1,item.wrong2,item.wrong3].map(text);
    if(values.some(v=>!v) || new Set(values.map(clean)).size!==4) return null;
    return values.map((label,i)=>({id:String(i),label,correct:i===0}));
  }
  const ids=[item.id,item.listen1,item.listen2,item.listen3].map(text);
  if(new Set(ids).size!==4) return null;
  const records=ids.map(id=>byId.get(id));
  if(records.some(x=>!x || !text(x[language]))) return null;
  if(new Set(records.map(x=>labelKey(x[language]))).size!==4) return null;
  // Written duplicate sentences with distinct IDs cannot be distinguishable by sound.
  if(new Set(records.map(x=>clean(x.hebrew))).size!==4) return null;
  return records.map((x,i)=>({id:x.id,label:x[language],correct:i===0,hebrew:x.hebrew,translit:x.translit}));
}
export function makeDeck(items, count, excluded=[], pinned=[], random=Math.random) {
  const no=new Set(excluded.map(text)),yes=new Set(pinned.map(text));
  const pool=items.filter(x=>!no.has(x.id)),size=Math.min(count,pool.length);
  const priority=shuffle(pool.filter(x=>yes.has(x.id)),random).slice(0,Math.ceil(size/2));
  const selected=new Set(priority.map(x=>x.id));
  const rest=shuffle(pool.filter(x=>!yes.has(x.id)),random).slice(0,size-priority.length);
  // Exceed half only if regular tasks cannot fill the requested session.
  if(priority.length+rest.length<size)rest.push(...shuffle(pool.filter(x=>yes.has(x.id)&&!selected.has(x.id)),random).slice(0,size-priority.length-rest.length));
  return shuffle([...priority,...rest],random);
}
export const isRealSession = (mode, preview) => !(mode===10 && preview);
