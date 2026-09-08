const cfg = window.SUPABASE_CONFIG || {};
const configured = cfg.url && !cfg.url.includes("YOUR_") && cfg.publishableKey && !cfg.publishableKey.includes("YOUR_");
const sb = configured ? window.supabase.createClient(cfg.url, cfg.publishableKey) : null;

const fallbackProducts = [
 {id:"local-1",name:"Turmeric Mukra Ghatta",slug:"turmeric-mukra-ghatta",subtitle:"High-Curcumin Grade",description:"A high-curcumin grade sourced for buyers who need strong colour and potency in their finished turmeric powder or extraction feedstock.",image_url:"assets/turmeric-1.jpg",sort_order:1,active:true,specs:{"Curcumin Content":"3% – 5%","Grade":"High Curcumin","Type":"Mukra Ghatta","Quality":"High-curcumin turmeric","Application":"Premium turmeric powder & extraction","Origin":"Marathwada, Maharashtra, India","Variety":"Salem"}},
 {id:"local-2",name:"Turmeric Mukra Ghatta — Bulk Lot",slug:"mukra-ghatta-bulk-lot",subtitle:"High-Curcumin · Bulk Lot",description:"Same high-curcumin specification, available in bulk consignment lots suitable for container-scale export orders.",image_url:"assets/turmeric-2.jpg",sort_order:2,active:true,specs:{"Curcumin Content":"3% – 5%","Grade":"High Curcumin","Type":"Mukra Ghatta","Quality":"High-curcumin turmeric","Application":"Premium turmeric powder & extraction","Origin":"Marathwada, Maharashtra, India","Variety":"Salem"}},
 {id:"local-3",name:"Turmeric Broken",slug:"turmeric-broken",subtitle:"Economical Processing Grade",description:"An economical grade ideal for bulk turmeric powder processing where cost efficiency matters more than finger size or appearance.",image_url:"assets/turmeric-3.jpg",sort_order:3,active:true,specs:{"Curcumin Content":"2.0%","Grade":"Broken Turmeric","Application":"Turmeric powder","Origin":"Marathwada, Maharashtra, India","Variety":"Salem","Processing":"Cleaned & dried"}},
 {id:"local-4",name:"Double Polished Super Salem Turmeric Finger",slug:"super-salem-turmeric-finger",subtitle:"Premium Grade",description:"Premium-quality Double Polished Super Salem Turmeric Fingers, sourced from the Marathwada region of Maharashtra. Selected for larger finger size, attractive appearance, low broken percentage and good curcumin content.",image_url:"assets/turmeric-4.jpg",sort_order:4,active:true,specs:{"Product":"Turmeric Finger","Grade":"Premium Grade","Polishing":"Double Polished","Variety":"Salem","Curcumin Content":"3.0% – 4.0%","Size":"4 – 8 cm","Broken":"Max. 5%","Origin":"Marathwada, Maharashtra, India"}},
 {id:"local-5",name:"Turmeric Bulb",slug:"turmeric-bulb",subtitle:"Double Polished — Powder Grade",description:"A double-polished bulb grade positioned as an affordable, cost-effective option for buyers focused on powder production rather than whole-finger appearance.",image_url:"assets/turmeric-5.jpg",sort_order:5,active:true,specs:{"Product":"Turmeric Bulb","Variety":"Salem Variety","Quality":"Double Polished","Curcumin Content":"2.5% – 3.2%","Origin":"Marathwada, Maharashtra, India","Grade":"Powder Quality / Processing Grade","Application":"Turmeric powder production","Positioning":"Affordable & cost-effective grade"}},
 {id:"local-6",name:"Turmeric Finger",slug:"turmeric-finger",subtitle:"Double Polished — Good Grade",description:"A good-grade double polished finger suited to powder processing, with an established track record in Gulf and North African markets.",image_url:"assets/turmeric-6.jpg",sort_order:6,active:true,specs:{"Product":"Turmeric Finger","Variety":"Salem Variety","Quality":"Double Polished — Good Grade","Curcumin Content":"2.5% – 3.5%","Origin":"Marathwada Region, Maharashtra, India","Size":"3 – 6 cm","Broken":"5% – 7%","Grade":"Average Finger / Powder Quality Finger"}}
];

const fallbackSettings = {
  brand_name:"INDIA SPICES BY AD",
  hero_title:"Turmeric, sourced close to the growers who cultivate it.",
  hero_text:"Farm-sourced Indian turmeric for importers, processors and wholesale buyers — with clear specifications, export-ready supply and a direct line to the supplier.",
  about_title:"A direct line between Indian growers and global buyers.",
  about_text:"<p>INDIA SPICES BY AD is an India-based exporter of premium, farm-sourced agricultural products, connecting Indian growers directly with buyers across India and international markets.</p><p>Our model is built on direct sourcing, close relationships with farming communities and rigorous quality checks before consignments leave our facility.</p>",
  quality_title:"Clear specifications. Serious about export.",
  quality_text:"The business presents its statutory registrations and export compliance clearly for prospective buyers.",
  email:"info.indiaspicesbyad@gmail.com",
  whatsapp:"+919004516651",
  phone:"+91 90045 16651 / +91 99673 74840",
  form_note:"No online payment. Your enquiry has been received securely, and our team will get back to you shortly.",
  certifications:[
    {code:"GST",title:"Registered",text:"Registered under India's Goods & Services Tax regime."},
    {code:"FSSAI",title:"Licensed",text:"Food safety compliance under the Food Safety and Standards Authority of India."},
    {code:"IEC",title:"Certified",text:"Import Export Code issued by DGFT for international trade."},
    {code:"APEDA",title:"Registered",text:"Registered with the Agricultural & Processed Food Products Export Development Authority."}
  ]
};

let products = [], settings = fallbackSettings;

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function waLink(number, text){return `https://api.whatsapp.com/send?phone=${String(number).replace(/\D/g,"")}&text=${encodeURIComponent(text)}`;}

async function loadData(){
  if(!sb){ products=fallbackProducts; settings=fallbackSettings; render(); return; }
  const [p,s] = await Promise.all([
    sb.from("products").select("*").eq("active",true).order("sort_order",{ascending:true}),
    sb.from("site_settings").select("*")
  ]);
  products = p.error ? fallbackProducts : (p.data || []);
  const rows = s.error ? [] : (s.data || []);
  if(rows.length){ settings={...fallbackSettings,...Object.fromEntries(rows.map(r=>[r.key,r.value]))}; }
  render();
}

function render(){
  document.getElementById("brandName").textContent = settings.brand_name || "INDIA SPICES BY AD";
  document.getElementById("heroTitle").textContent = settings.hero_title;
  document.getElementById("heroText").textContent = settings.hero_text;
  document.getElementById("aboutTitle").textContent = settings.about_title;
  document.getElementById("aboutText").innerHTML = settings.about_text;
  document.getElementById("qualityTitle").textContent = settings.quality_title;
  document.getElementById("qualityText").textContent = settings.quality_text;
  const formNote = document.querySelector(".form-note");
  if(formNote) formNote.textContent = settings.form_note || fallbackSettings.form_note;
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("statRange").textContent = products.length;
  const wa=waLink(settings.whatsapp,"Hello India Spices by AD, I would like to discuss a turmeric requirement.");
  document.getElementById("navWhatsApp").href=wa; document.getElementById("heroWhatsApp").href=wa;
  document.getElementById("contactLines").innerHTML=`<a href="mailto:${esc(settings.email)}"><span>Email</span>${esc(settings.email)} ↗</a><a href="${waLink(settings.whatsapp,"Hello India Spices by AD, I am interested in your turmeric products.")}" target="_blank" rel="noopener"><span>WhatsApp</span>${esc(settings.whatsapp)} ↗</a><div><span>Phone</span>${esc(settings.phone)}</div>`;
  document.getElementById("certStrip").innerHTML=(settings.certifications||[]).map(c=>`<div><span class="trust-icon">✓</span><strong>${esc(c.code)}</strong><span>${esc(c.title)}</span></div>`).join("");
  document.getElementById("certGrid").innerHTML=(settings.certifications||[]).map(c=>`<article class="cert-card"><span>${esc(c.code)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join("");
  document.getElementById("whyGrid").innerHTML=[
    ["01","Direct sourcing","Work closely with growers and local markets for traceability, freshness and fair value through the supply chain.","large"],
    ["02","Buyer-led grades","Multiple curcumin and quality grades to match different applications and price points",""],
    ["03","Export readiness","Documentation, packaging and compliance are part of the supply process.",""],
    ["04","Built for relationships","For importers, processors and wholesale buyers looking for dependable Indian turmeric supply rather than a transactional online shop.","wide"]
  ].map(x=>`<article class="info-card ${x[3]}"><span class="card-number">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("");
  const heroProduct=products.find(p=>p.image_url);
  if(heroProduct) document.getElementById("heroImage").src=heroProduct.image_url;
  renderProducts();
}

function renderProducts(){
  const grid=document.getElementById("productGrid"), select=document.getElementById("productSelect");
  if(!products.length){grid.innerHTML="<div class='loading'>No active products are published yet.</div>";select.innerHTML="<option value=''>No products available</option>";return;}
  grid.innerHTML=products.map((p,i)=>{
    const specs=Object.entries(p.specs||{}); const chips=specs.filter(([k])=>/curcumin|size|grade|processing|quality/i.test(k)).slice(0,2);
    return `<article class="product-card"><div class="product-image"><img src="${esc(p.image_url||"assets/turmeric-1.jpg")}" alt="${esc(p.name)}"></div><div class="product-content"><div class="product-meta"><span>${String(i+1).padStart(2,"0")}</span><span>${esc(p.subtitle||"TURMERIC")}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><div class="chips">${chips.map(([k,v])=>`<span>${esc(v)}</span>`).join("")}</div><button class="text-link product-detail" data-id="${esc(p.id)}">View specification ↗</button></div></article>`;
  }).join("");
  select.innerHTML='<option value="">Select a turmeric grade</option>'+products.map(p=>`<option>${esc(p.name)}</option>`).join("");
  grid.querySelectorAll(".product-detail").forEach(b=>b.addEventListener("click",()=>openProduct(b.dataset.id)));
}

function openProduct(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  document.getElementById("modalImage").src=p.image_url||"assets/turmeric-1.jpg";
  document.getElementById("modalImage").alt=p.name;
  document.getElementById("modalKicker").textContent=p.subtitle||"TURMERIC";
  document.getElementById("modalTitle").textContent=p.name;
  document.getElementById("modalDescription").textContent=p.description||"";
  document.getElementById("modalSpecs").innerHTML=Object.entries(p.specs||{}).map(([k,v])=>`<div class="spec-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join("");
  document.getElementById("productModal").classList.add("open");
  document.getElementById("productModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeModal(){document.getElementById("productModal").classList.remove("open");document.getElementById("productModal").setAttribute("aria-hidden","true");document.body.style.overflow="";}

document.querySelector(".menu-toggle")?.addEventListener("click",()=>{const n=document.querySelector(".nav");const open=n.classList.toggle("open");document.querySelector(".menu-toggle").setAttribute("aria-expanded",String(open));});
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".nav").classList.remove("open")));
document.querySelectorAll("[data-close]").forEach(x=>x.addEventListener("click",closeModal));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});

document.getElementById("inquiryForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const status=document.getElementById("formStatus"), button=e.currentTarget.querySelector("button");
  const data=Object.fromEntries(new FormData(e.currentTarget).entries());
  button.disabled=true; status.className="form-status"; status.textContent="Sending your enquiry…";
  if(!sb){ // local/demo fallback
    const subject=encodeURIComponent(`Turmeric enquiry — ${data.product}`);
    const body=encodeURIComponent(`Buyer enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company||"-"}\nCountry: ${data.country}\nProduct: ${data.product}\nEstimated quantity: ${data.quantity||"-"}\n\nRequirement:\n${data.message}`);
    window.location.href=`mailto:${settings.email}?subject=${subject}&body=${body}`;
    status.textContent="Supabase is not configured yet. Your email client has been opened as a fallback.";
    button.disabled=false; return;
  }
  const {error}=await sb.from("inquiries").insert([data]);
  if(error){status.className="form-status error";status.textContent="We could not submit the enquiry. Please use WhatsApp or email instead.";button.disabled=false;return;}
  status.textContent="Thank you. Your enquiry has been received. We will contact you shortly.";
  e.currentTarget.reset(); button.disabled=false;
});

loadData();
