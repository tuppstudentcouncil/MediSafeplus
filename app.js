/* ===== Utilities ===== */
const $  = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const store = {
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def } catch{ return def } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)) }
};

/* ===== Tabs ===== */
$$('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(x=>x.setAttribute('aria-selected','false'));
    b.setAttribute('aria-selected','true');
    const tab = b.dataset.tab;
    $$('.tab').forEach(s=>s.classList.add('hidden'));
    const sec = $('#tab-'+tab);
    sec.classList.remove('hidden','tab-anim'); void sec.offsetWidth; sec.classList.add('tab-anim');
  });
});

/* ===== Profile & Preview ===== */
const profKey = 'medisafe.profile';
const form = $('#profileForm');
const pv = {
  name: $('#pv-name'), meta: $('#pv-meta'),
  allergy: $('#pv-allergy'), cond: $('#pv-cond'),
  phone: $('#pv-phone'), ice: $('#pv-ice')
};
function ageFromDOB(dob){
  if(!dob) return '';
  const d = new Date(dob), t = new Date();
  let age = t.getFullYear()-d.getFullYear();
  const m = t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) age--;
  return age;
}
function renderProfileCard(data){
  const age = data.age || ageFromDOB(data.dob) || '—';
  pv.name.textContent = data.name || '—';
  pv.meta.textContent = `อายุ ${age} • เลือด ${data.blood||'-'}${data.rh||''}`;
  pv.allergy.textContent = data.allergies||'—';
  pv.cond.textContent = data.conditions||'—';
  pv.phone.textContent = data.phone||'—';
  pv.ice.textContent = data.ice||'—';
  // อัปเดตมอดัลเต็มจอด้วย
  $('#fs-name').textContent = data.name || '—';
  $('#fs-meta').textContent = `อายุ ${age} • เลือด ${data.blood||'-'}${data.rh||''}`;
  $('#fs-allergy').textContent = data.allergies || '—';
  $('#fs-cond').textContent    = data.conditions || '—';
  $('#fs-phone').textContent   = data.phone || '—';
  $('#fs-ice').textContent     = data.ice || '—';
}
function loadProfile(){
  const data = store.get(profKey, {});
  ['name','age','dob','blood','rh','conditions','allergies','phone','ice','weight','height']
    .forEach(k=>{ if(data[k]!==undefined && form?.elements[k]) form.elements[k].value = data[k]; });
  renderProfileCard(data);
}
form?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if(!data.age && data.dob){ data.age = ageFromDOB(data.dob) }
  store.set(profKey, data);
  renderProfileCard(data);
  $('#profileStatus').textContent = 'บันทึกแล้ว';
  setTimeout(()=>$('#profileStatus').textContent='', 2000);
  syncWidgetPreview();
});
$('#clearProfile')?.addEventListener('click', ()=>{
  localStorage.removeItem(profKey);
  form.reset();
  renderProfileCard({});
  syncWidgetPreview();
});

/* ===== Full Screen Modal (Billboard mode) ===== */
const fsWrap = $('#fsCard');
const fsClose = $('#fsClose');
const profileCard = $('#profileCard');

async function openFullscreen(){
  fsWrap.classList.remove('hidden');
  // ขอ Fullscreen API (บางอุปกรณ์)
  try{
    if(fsWrap.requestFullscreen) await fsWrap.requestFullscreen();
    else if(fsWrap.webkitRequestFullscreen) await fsWrap.webkitRequestFullscreen();
  }catch{}
}
async function closeFullscreen(){
  fsWrap.classList.add('hidden');
  try{
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(document.webkitFullscreenElement) await document.webkitExitFullscreen();
  }catch{}
}
profileCard?.addEventListener('click', openFullscreen);
profileCard?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') openFullscreen(); });
fsClose?.addEventListener('click', closeFullscreen);
fsWrap?.addEventListener('click', (e)=>{ if(e.target===fsWrap) closeFullscreen(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !fsWrap.classList.contains('hidden')) closeFullscreen(); });

/* ===== Widget ===== */
const widgetKey = 'medisafe.widget';
const wForm = $('#widgetForm');
function widgetText(){
  const p = store.get(profKey, {});
  const w = store.get(widgetKey, {});
  const items = [];
  if(w.showBlood) items.push(`เลือด ${p.blood||'-'}${p.rh||''}`);
  if(w.showAllergy) items.push(`แพ้ยา: ${p.allergies||'-'}`);
  if(w.showCond) items.push(`โรค: ${p.conditions||'-'}`);
  if(w.showICE) items.push(`ฉุกเฉิน: ${p.ice||'-'}`);
  return [`${p.name||'—'}`, items.join(' • ')].filter(Boolean).join('\n');
}
function syncWidgetPreview(){
  const w = store.get(widgetKey, {});
  const txt = widgetText();
  $('#w-avatar').style.background = w.theme||'#175f5c';
  $('#w-text').textContent = txt;
}
function loadWidget(){
  const w = store.get(widgetKey, {showBlood:true, showAllergy:true, showCond:true, showICE:true, style:'regular', theme:'#175f5c'});
  if(!wForm) return;
  wForm.elements['showBlood'].checked = !!w.showBlood;
  wForm.elements['showAllergy'].checked = !!w.showAllergy;
  wForm.elements['showCond'].checked = !!w.showCond;
  wForm.elements['showICE'].checked = !!w.showICE;
  wForm.elements['style'].value = w.style || 'regular';
  wForm.elements['theme'].value = w.theme || '#175f5c';
  document.documentElement.style.setProperty('--brand', w.theme||'#175f5c');
  syncWidgetPreview();
}
wForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = {
    showBlood: wForm.elements['showBlood'].checked,
    showAllergy: wForm.elements['showAllergy'].checked,
    showCond: wForm.elements['showCond'].checked,
    showICE: wForm.elements['showICE'].checked,
    style: wForm.elements['style'].value,
    theme: wForm.elements['theme'].value
  };
  store.set(widgetKey, data);
  document.documentElement.style.setProperty('--brand', data.theme);
  syncWidgetPreview();
  $('#widgetStatus').textContent = 'บันทึกแล้ว';
  setTimeout(()=>$('#widgetStatus').textContent='', 2000);
});

/* ===== Local test notification (หน้าเว็บต้องเปิดอยู่) ===== */
async function ensurePermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission === 'granted') return true;
  if(Notification.permission !== 'denied'){
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}
$('#testNotif')?.addEventListener('click', async()=>{
  const ok = await ensurePermission();
  if(!ok){ alert('โปรดอนุญาตการแจ้งเตือนในเบราว์เซอร์'); return }
  const body = widgetText();
  new Notification('MediSafe – การ์ดฉุกเฉิน', { body });
});

/* ===== Meds (on-page simple scheduler) ===== */
const medsKey = 'medisafe.meds';
const medTbl = $('#medList');
function renderMeds(list){
  if(!medTbl) return;
  medTbl.innerHTML = '';
  list.forEach((m, idx)=>{
    const tr = document.createElement('tr');
    tr.className = 'smooth';
    tr.innerHTML = `<td class="p-3">${m.name}</td>
      <td class="p-3">${m.note||''}</td>
      <td class="p-3">${m.time}</td>
      <td class="p-3 text-center">
        <button class="px-3 py-1 rounded-xl border text-xs smooth press focus-ring" data-del="${idx}">ลบ</button>
      </td>`;
    medTbl.appendChild(tr);
  });
}
function loadMeds(){ renderMeds(store.get(medsKey, [])); }
$('#medType')?.addEventListener('change', (e)=>{
  $('#medCustom').classList.toggle('hidden', e.target.value !== '__custom');
});
$('#medForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const type = $('#medType').value;
  const name = type === '__custom' ? ($('#medCustom').value||'ไม่ระบุ') : type;
  const note = $('#medNote').value;
  const time = $('#medTime').value;
  if(!name || !time){
    $('#medStatus').textContent = 'โปรดกรอกชื่อยาและเวลา';
    setTimeout(()=>$('#medStatus').textContent='', 2000);
    return;
  }
  const list = store.get(medsKey, []);
  list.push({name, note, time, lastFired:''});
  store.set(medsKey, list);
  renderMeds(list);
  e.target.reset(); $('#medCustom').classList.add('hidden');
  $('#medStatus').textContent = 'เพิ่มแล้ว'; setTimeout(()=>$('#medStatus').textContent='', 1500);
});
medTbl?.addEventListener('click', (e)=>{
  const del = e.target.getAttribute('data-del');
  if(del!==null){
    const list = store.get(medsKey, []);
    list.splice(Number(del),1);
    store.set(medsKey, list); renderMeds(list);
  }
});
let schedTimer=null;
function startScheduler(){
  if(schedTimer) clearInterval(schedTimer);
  schedTimer = setInterval(async()=>{
    const ok = await ensurePermission(); if(!ok) return;
    const list = store.get(medsKey, []);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const cur = `${hh}:${mm}`;
    const today = now.toISOString().slice(0,10);
    list.forEach(m=>{
      if(m.time===cur && m.lastFired!==today){
        const p = store.get(profKey, {});
        new Notification('ถึงเวลาทานยา: '+m.name, { body: (m.note? m.note+' • ' : '') + (p.name||'ผู้ใช้ MediSafe') });
        m.lastFired=today;
      }
    });
    store.set(medsKey, list);
  }, 30000);
  $('#medStatus').textContent = 'เริ่มเตือนแล้ว (ทำงานขณะเปิดหน้าเว็บ)';
  setTimeout(()=>$('#medStatus').textContent='', 2500);
}
$('#startSched')?.addEventListener('click', startScheduler);

/* ===== Web Push (สมัคร & ทดสอบยิงผ่านเซิร์ฟเวอร์) ===== */
// ใส่ public key ถ้ามี backend พร้อม
const VAPID_PUBLIC_KEY = 'PUT_YOUR_VAPID_PUBLIC_KEY_HERE';
async function urlBase64ToUint8Array(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function ensureSWRegistered(){
  if(!('serviceWorker' in navigator)) throw new Error('เบราว์เซอร์ไม่รองรับ Service Worker');
  const reg = await navigator.serviceWorker.getRegistration();
  return reg || navigator.serviceWorker.register('./sw.js');
}
async function subscribePush(){
  await ensureSWRegistered();
  const reg = await navigator.serviceWorker.ready;
  if(Notification.permission !== 'granted'){
    const perm = await Notification.requestPermission();
    if(perm !== 'granted') throw new Error('ผู้ใช้ยังไม่อนุญาตการแจ้งเตือน');
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  await fetch('/api/save-sub', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(sub)
  });
  localStorage.setItem('medisafe.pushSub', JSON.stringify(sub));
  return sub;
}
$('#btnPushSetup')?.addEventListener('click', async ()=>{
  const el = $('#pushStatus');
  try{
    await subscribePush();
    el.textContent = 'สมัครรับการแจ้งเตือนสำเร็จ ✓ (พร้อมรับ Live Notification)';
  }catch(err){
    el.textContent = 'สมัครไม่สำเร็จ: ' + err.message;
  }
});
$('#btnPushTest')?.addEventListener('click', async ()=>{
  const el = $('#pushStatus');
  try{
    const res = await fetch('/api/push-test', {method:'POST'});
    if(!res.ok) throw new Error('Server error');
    el.textContent = 'ยิงทดสอบแล้ว — ถ้าตั้งค่า VAPID/HTTPS ถูกต้อง จะเด้งเร็วๆ นี้';
  }catch(err){
    el.textContent = 'ทดสอบไม่สำเร็จ: ' + err.message;
  }
});

/* ===== PWA (Install prompt + iOS Guide) ===== */
(function setupPWA(){
  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistration().then(reg=>{
        if(!reg) navigator.serviceWorker.register('./sw.js');
      });
    }
    let deferredPrompt=null;
    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault(); deferredPrompt=e; $('#pwaBox').classList.remove('hidden');
    });
    $('#btnInstall')?.addEventListener('click', async()=>{
      const ua = navigator.userAgent || '';
      const isiOS = /iPhone|iPad|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      if(isiOS && isSafari){
        // แสดงคู่มือ iOS
        $('#iosGuide')?.classList.remove('hidden');
        return;
      }
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      const res = await deferredPrompt.userChoice;
      if(res.outcome==='accepted'){ $('#pwaBox').classList.add('hidden'); }
    });
    $('#btnHidePwa')?.addEventListener('click', ()=>$('#pwaBox').classList.add('hidden'));
    $('#iosGuideClose')?.addEventListener('click', ()=>$('#iosGuide')?.classList.add('hidden'));
  }catch(err){ console.warn('PWA init skipped - app.js:323', err); }
})();

/* ===== Init ===== */
loadProfile();
loadWidget();
loadMeds();
