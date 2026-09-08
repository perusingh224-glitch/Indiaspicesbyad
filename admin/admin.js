const cfg=window.SUPABASE_CONFIG||{};
const configured=cfg.url&&!cfg.url.includes("YOUR_")&&cfg.publishableKey&&!cfg.publishableKey.includes("YOUR_");
const sb=configured?window.supabase.createClient(cfg.url,cfg.publishableKey):null;
let products=[], inquiries=[], currentProduct=null, imageFile=null, inquiryFilter="";

const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function status(el,msg,error=false){el.textContent=msg;el.className="status"+(error?" error":"");}

async function requireAdmin(){
  if(!sb){showLogin();status($("#loginStatus"),"Configure Supabase in ../config.js first.",true);return false;}
  const {data:{session}}=await sb.auth.getSession();
  if(!session){showLogin();return false;}
  const {data:admin,error}=await sb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
  if(error||!admin){await sb.auth.signOut();showLogin();status($("#loginStatus"),"This account is not an authorised admin.",true);return false;}
  showAdmin(); await refresh(session.user);
  return true;
}
function showLogin(){$("#loginView").classList.remove("hidden");$("#adminView").classList.add("hidden")}
function showAdmin(){$("#loginView").classList.add("hidden");$("#adminView").classList.remove("hidden")}
function getGreeting(){
  const hour=new Date().getHours();
  if(hour<12)return "Good morning";
  if(hour<17)return "Good afternoon";
  return "Good evening";
}
function getDisplayName(user){
  const meta=user?.user_metadata||{};
  const raw=meta.full_name||meta.name||meta.display_name||user?.email?.split("@")[0]||"there";
  return String(raw).replace(/[._-]+/g," ").trim().split(/\s+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ")||"there";
}
function updateGreeting(user){
  const el=$("#greetingTitle");
  if(el)el.textContent=`${getGreeting()} ${getDisplayName(user)}.`;
}
async function refresh(user){await Promise.all([loadProducts(),loadInquiries(),loadSettings()]);updateMetrics();updateGreeting(user);}

async function loadProducts(){const r=await sb.from("products").select("*").order("sort_order",{ascending:true});products=r.data||[];renderProducts();}
async function loadInquiries(){const r=await sb.from("inquiries").select("*").order("created_at",{ascending:false});inquiries=r.data||[];renderInquiries();}
async function loadSettings(){
  const r=await sb.from("site_settings").select("*");
  if(r.error) throw r.error;
  const vals=Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));
  const defaults={
    brand_name:"INDIA SPICES BY AD",
    email:"info.indiaspicesbyad@gmail.com",
    whatsapp:"+919004516651",
    phone:"+91 90045 16651 / +91 99673 74840",
    hero_title:"Turmeric, sourced close to the growers who cultivate it.",
    hero_text:"Farm-sourced Indian turmeric for importers, processors and wholesale buyers — with clear specifications, export-ready supply and a direct line to the supplier.",
    about_title:"A direct line between Indian growers and global buyers.",
    quality_title:"Clear specifications. Serious about export.",
    quality_text:"The business presents its statutory registrations and export compliance clearly for prospective buyers.",
    form_note:"No online payment. Your enquiry has been received securely, and our team will get back to you shortly."
  };
  const f=$("#settingsForm");
  for(const k of ["brand_name","email","whatsapp","phone","hero_title","hero_text","about_title","about_text","quality_title","quality_text","form_note"]){
    if(f.elements[k]) f.elements[k].value=vals[k] ?? defaults[k] ?? "";
  }
}
function updateMetrics(){$("#mProducts").textContent=products.filter(p=>p.active).length;$("#mNew").textContent=inquiries.filter(i=>i.status==="new").length;$("#mTotal").textContent=inquiries.length;}

function renderProducts(){
  $("#productAdminList").innerHTML=products.length?products.map(p=>`<div class="product-admin"><img src="${esc(p.image_url||"../assets/turmeric-1.jpg")}" alt=""><div><span class="badge">${p.active?"PUBLISHED":"HIDDEN"}</span><h3>${esc(p.name)}</h3><p>${esc(p.subtitle||"")} · Order ${p.sort_order??0}</p></div><div class="product-actions"><button class="mini-btn" data-edit="${esc(p.id)}">Edit</button><button class="mini-btn" data-toggle="${esc(p.id)}">${p.active?"Hide":"Publish"}</button><button class="mini-btn danger" data-delete="${esc(p.id)}">Delete</button></div></div>`).join(""):"<div class='tip'>No products yet. Click Add product to create your first listing.</div>";
  $$("[data-edit]").forEach(b=>b.onclick=()=>openProduct(b.dataset.edit));
  $$("[data-toggle]").forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggle));
  $$("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
function parseSpecs(text){return Object.fromEntries(text.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{const [k,...v]=line.split("|");return [k.trim(),v.join("|").trim()]}).filter(([k,v])=>k&&v));}
function specsText(specs={}){return Object.entries(specs).map(([k,v])=>`${k} | ${v}`).join("\n");}
function slugify(v=""){return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);}

function openProduct(id=null){
  currentProduct=id?products.find(p=>String(p.id)===String(id)):null; imageFile=null;
  $("#productModal").classList.remove("hidden"); $("#productModalTitle").textContent=currentProduct?"Edit product":"Add product";
  const f=$("#productForm");f.reset();f.elements.id.value=currentProduct?.id||"";f.elements.name.value=currentProduct?.name||"";f.elements.subtitle.value=currentProduct?.subtitle||"";f.elements.description.value=currentProduct?.description||"";f.elements.specs.value=specsText(currentProduct?.specs||{});f.elements.sort_order.value=currentProduct?.sort_order??(products.length+1);f.elements.active.checked=currentProduct?!!currentProduct.active:true;$("#imagePreview").src=currentProduct?.image_url||"../assets/turmeric-1.jpg";
}
$("#addProductBtn").onclick=()=>openProduct();
$$("[data-close]").forEach(x=>x.onclick=()=>$("#productModal").classList.add("hidden"));
$("#imageInput").onchange=e=>{imageFile=e.target.files[0]||null;if(imageFile)$("#imagePreview").src=URL.createObjectURL(imageFile);};

async function uploadImage(file){
  const ext=file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=`products/${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from("product-images").upload(path,file,{upsert:false,contentType:file.type});
  if(error)throw error;
  return sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
$("#productForm").onsubmit=async e=>{
  e.preventDefault(); const f=e.currentTarget, st=$("#productStatus");status(st,"Saving…");
  try{
    let image_url=currentProduct?.image_url||"";
    if(imageFile) image_url=await uploadImage(imageFile);
    const name=f.elements.name.value.trim();
    const payload={name,slug:currentProduct?.slug||slugify(name),subtitle:f.elements.subtitle.value.trim(),description:f.elements.description.value.trim(),image_url,specs:parseSpecs(f.elements.specs.value),sort_order:Number(f.elements.sort_order.value)||0,active:f.elements.active.checked};
    let r;
    if(currentProduct) r=await sb.from("products").update(payload).eq("id",currentProduct.id);
    else r=await sb.from("products").insert(payload);
    if(r.error)throw r.error;
    status(st,"Saved.");await loadProducts();updateMetrics();setTimeout(()=>$("#productModal").classList.add("hidden"),400);
  }catch(err){status(st,err.message||"Could not save product.",true);}
};
async function toggleProduct(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const r=await sb.from("products").update({active:!p.active}).eq("id",id);if(r.error)return alert(r.error.message);await loadProducts();updateMetrics();}
async function deleteProduct(id){if(!confirm("Delete this product permanently?"))return;const r=await sb.from("products").delete().eq("id",id);if(r.error)return alert(r.error.message);await loadProducts();updateMetrics();}

function statusLabel(v=""){return v.replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase());}
function statusClass(v=""){return v.replace(/_/g,"-");}
function renderInquiries(){
  const q=($("#searchInquiries").value||"").toLowerCase(), filter=inquiryFilter;
  const rows=inquiries.filter(i=>(!filter||i.status===filter)&&JSON.stringify(i).toLowerCase().includes(q));
  $("#inquiryCount").textContent=`${rows.length} ${rows.length===1?"enquiry":"enquiries"}`;
  $("#inquiryList").innerHTML=rows.length?rows.map(i=>{
    const st=i.status||"new", seq=String(i.enquiry_number||0).padStart(3,"0");
    return `<article class="inquiry">
      <div class="inquiry-top">
        <div class="inquiry-number">#${seq}</div>
        <div class="inquiry-heading">
          <span class="badge status-${statusClass(st)}">${esc(statusLabel(st))}</span>
          <h3>${esc(i.name)}${i.company?` · ${esc(i.company)}`:""}</h3>
          ${i.message?`<div class="inquiry-message">${esc(i.message)}</div>`:""}
        </div>
        <div class="inquiry-date">${new Date(i.created_at).toLocaleString()}</div>
      </div>
      <div class="inquiry-grid">
        <div><b>Email</b><span>${esc(i.email||"-")} <button class="copy-email" type="button" data-copy="${esc(i.email||"")}" title="Copy email">Copy</button></span></div>
        <div><b>Country</b>${esc(i.country||"-")}</div>
        <div><b>Product</b>${esc(i.product||"-")}</div>
        <div><b>Quantity</b>${esc(i.quantity||"-")}</div>
        <div class="status-field"><b>Status</b>
          <div class="status-dropdown" data-dropdown="${esc(i.id)}">
            <button type="button" class="status-trigger" aria-expanded="false">
              <span class="status-trigger-label"><span class="status-dot ${esc(st)}"></span>${esc(statusLabel(st))}</span>
              <svg class="status-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="status-menu hidden">
              ${["new","contacted","quotation_sent","negotiation","won","lost"].map(v=>`<button type="button" class="status-option ${v===st?"selected":""}" data-status-value="${v}"><span class="status-dot ${v}"></span>${statusLabel(v)}</button>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }).join(""):"<div class='tip'>No enquiries match the current filter.</div>";

  $$(".status-trigger").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const wrap=btn.closest(".status-dropdown"), menu=wrap.querySelector(".status-menu"), open=!wrap.classList.contains("open");
    $$(".status-dropdown").forEach(d=>{d.classList.remove("open");d.querySelector(".status-menu")?.classList.add("hidden");d.querySelector(".status-trigger")?.setAttribute("aria-expanded","false")});
    if(open){wrap.classList.add("open");menu.classList.remove("hidden");btn.setAttribute("aria-expanded","true")}
  });
  $$("[data-status-value]").forEach(option=>option.onclick=async e=>{
    e.stopPropagation();
    const wrap=option.closest(".status-dropdown"), id=wrap.dataset.dropdown, value=option.dataset.statusValue;
    wrap.querySelector(".status-menu").classList.add("hidden");wrap.classList.remove("open");wrap.querySelector(".status-trigger").setAttribute("aria-expanded","false");
    const r=await sb.from("inquiries").update({status:value}).eq("id",id);
    if(r.error)alert(r.error.message);else await loadInquiries();
    updateMetrics();
  });
  $$("[data-copy]").forEach(btn=>btn.onclick=async()=>{try{await navigator.clipboard.writeText(btn.dataset.copy);const old=btn.textContent;btn.textContent="Copied";setTimeout(()=>btn.textContent=old,1000)}catch{}});
}
$("#statusFilterDropdown .filter-trigger").onclick=e=>{
  e.stopPropagation();
  const wrap=$("#statusFilterDropdown"), menu=$("#statusFilterMenu"), open=!wrap.classList.contains("open");
  closeDropdowns();
  if(open){wrap.classList.add("open");menu.classList.remove("hidden");wrap.querySelector(".filter-trigger").setAttribute("aria-expanded","true");}
};
$$("[data-filter-value]").forEach(option=>option.onclick=e=>{
  e.stopPropagation();
  inquiryFilter=option.dataset.filterValue||"";
  $("#statusFilterLabel").textContent=inquiryFilter?statusLabel(inquiryFilter):"All statuses";
  const trigger=$("#statusFilterDropdown .filter-trigger");
  trigger.querySelector(".filter-dot").className=`filter-dot ${inquiryFilter||"all"}`;
  $$('[data-filter-value]').forEach(x=>x.classList.toggle("selected",x===option));
  closeDropdowns();
  renderInquiries();
});
function closeDropdowns(){
  $$(".status-dropdown").forEach(d=>{d.classList.remove("open");d.querySelector(".status-menu")?.classList.add("hidden");d.querySelector(".status-trigger")?.setAttribute("aria-expanded","false")});
  const fd=$("#statusFilterDropdown");
  if(fd){fd.classList.remove("open");fd.querySelector(".filter-menu")?.classList.add("hidden");fd.querySelector(".filter-trigger")?.setAttribute("aria-expanded","false");}
}
document.addEventListener("click",closeDropdowns);
$("#searchInquiries").oninput=renderInquiries;

$("#settingsForm").onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget,st=$("#settingsStatus");status(st,"Saving…");
  const keys=["brand_name","email","whatsapp","phone","hero_title","hero_text","about_title","about_text","quality_title","quality_text","form_note"];
  for(const key of keys){const r=await sb.from("site_settings").upsert({key,value:f.elements[key].value},{onConflict:"key"});if(r.error){status(st,r.error.message,true);return;}}
  status(st,"Website settings saved.");
};

$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".panel").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.tab).classList.add("active");});
$("#loginForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,st=$("#loginStatus");if(!sb){status(st,"Configure ../config.js first.",true);return;}status(st,"Signing in…");const {error}=await sb.auth.signInWithPassword({email:f.elements.email.value,password:f.elements.password.value});if(error){status(st,error.message,true);return;}await requireAdmin();};
$("#logoutBtn").onclick=async()=>{await sb.auth.signOut();showLogin();};
requireAdmin();
