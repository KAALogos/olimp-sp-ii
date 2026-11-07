/* OLiJP-SP: korekta bazy wewnętrznej po odblokowaniu strony. */
(function(){
"use strict";
if(window.__olWewnPatch) return;
window.__olWewnPatch=true;
var FLAG="data-ol-wfix",busy=false,queued=false;
function norm(s){return (s||"").replace(/\s+/g," ").trim().toLocaleLowerCase("pl")}
function typeByText(s){
 s=norm(s).replace(/^[^\p{L}\d]+/gu,"");
 if(/^(teoria|wiadomości|podstawy teoretyczne|objaśnienia|wyjaśnienia|reguły|definicje)(?:\b|[\s:—–-])/i.test(s))return"theory";
 if(/^(zadania|zadanie|ćwiczenia|ćwiczenie|pytania|pytanie|praktyka|sprawdź się)(?:\b|[\s:—–-]|\d)/i.test(s))return"tasks";
 return"";
}
function heading(el){
 if(/^H[2-6]$/.test(el.tagName)||el.tagName==="SUMMARY")return el;
 try{return el.querySelector(":scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6,:scope > header > h2,:scope > header > h3,:scope > summary,:scope > strong,:scope > b")}catch(e){return null}
}
function kind(el){
 if(!el||el.nodeType!==1||el.hasAttribute(FLAG))return"";
 var a=[el.id,typeof el.className==="string"?el.className:"",el.getAttribute("data-kind"),el.getAttribute("data-type"),el.getAttribute("data-section"),el.getAttribute("aria-label")].join(" ");
 if(/(?:^|[\s_-])(teoria|theory|wiadomosci)(?:$|[\s_-])/i.test(a))return"theory";
 if(/(?:^|[\s_-])(zadania|zadanie|tasks|task|cwiczenia|exercises)(?:$|[\s_-])/i.test(a))return"tasks";
 var h=heading(el);
 if(h)return typeByText(h.textContent);
 return el.tagName==="LI"?typeByText((el.textContent||"").slice(0,100)):"";
}
function root(){
 if(!/(?:#|\/)wewn(?:$|[/?&-])/i.test(location.hash||""))return null;
 var sel=["#wewn","#view-wewn","#panel-wewn","#wewn-content",'[data-view="wewn"]','[data-tab="wewn"]','[data-section="wewn"]','[id*="wewn"]','[class*="wewn"]'];
 var arr=[];
 sel.forEach(function(q){try{document.querySelectorAll(q).forEach(function(e){
 if(e.matches("a,button,nav,script,style")||e.closest("nav")||(e.textContent||"").length<180||getComputedStyle(e).display==="none")return;
 if(arr.indexOf(e)<0)arr.push(e)
})}catch(x){}});
 arr.sort(function(a,b){return a.textContent.length-b.textContent.length});
 if(arr[0])return arr[0];
 var h=Array.from(document.querySelectorAll("main h1,main h2,main h3,section h1,section h2,section h3")).find(function(e){return /baza\s+wewn/i.test(e.textContent)});
 if(h){var p=h.closest("section,article,[role=tabpanel],.panel,.view,main");if(p&&(p.textContent||"").length>180)return p}
 return null;
}
function css(){
 if(document.getElementById("ol-wfix-style"))return;
 var s=document.createElement("style");s.id="ol-wfix-style";s.textContent=[
 ".ol-wfix-scope strong,.ol-wfix-scope b{font-weight:750!important}",
 ".ol-wfix-group{border:1px solid var(--line,#c8ced9);border-radius:12px;padding:.8rem;margin:1rem 0;background:var(--card,transparent)}",
 ".ol-wfix-tabs{display:flex;gap:.45rem;flex-wrap:wrap;margin-bottom:.7rem}",
 ".ol-wfix-tabs button{font:inherit;font-size:.94rem;font-weight:700;cursor:pointer;padding:.52rem .95rem;border-radius:8px;border:1px solid var(--line,#99a8bb);background:transparent;color:var(--ink,inherit);margin:0;width:auto;min-width:7rem}",
 ".ol-wfix-tabs button[aria-selected=true]{background:var(--acc,#1f5fbf);color:#fff;border-color:var(--acc,#1f5fbf)}",
 ".ol-wfix-panel[hidden]{display:none!important}",
 ".ol-wfix-panel>*+*{margin-top:.6rem}",
 ".ol-wfix-sort{display:flex;align-items:center;justify-content:flex-end;gap:.5rem;margin:.5rem 0;flex-wrap:wrap}",
 ".ol-wfix-sort label{font-size:.88rem;margin:0;font-weight:600}",
 ".ol-wfix-sort select{font:inherit;color:inherit;background:var(--card,#fff);padding:.35rem;border:1px solid var(--line,#aab7ca);border-radius:7px}",
 "@media(max-width:520px){.ol-wfix-group{padding:.6rem}.ol-wfix-tabs button{min-width:0;flex:1}}"
 ].join("\n");document.head.appendChild(s);
}
function bold(el){
 var walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),pending=[],n;
 while((n=walk.nextNode())&&pending.length<3000){
  if(!/(\*\*|__)\S/.test(n.nodeValue||""))continue;
  if(n.parentElement&&n.parentElement.closest("script,style,textarea,pre,code,svg,button,[contenteditable]"))continue;
  pending.push(n)
 }
 pending.forEach(function(t){
  if(!t.parentNode)return;
  var s=t.nodeValue,re=/(\*\*|__)(\S(?:[\s\S]*?\S)?)(\1)/g,frag=document.createDocumentFragment(),start=0,m,ok=false;
  while((m=re.exec(s))){
   if(!m[2]||m[2].length>1000||/[\r\n]{3,}/.test(m[2]))continue;
   if(m.index>start)frag.appendChild(document.createTextNode(s.slice(start,m.index)));
   var strong=document.createElement("strong");strong.textContent=m[2];frag.appendChild(strong);
   start=re.lastIndex;ok=true;
  }
  if(ok){if(start<s.length)frag.appendChild(document.createTextNode(s.slice(start)));t.parentNode.replaceChild(frag,t)}
 })
}
function rank(el){
 var p=norm(el.getAttribute("data-priority")||el.getAttribute("data-importance")||el.getAttribute("data-usefulness")||"");
 if(/^(1|wysoki|wysoka|najwyższy|bardzo wysoka|high|critical)$/.test(p))return 100;
 if(/^(2|średni|średnia|medium)$/.test(p))return 65;
 if(/^(3|niski|niska|low)$/.test(p))return 25;
 var t=norm((el.textContent||"").slice(0,400));
 if(/(?:priorytet|przydatność|ważność)\s*[:—–-]?\s*(?:najwyższa|bardzo wysoka|wysoka)/.test(t))return 100;
 if(/(?:priorytet|przydatność|ważność)\s*[:—–-]?\s*średnia/.test(t))return 65;
 if(/(?:priorytet|przydatność|ważność)\s*[:—–-]?\s*niska/.test(t))return 25;
 if(/olimpijsk|arkusz|egzaminacyjn|etap ii|najważniejsz/.test(t))return 92;
 if(/uzasadnij|zinterpretuj|przeanalizuj|porównaj|wykaż|oceń|sformułuj argument/.test(t))return 77;
 if(/wyjaśnij|rozpoznaj|przekształć|zastosuj|wskaż|omów|ustal/.test(t))return 63;
 if(/uzupełnij|zaznacz|dopasuj|podkreśl|wybierz|wpisz/.test(t))return 42;
 if(/dodatkowe|opcjonalne|dla chętnych/.test(t))return 20;
 return 55;
}
function sorting(panel){
 var lists=[];
 panel.querySelectorAll("ol,ul").forEach(function(l){var a=Array.from(l.children);if(a.length>=2&&a.every(function(e){return e.tagName==="LI"}))lists.push({parent:l,items:a})});
 if(!lists.length){var a=Array.from(panel.children).filter(function(e){return !e.classList.contains("ol-wfix-sort")&&!/^H[1-6]$/.test(e.tagName)});
 if(a.length>=3&&a.every(function(e){return e.matches("article,section,details,li,[class*=task],[class*=zadani],[data-priority]")}))lists.push({parent:panel,items:a})}
 lists.forEach(function(l){
  var original=l.items.slice(),scores=original.map(rank),vary=scores.some(function(v){return v!==scores[0]});
  var bar=document.createElement("div");bar.className="ol-wfix-sort";
  var label=document.createElement("label");label.textContent="Kolejność zadań:";
  var select=document.createElement("select");
  [["priority","Według przydatności"],["original","Pierwotna"],["az","Alfabetycznie"]].forEach(function(item){var opt=document.createElement("option");opt.value=item[0];opt.textContent=item[1];select.appendChild(opt)});
  var id="ol-wfix-sort-"+Math.random().toString(36).slice(2);select.id=id;label.htmlFor=id;
  function reorder(mode){original.map(function(el,i){return{el:el,i:i,score:scores[i]}}).sort(function(a,b){
   if(mode==="priority")return b.score-a.score||a.i-b.i;
   if(mode==="az")return norm(a.el.textContent).localeCompare(norm(b.el.textContent),"pl")||a.i-b.i;
   return a.i-b.i;
  }).forEach(function(v){l.parent.appendChild(v.el)})}
  select.addEventListener("change",function(){reorder(select.value)});
  bar.appendChild(label);bar.appendChild(select);
  l.parent.insertBefore(bar,l.parent.firstChild);
  if(vary)reorder("priority");else select.value="original";
 })
}
function split(p){
 if(!p||p.nodeType!==1||p.hasAttribute(FLAG))return false;
 var nodes=Array.from(p.children);if(nodes.length<2||nodes.length>70)return false;
 var groups=[],current=null;
 nodes.forEach(function(e){var k=kind(e);
  if(k){current={k:k,nodes:[e]};groups.push(current)}
  else if(current&&!/^H[1-6]$/.test(e.tagName)&&e.tagName!=="SUMMARY")current.nodes.push(e);
  else current=null
 });
 if(!groups.some(function(g){return g.k==="theory"})||!groups.some(function(g){return g.k==="tasks"}))return false;
 var first=groups[0].nodes[0],last=groups[groups.length-1].nodes.slice(-1)[0];
 if(nodes.slice(nodes.indexOf(first),nodes.indexOf(last)+1).some(function(e){
  return /^H[1-6]$/.test(e.tagName)&&!kind(e)&&/rozdział|dział|temat|lekcja/i.test(e.textContent||"")
 }))return false;
 p.setAttribute(FLAG,"1");
 var group=document.createElement("div");group.className="ol-wfix-group";group.setAttribute(FLAG,"1");
 var nav=document.createElement("div");nav.className="ol-wfix-tabs";nav.setAttribute("role","tablist");
 var a=document.createElement("div"),b=document.createElement("div"),buttons={};
 a.className=b.className="ol-wfix-panel";a.id="ol-wfix-teoria-"+Math.random().toString(36).slice(2);b.id="ol-wfix-zadania-"+Math.random().toString(36).slice(2);b.hidden=true;
 [["theory","Teoria",a],["tasks","Zadania",b]].forEach(function(info){
  var btn=document.createElement("button");btn.type="button";btn.textContent=info[1];btn.setAttribute("role","tab");btn.setAttribute("aria-controls",info[2].id);btn.setAttribute("aria-selected",String(info[0]==="theory"));
  btn.addEventListener("click",function(){["theory","tasks"].forEach(function(k){var yes=k===info[0];buttons[k].setAttribute("aria-selected",String(yes));(k==="theory"?a:b).hidden=!yes})});
  buttons[info[0]]=btn;nav.appendChild(btn)
 });
 group.appendChild(nav);group.appendChild(a);group.appendChild(b);p.insertBefore(group,first);
 groups.forEach(function(g){g.nodes.forEach(function(e){(g.k==="theory"?a:b).appendChild(e)})});
 sorting(b);return true;
}
function run(){
 if(busy)return;busy=true;
 try{var r=root();if(!r)return;
  r.classList.add("ol-wfix-scope");css();bold(r);
  var els=[r].concat(Array.from(r.querySelectorAll("article,section,details,div,li")));
  function depth(e){var n=0;while(e&&e!==r){n++;e=e.parentElement}return n}
  els.sort(function(a,b){return depth(b)-depth(a)});
  els.forEach(function(e){if(e.isConnected&&!e.hasAttribute(FLAG)&&!e.closest(".ol-wfix-group"))split(e)})
 }finally{busy=false}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;run()})}
window.addEventListener("hashchange",schedule);
document.addEventListener("click",function(){setTimeout(schedule,50)},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule);else schedule();
new MutationObserver(function(m){
 if(/(?:#|\/)wewn(?:$|[/?&-])/i.test(location.hash||"")&&m.some(function(x){return x.addedNodes&&x.addedNodes.length}))schedule()
}).observe(document.documentElement,{subtree:true,childList:true});
})();