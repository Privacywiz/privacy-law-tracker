// Map constants: 2024 state population (millions), names, tile-grid layout
const POP = {AL:5.16,AK:.74,AZ:7.58,AR:3.09,CA:39.43,CO:5.96,CT:3.68,DE:1.05,DC:.70,FL:23.37,GA:11.18,HI:1.45,ID:2.0,IL:12.71,IN:6.92,IA:3.24,KS:2.97,KY:4.59,LA:4.6,ME:1.41,MD:6.26,MA:7.14,MI:10.14,MN:5.79,MS:2.94,MO:6.25,MT:1.14,NE:2.01,NV:3.27,NH:1.41,NJ:9.5,NM:2.13,NY:19.87,NC:11.05,ND:.80,OH:11.88,OK:4.1,OR:4.27,PA:13.08,RI:1.11,SC:5.48,SD:.92,TN:7.23,TX:31.29,UT:3.5,VT:.65,VA:8.81,WA:7.96,WV:1.77,WI:5.96,WY:.59};
const NAMES = {AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
const LAYOUT = [["AK",0,0],["ME",11,0],["WI",6,1],["VT",10,1],["NH",11,1],["WA",1,2],["ID",2,2],["MT",3,2],["ND",4,2],["MN",5,2],["IL",6,2],["MI",7,2],["NY",9,2],["MA",10,2],["OR",1,3],["NV",2,3],["WY",3,3],["SD",4,3],["IA",5,3],["IN",6,3],["OH",7,3],["PA",8,3],["NJ",9,3],["CT",10,3],["RI",11,3],["CA",1,4],["UT",2,4],["CO",3,4],["NE",4,4],["MO",5,4],["KY",6,4],["WV",7,4],["VA",8,4],["MD",9,4],["DE",10,4],["AZ",2,5],["NM",3,5],["KS",4,5],["AR",5,5],["TN",6,5],["NC",7,5],["SC",8,5],["DC",9,5],["OK",4,6],["LA",5,6],["MS",6,6],["AL",7,6],["GA",8,6],["HI",0,7],["TX",4,7],["FL",9,7]];


// ---------- Privacy Law Tracker site (Gilded Brief). Data comes from data/laws.json, synced nightly from Airtable. ----------
(function(){
const h = React.createElement, {useState, useMemo, useEffect} = React;
const G = window.GildedBrief;
const DEFAULT = {where:"all",users:250000,rev:false,pct:0,sells:true,sensitive:false,small:false,kids:false,hipaa:false,fin:false,edu:false,bio:false,eu:false};
const PICK0 = ["CA","TX","NY","FL","IL","WA","CO","VA","MD","OR"];
const fmt = n => n>=1e6? (n/1e6).toFixed(1).replace(/\.0$/,"")+"M" : n>=1000? Math.round(n/1000)+"K" : String(n);
const fmtDate = iso => { if(!iso) return null; const d = new Date(iso.length===10? iso+"T12:00:00" : iso); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const FLAG = {"Kids under 13":"kids","HIPAA entity":"hipaa","Financial institution":"fin","Student records":"edu","EU users":"eu"};
const WHY = {"Kids under 13":"Service aimed at or used by kids under 13","HIPAA entity":"HIPAA covered entity or business associate","Financial institution":"Financial institution","Student records":"Software handling student records for schools","EU users":"Users in the EU"};

function icon(name, size){
  const p = {width:size||14,height:size||14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"};
  if(name==="check") return h("svg",p,h("path",{d:"M5 12.5l4.5 4.5L19 7.5"}));
  if(name==="cross") return h("svg",p,h("path",{d:"M7 7l10 10M17 7L7 17"}));
  if(name==="alert") return h("svg",p,h("circle",{cx:12,cy:12,r:9}),h("path",{d:"M12 7.5v5"}),h("circle",{cx:12,cy:16.5,r:.9,fill:"currentColor"}));
  return null;
}

// ---- Coverage rules, driven entirely by the Airtable "Checker" fields ----
function pctOK(pct, ch){ if(ch.altPct==null) return false; if(ch.altPct===0) return pct>0; return ch.altInclusive ? pct>=ch.altPct : pct>ch.altPct; }
function covered(L, c, a){
  const ch = L.checker; if(!(c>0)) return null;
  if(ch.unlessSmall) return a.small ? null : "Not an SBA small business, and this law has no user-count threshold";
  if(ch.requiresRevenue && !a.rev) return null;
  if(ch.revenueAlone && a.rev) return "Annual revenue of $25M or more";
  if(ch.anySensitive && a.sensitive) return "Processes sensitive data, which triggers coverage at any volume";
  if(ch.anySale && a.sells) return "Sells personal data, which triggers coverage at any volume";
  if(ch.min!=null && c>=ch.min && (!ch.volumeOnlyIfSelling || a.sells)) return `About ${fmt(c)} ${NAMES[L.state]} users, at or above the ${fmt(ch.min)} threshold`;
  if(ch.alt!=null && c>=ch.alt && pctOK(a.pct,ch)) return ch.alt<=1 ? `${a.pct}% of revenue from selling personal data` : `About ${fmt(c)} ${NAMES[L.state]} users plus ${a.pct}% of revenue from selling data`;
  return null;
}
function evaluate(laws, a, picked){
  const states = a.where==="all" ? Object.keys(POP) : [...picked];
  const total = states.reduce((s,k)=>s+POP[k],0) || 1;
  const est = {}; for(const k of Object.keys(POP)) est[k] = states.includes(k) ? Math.round(a.users*POP[k]/total) : 0;
  return laws.map(L=>{
    const proposed = L.status==="Proposed";
    if(L.trigger==="State thresholds" && L.state){
      const c = est[L.state] || 0, ch = L.checker; let r;
      if((r = covered(L,c,a))) return {L, level:"apply", why:r};
      if(c>0 && covered(L,Math.round(c*1.5),a)) return {L, level:"likely", why:`About ${fmt(c)} ${NAMES[L.state]} users, close to the threshold. Count your actual users here before deciding.`};
      if(ch.unlessSmall && c>0 && a.small && a.sensitive && a.sells) return {L, level:"likely", why:"The small-business exception applies, but selling sensitive data still needs consent."};
      if(ch.dutyBelow && c>0) return {L, level:"likely", why:ch.dutyBelow};
      return {L, level:"none", why: c>0 ? `Below the threshold, with about ${fmt(c)} ${NAMES[L.state]} users.` : `None. You have no users in ${NAMES[L.state]||L.jurisdiction}.`};
    }
    if(L.trigger==="Biometrics"){
      const inState = L.state ? (est[L.state]||0)>0 : true;
      return a.bio && inState ? {L, level:"apply", why:`Uses biometrics with ${L.state?NAMES[L.state]+" ":""}users`} : {L, level:"none", why:"None of your answers trigger this law."};
    }
    if(L.trigger==="Watch: everyone") return {L, level:"watch", why:"Not law. Would reshape U.S. privacy rules if enacted."};
    if(L.trigger==="Watch: minors or ad selling") return (a.kids||a.sells) ? {L, level:"watch", why:"Not law yet. Worth designing for if minors use your product or you run targeted ads."} : {L, level:"none", why:"None of your answers trigger this law."};
    const flag = FLAG[L.trigger];
    if(flag && a[flag]) return {L, level: proposed?"watch":"apply", why: WHY[L.trigger]};
    return {L, level:"none", why:"None of your answers trigger this law."};
  });
}

const TAG = {apply:{tone:"yes",label:"Applies"}, likely:{tone:"neutral",label:"Confirm"}, watch:{tone:"neutral",label:"Proposed"}, none:{tone:"no",label:"Not triggered"}};
const ORDER = {apply:0, likely:1, watch:2, none:3};
const where = L => L.state ? NAMES[L.state] : (L.jurisdiction || "");
const SENS = {"Opt-in consent":"Opt-in consent","Notice and opt-out":"Notice and opt-out","Right to limit use":"Right to limit use","Strictly necessary only":"Strictly necessary only"};
const buildItems = txt => (txt||"").split("\n").map(s=>s.trim()).filter(Boolean).map(s=> s.startsWith("- ") ? {t:s.slice(2), note:false} : {t:s, note:true});
const effText = L => L.status==="Proposed" ? "Not in effect" : [fmtDate(L.effective)||fmtDate(L.enforcementDate), L.enforcementDate && L.effective && L.enforcementDate!==L.effective ? `enforced from ${fmtDate(L.enforcementDate)}` : null].filter(Boolean).join(", ") || "See summary";

function Pill({name, value, checked, onChange, children}){
  return h("label",{className:"pill"+(checked?" on":"")},
    h("input",{type:"radio",name,value,checked,onChange,id:name+"-"+value}), checked?icon("check",14):null, children);
}
function Check({id, checked, onChange, children}){
  return h("label",{className:"check",htmlFor:id}, h("input",{type:"checkbox",id,checked,onChange}), h("span",null,children));
}

function Questionnaire({a, set, edited, reset, pickCount}){
  return h("form",{className:"qcard",onSubmit:e=>e.preventDefault(),"aria-label":"Your product"},
    h("div",{style:{display:"flex",flexDirection:"column",gap:"6px"}},
      h("p",{className:"label"},"Your product"),
      h("h2",{className:"heading-3"},"Tell us how you handle data"),
      edited ? null : h("p",{className:"example"},"These are example answers. Replace them with yours.")),
    h("fieldset",null, h("legend",null,"Where are your users?"),
      h("div",{className:"pills"},
        h(Pill,{name:"where",value:"all",checked:a.where==="all",onChange:()=>set("where","all")},"All U.S. states"),
        h(Pill,{name:"where",value:"pick",checked:a.where==="pick",onChange:()=>set("where","pick")},"Only some states")),
      a.where==="pick" ? h("p",{className:"body-small muted"},`Select states on the map. ${pickCount} selected.`) : null),
    h("fieldset",null, h("legend",null,h("label",{htmlFor:"users"},"U.S. people whose data you process each year")),
      h("div",{className:"field"}, h("input",{id:"users",type:"number",min:0,step:1000,inputMode:"numeric",value:a.users,onChange:e=>set("users",Math.max(0,+e.target.value||0))})),
      h("p",{className:"body-small muted"},"Users, visitors and customers. We estimate each state's share from its population.")),
    h("fieldset",null, h("legend",null,"Annual revenue"),
      h("div",{className:"pills"},
        h(Pill,{name:"rev",value:"low",checked:!a.rev,onChange:()=>set("rev",false)},"Under $25M"),
        h(Pill,{name:"rev",value:"high",checked:a.rev,onChange:()=>set("rev",true)},"$25M or more"))),
    h("fieldset",null, h("legend",null,h("label",{htmlFor:"pct"},"Share of revenue from selling personal data (%)")),
      h("div",{className:"field"}, h("input",{id:"pct",type:"number",min:0,max:100,step:1,inputMode:"numeric",value:a.pct,onChange:e=>set("pct",Math.min(100,Math.max(0,+e.target.value||0)))}))),
    h("fieldset",null, h("legend",null,"What does your product do with data?"),
      h("div",{className:"checks"},
        h(Check,{id:"sells",checked:a.sells,onChange:e=>set("sells",e.target.checked)},"We sell data, or share it for targeted ads (ad pixels, data partners)"),
        h(Check,{id:"sensitive",checked:a.sensitive,onChange:e=>set("sensitive",e.target.checked)},"We collect sensitive data: health, precise location, biometrics, race, religion, sexuality, immigration status, government IDs or financial log-ins"),
        h(Check,{id:"small",checked:a.small,onChange:e=>set("small",e.target.checked)},"We're a small business under SBA size standards"))),
    h("fieldset",null, h("legend",null,"Special situations"),
      h("div",{className:"checks"},
        h(Check,{id:"kids",checked:a.kids,onChange:e=>set("kids",e.target.checked)},"Our service is aimed at kids under 13, or we know kids use it"),
        h(Check,{id:"hipaa",checked:a.hipaa,onChange:e=>set("hipaa",e.target.checked)},"We're a HIPAA covered entity or business associate"),
        h(Check,{id:"fin",checked:a.fin,onChange:e=>set("fin",e.target.checked)},"We're a financial institution (lending, payments, investing, insurance)"),
        h(Check,{id:"edu",checked:a.edu,onChange:e=>set("edu",e.target.checked)},"We provide software to schools that handles student records"),
        h(Check,{id:"bio",checked:a.bio,onChange:e=>set("bio",e.target.checked)},"We use face, voice, fingerprint or iris recognition"),
        h(Check,{id:"eu",checked:a.eu,onChange:e=>set("eu",e.target.checked)},"We have users in the EU"))),
    h("div",null, h(G.Button,{variant:"secondary",size:"sm",onClick:reset},"Clear answers")));
}

function ArchMap({out, a, picked, view, setView, onTile}){
  const byState = {}; for(const r of out) if(r.L.state && r.L.trigger!=="Hidden" && !(byState[r.L.state] && byState[r.L.state].L.trigger==="State thresholds")) byState[r.L.state] = r;
  const tiles = LAYOUT.map(([st,col,row])=>{
    const r = byState[st], L = r && r.L, bioOnly = L && L.trigger==="Biometrics";
    let cls = "tile", mk = null, label = NAMES[st], sub = null;
    if(view==="all"){
      if(L){ cls += bioOnly?" bio":" law"; sub = L.abbr.split(" ")[0]; label += `: ${L.name}`; }
      else label += ": no comprehensive privacy law";
    } else {
      const inScope = a.where==="all" || picked.has(st);
      if(inScope && r && r.level==="apply"){ cls+=" apply"; mk=icon("check",11); label += `: ${L.abbr} applies`; }
      else if(inScope && r && r.level==="likely"){ cls+=" likely"; mk=icon("alert",11); label += `: ${L.abbr}, confirm`; }
      else if(L){ cls += bioOnly?" bio":" law"; label += `: ${L.abbr} not triggered`; }
      else label += ": no comprehensive privacy law";
      if(a.where==="pick" && picked.has(st)){ cls+=" picked"; label += " (selected)"; }
    }
    return h("button",{key:st,type:"button",className:cls,style:{gridColumn:col+1,gridRow:row+1},title:label,"aria-label":label,onClick:()=>onTile(st, L)},
      mk ? h("span",{className:"mk"},mk) : null, h("span",null,st), sub ? h("span",{className:"sub"},sub) : null);
  });
  const legend = view==="all"
    ? [["var(--surface-raised)","Comprehensive privacy law"],["linear-gradient(135deg,var(--rose-pastel),var(--blush))","Biometric law only"],["transparent","No comprehensive law",true]]
    : [["var(--sapphire)","Applies to you (check mark)"],["linear-gradient(135deg,var(--rose-pastel),var(--blush))","Confirm: close to threshold (alert mark)"],["var(--surface-raised)","Law exists, not triggered"],["transparent","No comprehensive law",true]];
  const fed = out.filter(r=>!r.L.state);
  return h("section",{className:"arch","aria-labelledby":"mapH"},
    h("div",{className:"arch-crown"},
      h("h2",{className:"heading-2",id:"mapH"},"Across the states"),
      h("div",{className:"tabs",role:"tablist","aria-label":"Map view"},
        h("button",{role:"tab","aria-selected":view==="you",onClick:()=>setView("you")},"Your results"),
        h("button",{role:"tab","aria-selected":view==="all",onClick:()=>setView("all")},"All state laws"))),
    h("div",{className:"mapscroll"}, h("div",{className:"tilemap",role:"group","aria-label":"U.S. states"}, tiles)),
    h("div",{className:"legend"}, legend.map(([bg,t,dashed],i)=>h("span",{key:i},h("i",{className:"sw",style:{background:bg,border:dashed?"1px dashed var(--border)":"1px solid rgba(42,33,64,.15)"}}),t))),
    h("div",{className:"fed"},
      h("span",{className:"label"},"Federal and international"),
      fed.map(r=>h("button",{key:r.L.id,type:"button",className:"fedchip "+(view==="you"?r.level:""),onClick:()=>onTile(null,r.L),"aria-label":r.L.name+(view==="you"&&r.level==="apply"?", applies":view==="you"&&r.level==="watch"?", proposed":"")},
        view==="you"&&r.level==="apply"?icon("check",13):null, r.L.abbr))));
}

function Verdict({apply, likely, watch}){
  const n = apply.length;
  return h("section",{className:"verdict","aria-labelledby":"verdictH"},
    h("div",{className:"seal","aria-hidden":"true"}, h("b",null,n), h("span",null,n===1?"Law":"Laws")),
    h("div",{style:{display:"flex",flexDirection:"column",gap:"12px",minWidth:0}},
      h("h2",{className:"heading-2",id:"verdictH"}, n ? `${n} ${n===1?"law applies":"laws apply"} to you` : "No tracked law reaches you yet"),
      n ? h("ul",{"aria-label":"Laws that apply"}, apply.map(r=>h("li",{key:r.L.id},r.L.abbr))) :
        h("p",{className:"body muted"},"Users in Texas or Nebraska change that unless you're an SBA small business."),
      h("div",{className:"rest body-small muted"},
        h("span",null, `${likely.length} to confirm with counsel`),
        h("span",null, `${watch.length} proposed ${watch.length===1?"law":"laws"} to watch`))));
}

function Requirements({rows}){
  if(!rows.length) return null;
  const yn = v => v ? h("span",{className:"yn y"},icon("check",13),"Yes") : h("span",{className:"yn n"},icon("cross",13),"No");
  const noCure = rows.filter(r=>/^(None|Ended)/i.test(r.L.req.cure||""));
  return h("section",{className:"section","aria-labelledby":"reqH"},
    h("div",null, h("h2",{className:"heading-2",id:"reqH"},"How the requirements differ"),
      h("p",{className:"body muted",style:{marginTop:"4px"}},"For the state laws that apply to you or need confirming. Build to the strictest answer in each column and you cover the rest.")),
    h("div",{className:"tablewrap"}, h("table",null,
      h("thead",null,h("tr",null,["Law","Honor GPC signal","Sensitive data","Risk assessment","Respond within","Cure period"].map(t=>h("th",{key:t,scope:"col"},t)))),
      h("tbody",null, rows.map(r=>h("tr",{key:r.L.id},
        h("td",null,h("strong",{style:{fontWeight:500}},r.L.abbr)," ",h("span",{className:"muted"},NAMES[r.L.state])),
        h("td",null,yn(r.L.req.gpc)), h("td",null,SENS[r.L.req.sensitive]||"Not specified"),
        h("td",null,yn(r.L.req.assessment)), h("td",{className:"num"},r.L.req.days?`${r.L.req.days} days`:"Not specified"), h("td",null,r.L.req.cure||"Not specified")))))),
    noCure.length ? h(G.ClauseCallout,{tone:"warning",title:"Some of these states give no warning before enforcement"},
      h("p",null, `${(n=>n.length<3?n.join(" and "):n.slice(0,-1).join(", ")+" and "+n[n.length-1])(noCure.map(r=>NAMES[r.L.state]))} ${noCure.length===1?"has":"have"} no cure period, or one that has ended. Regulators there can bring an action on the first violation instead of sending a notice and waiting 30 or 60 days. Ship compliant in these states rather than planning to fix issues after a complaint.`)) : null);
}

function BuildList({L, copied, onCopy}){
  const items = buildItems(L.build);
  if(!items.length) return "None listed yet";
  return h("div",null,
    h("ul",{className:"buildlist",id:"build-"+L.id}, items.map((b,i)=>h("li",{key:i,className:b.note?"note":""},b.t))),
    h("div",{className:"copyrow"},
      h(G.Button,{variant:"secondary",size:"sm",onClick:()=>onCopy(L)},"Copy as checklist"),
      copied===L.id ? h("span",{className:"body-small",style:{color:"var(--sapphire)"},role:"status"},"Copied") : null));
}

function App({data}){
  const laws = data.laws;
  const [a,setA] = useState(DEFAULT);
  const [picked,setPicked] = useState(()=>new Set(PICK0));
  const [edited,setEdited] = useState(false);
  const [view,setView] = useState("you");
  const [q,setQ] = useState("");
  const [show,setShow] = useState("relevant");
  const [kind,setKind] = useState("any");
  const [open,setOpen] = useState(()=>new Set());
  const [scrollTo,setScrollTo] = useState(null);
  const [copied,setCopied] = useState(null);

  const set = (k,v)=>{ setA(p=>({...p,[k]:v})); setEdited(true); };
  const out = useMemo(()=>evaluate(laws,a,picked),[laws,a,picked]);
  const apply = out.filter(r=>r.level==="apply"), likely = out.filter(r=>r.level==="likely"), watch = out.filter(r=>r.level==="watch");
  const byId = Object.fromEntries(out.map(r=>[r.L.id,r]));
  const reviewed = laws.map(l=>l.reviewed).filter(Boolean).sort().pop();

  const matches = r => {
    if(kind==="state" && !r.L.state) return false;
    if(kind==="federal" && r.L.state) return false;
    if(show==="relevant" && r.level==="none") return false;
    if(show==="apply" && r.level!=="apply") return false;
    if(show==="likely" && r.level!=="likely") return false;
    if(show==="watch" && r.level!=="watch") return false;
    if(q){ const t = q.toLowerCase(); if(![r.L.name,r.L.abbr,where(r.L),r.L.threshold||""].join(" ").toLowerCase().includes(t)) return false; }
    return true;
  };
  const list = out.filter(matches).sort((x,y)=>ORDER[x.level]-ORDER[y.level] || x.L.name.localeCompare(y.L.name));
  const allOpen = list.length>0 && list.every(r=>open.has(r.L.id));

  useEffect(()=>{
    if(!scrollTo) return;
    const el = document.getElementById("law-"+scrollTo);
    if(el){ el.scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"start"}); const s = el.querySelector("summary"); if(s) s.focus({preventScroll:true}); }
    setScrollTo(null);
  });

  const reveal = L => {
    if(!matches(byId[L.id])){ setShow("all"); setKind("any"); setQ(""); }
    setOpen(p=>{ const n=new Set(p); n.add(L.id); return n; });
    setScrollTo(L.id);
  };
  const onTile = (st, L) => {
    if(st && view==="you" && a.where==="pick"){ setPicked(p=>{ const n=new Set(p); n.has(st)?n.delete(st):n.add(st); return n; }); setEdited(true); return; }
    if(L) reveal(L);
  };
  const onCopy = L => {
    const text = `${L.name} (${L.abbr})\n` + buildItems(L.build).map(b=>(b.note?"":"- [ ] ")+b.t).join("\n");
    const done = ()=>{ setCopied(L.id); setTimeout(()=>setCopied(c=>c===L.id?null:c),2000); };
    const fallback = ()=>{ const ul=document.getElementById("build-"+L.id); if(!ul) return; const rg=document.createRange(); rg.selectNodeContents(ul); const s=getSelection(); s.removeAllRanges(); s.addRange(rg); };
    try{ navigator.clipboard.writeText(text).then(done, fallback); }catch(e){ fallback(); }
  };
  const reset = ()=>{ setA({...DEFAULT, users:0, sells:false}); setEdited(true); };
  const reqRows = apply.concat(likely).filter(r=>r.L.trigger==="State thresholds");
  const stampISO = reviewed || data.synced.slice(0,10);

  return h("div",{className:"page"},
    h("header",{className:"head"},
      h("p",{className:"label eyebrow"},"For product teams"),
      h("h1",{className:"heading-1"},"Which privacy laws apply to us?"),
      h("p",{className:"body muted"},"Answer a few questions about your product. You'll see which U.S. state, federal and EU privacy laws likely cover you, and what each one requires you to build. A screening tool, not legal advice."),
      h("div",null, h(G.AsOfStamp,{date:fmtDate(stampISO),dateTime:stampISO,source: reviewed ? "Reviewed by counsel" : "Synced from the tracker; review pending"}))),
    h("div",{className:"layout"},
      h(Questionnaire,{a,set,edited,reset,pickCount:picked.size}),
      h("div",{className:"main"},
        h(ArchMap,{out,a,picked,view,setView,onTile}),
        h(Verdict,{apply,likely,watch}),
        h(Requirements,{rows:reqRows}),
        h("section",{className:"section","aria-labelledby":"lawsH"},
          h("div",null, h("h2",{className:"heading-2",id:"lawsH"},"Every law, in detail"),
            h("p",{className:"body muted",style:{marginTop:"4px"}},"Open a law to see who it covers and the build list your team can copy into tickets.")),
          h("div",{className:"toolbar"},
            h(G.SearchField,{placeholder:"Search laws or states",label:"Search laws or states",value:q,onChange:e=>setQ(e.target.value)}),
            h(G.FilterSelect,{label:"Show",value:show,onChange:e=>setShow(e.target.value),options:[{value:"relevant",label:"Relevant to you"},{value:"apply",label:"Applies to you"},{value:"likely",label:"To confirm"},{value:"watch",label:"Proposed laws"},{value:"all",label:`All ${out.length} laws`}]}),
            h(G.FilterSelect,{label:"Type",value:kind,onChange:e=>setKind(e.target.value),options:[{value:"any",label:"State and federal"},{value:"state",label:"State laws"},{value:"federal",label:"Federal and EU"}]}),
            h(G.Button,{variant:"secondary",size:"sm",onClick:()=>setOpen(allOpen?new Set():new Set(list.map(r=>r.L.id)))}, allOpen?"Collapse all":"Expand all"),
            h("span",{className:"body-small muted count",role:"status"},`${list.length} of ${out.length} laws`)),
          list.length ? h("div",{className:"cards"}, list.map(r=>h("div",{key:r.L.id,id:"law-"+r.L.id,style:{scrollMarginTop:"16px"}},
            h(G.JurisdictionCard,{
              name:r.L.name, citation:`${r.L.abbr} · ${where(r.L)}`, status:TAG[r.level], highlight:q||undefined,
              open:open.has(r.L.id),
              onToggle:o=>setOpen(p=>{ const n=new Set(p); o?n.add(r.L.id):n.delete(r.L.id); return n; }),
              fields:[
                {label:"In brief", value:r.L.summary || "None yet"},
                {label:"Why this result", value:r.why},
                {label:"Who it covers", value:r.L.threshold || "Not specified"},
                {label:"Effective", value:effText(r.L)},
                {label:"Enforced by", value:r.L.enforcer || "Not specified"},
                {label:"What your product must build", value:h(BuildList,{L:r.L,copied,onCopy})},
                {label:"Coming next", value:r.L.next || "None scheduled"}
              ]}))))
          : h("p",{className:"empty body muted"},"No laws match. Try a different search or set Show to all laws.")))),
    h(G.Disclaimer,{heading:"Informational only."},"This page screens for laws that may apply based on your answers and population-based estimates of users per state. It is not legal advice and doesn't create an attorney-client relationship. Confirm results with counsel before you launch, especially anything marked Confirm."),
    h("p",{className:"body-small muted foot"},`Maintained by Asia Parks, CIPP/US. Data last synced ${fmtDate(data.synced)}. Not tracked yet: Washington's My Health My Data Act, Florida's Digital Bill of Rights, and state children's codes. California adjusts its $25M revenue threshold for inflation.`));
}

const root = ReactDOM.createRoot(document.getElementById("root"));
fetch("data/laws.json",{cache:"no-cache"}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(data=>root.render(h(App,{data})))
  .catch(()=>root.render(h("div",{className:"page"}, h("p",{className:"body loading"},"The law data didn't load. Refresh the page; if it keeps happening, the nightly sync may have failed."))));
})();
