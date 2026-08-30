const SUPABASE_URL = 'https://imkbmemvoqbbedbljueu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Dosi6rJmV4SaGzLEClAYUA_1L2CdDfE';
const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const BUCKET = 'resources';
let user = null;
let currentPath = '';
let pendingAction = null;
let allItems = [];

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const cleanName = value => String(value || '').trim().replace(/[\\/]/g,'-').replace(/\.{2,}/g,'.').slice(0,160);
const pathJoin = (a,b) => [a,b].filter(Boolean).join('/');
const toast = msg => { $('toast').textContent = msg; $('toast').classList.remove('hidden'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>$('toast').classList.add('hidden'),2800); };
const openModal = id => $(id).classList.add('show');
const closeModal = id => $(id).classList.remove('show');

function formatBytes(bytes){
  if(!bytes) return '0 B';
  const units=['B','KB','MB','GB','TB']; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);
  return `${(bytes/Math.pow(1024,i)).toFixed(i?1:0)} ${units[i]}`;
}
function iconFor(name, folder=false){
  if(folder) return 'fa-folder';
  const ext=name.split('.').pop().toLowerCase();
  if(['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'fa-image';
  if(['pdf'].includes(ext)) return 'fa-file-pdf';
  if(['doc','docx','txt','rtf'].includes(ext)) return 'fa-file-lines';
  if(['ppt','pptx'].includes(ext)) return 'fa-file-powerpoint';
  if(['xls','xlsx','csv'].includes(ext)) return 'fa-file-excel';
  if(['zip','rar','7z'].includes(ext)) return 'fa-file-zipper';
  if(['psd','ai','fig'].includes(ext)) return 'fa-palette';
  if(['mp4','mov','webm','mkv'].includes(ext)) return 'fa-file-video';
  return 'fa-file';
}

async function init(){
  const {data:{session}} = await sb.auth.getSession();
  user=session?.user||null;
  if(!user){
    toast('Please log in to access cloud Resources.');
    setTimeout(()=>location.href='index.html',900);
    return;
  }
  $('accountName').textContent = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
  bind();
  await load();
}

function bind(){
  $('uploadBtn').onclick=()=>$('fileInput').click();
  $('fileInput').onchange=async e=>{ if(e.target.files.length) await uploadFiles([...e.target.files]); e.target.value=''; };
  $('newFolderBtn').onclick=()=>{ $('folderName').value=''; openModal('folderModal'); setTimeout(()=>$('folderName').focus(),50); };
  $('createFolder').onclick=createFolder;
  $('refreshBtn').onclick=load;
  $('search').oninput=render;
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  $('renameSave').onclick=renameItem;
  $('deleteConfirm').onclick=deleteItem;
}

async function listObjects(prefix=''){
  const {data,error}=await sb.storage.from(BUCKET).list(prefix,{limit:1000,sortBy:{column:'name',order:'asc'}});
  if(error) throw error;
  return data||[];
}

async function load(){
  try{
    const items=await listObjects(currentPath);
    allItems=items;
    render();
  }catch(e){
    console.error(e);
    toast(`Could not load Resources: ${e.message||'Storage is not configured.'}`);
    $('grid').innerHTML='<div class="empty"><i class="fa-solid fa-cloud"></i><br><br>Cloud storage is not ready yet.<br>Run resources-storage.sql in Supabase SQL Editor.</div>';
  }
}

function render(){
  const q=$('search').value.trim().toLowerCase();
  const items=allItems.filter(x=>!q||x.name.toLowerCase().includes(q));
  const folders=items.filter(x=>x.id===null || x.metadata===null || x.name.endsWith('/'));
  const files=items.filter(x=>!(x.id===null || x.metadata===null || x.name.endsWith('/')) && x.name!=='.folder');
  $('fileCount').textContent=files.length;
  $('folderCount').textContent=folders.length;
  $('currentFolder').textContent=currentPath ? currentPath.split('/').pop() : 'Root';
  renderPath();
  if(!items.length || (folders.length===0 && files.length===0)){
    $('grid').innerHTML='<div class="empty"><i class="fa-solid fa-folder-open" style="font-size:30px"></i><br><br>No files or folders here yet.<br>Upload a file or create a folder to get started.</div>';
    return;
  }
  $('grid').innerHTML=[...folders,...files].map(item=>{
    const folder=folders.includes(item);
    const name=folder?item.name.replace(/\/$/,''):item.name;
    const meta=folder?'Folder':'File • '+formatBytes(item.metadata?.size||0);
    return `<article class="item" data-name="${esc(name)}" data-folder="${folder}">
      <div><div class="itemtop"><div class="icon"><i class="fa-solid ${iconFor(name,folder)}"></i></div><button class="mini" style="flex:0 0 auto" onclick="openItemMenu(event,${JSON.stringify(name)},${folder})">•••</button></div>
      <div class="name">${esc(name)}</div><div class="meta">${meta}</div></div>
      <div class="itemactions">${folder?`<button class="mini" onclick="openFolder(${JSON.stringify(name)})">Open</button>`:`<button class="mini" onclick="downloadFile(${JSON.stringify(name)})">Download</button>`}<button class="mini" onclick="startRename(${JSON.stringify(name)},${folder})">Rename</button></div>
    </article>`;
  }).join('');
}

function renderPath(){
  const parts=currentPath?currentPath.split('/'):[];
  let html='<button onclick="goRoot()"><i class="fa-solid fa-house"></i> Root</button>';
  let built='';
  parts.forEach((p,i)=>{ built=pathJoin(built,p); html+=`<span>/</span><button onclick="goPath(${JSON.stringify(built)})">${esc(p)}</button>`; });
  $('path').innerHTML=html;
}
window.goRoot=()=>{currentPath='';load();};
window.goPath=p=>{currentPath=p;load();};
window.openFolder=name=>{currentPath=pathJoin(currentPath,name);load();};

async function uploadFiles(files){
  if(!files.length)return;
  let ok=0;
  for(const file of files){
    const name=cleanName(file.name); if(!name)continue;
    const objectPath=pathJoin(user.id,pathJoin(currentPath,name));
    const {error}=await sb.storage.from(BUCKET).upload(objectPath,file,{upsert:false,contentType:file.type||'application/octet-stream'});
    if(error){ toast(`${name}: ${error.message}`); continue; }
    ok++;
  }
  if(ok) toast(`${ok} file${ok>1?'s':''} uploaded to the cloud.`);
  await load();
}

async function createFolder(){
  const name=cleanName($('folderName').value);
  if(!name)return toast('Enter a folder name.');
  const objectPath=pathJoin(user.id,pathJoin(currentPath,pathJoin(name,'.folder')));
  const {error}=await sb.storage.from(BUCKET).upload(objectPath,new Blob(['IzVault folder'],{type:'text/plain'}),{upsert:false,contentType:'text/plain'});
  if(error)return toast(`Could not create folder: ${error.message}`);
  closeModal('folderModal'); toast('Folder created.'); await load();
}

async function downloadFile(name){
  const objectPath=pathJoin(user.id,pathJoin(currentPath,name));
  const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(objectPath,300);
  if(error)return toast(`Download failed: ${error.message}`);
  const a=document.createElement('a'); a.href=data.signedUrl; a.target='_blank'; a.rel='noopener'; a.download=name; a.click();
}
window.downloadFile=downloadFile;

window.openItemMenu=(event,name,folder)=>{
  event.stopPropagation();
  pendingAction={name,folder};
  startRename(name,folder);
};
window.startRename=(name,folder)=>{
  pendingAction={name,folder}; $('renameName').value=name; openModal('renameModal'); setTimeout(()=>$('renameName').focus(),50);
};

async function renameItem(){
  const next=cleanName($('renameName').value); const old=pendingAction?.name; const folder=pendingAction?.folder;
  if(!old||!next)return toast('Enter a valid name.');
  if(old===next){closeModal('renameModal');return;}
  if(folder){
    const oldPrefix=pathJoin(user.id,pathJoin(currentPath,old));
    const newPrefix=pathJoin(user.id,pathJoin(currentPath,next));
    const {data,error}=await sb.storage.from(BUCKET).list(oldPrefix,{limit:1000});
    if(error)return toast(`Rename failed: ${error.message}`);
    const objects=(data||[]).filter(x=>x.id!==null).map(x=>({from:pathJoin(oldPrefix,x.name),to:pathJoin(newPrefix,x.name)}));
    for(const o of objects){ const r=await sb.storage.from(BUCKET).move(o.from,o.to); if(r.error)return toast(`Rename failed: ${r.error.message}`); }
    if(!objects.length){
      const r=await sb.storage.from(BUCKET).upload(pathJoin(newPrefix,'.folder'),new Blob(['IzVault folder'],{type:'text/plain'}),{upsert:false});
      if(r.error)return toast(`Rename failed: ${r.error.message}`);
    }
  }else{
    const from=pathJoin(user.id,pathJoin(currentPath,old)); const to=pathJoin(user.id,pathJoin(currentPath,next));
    const {error}=await sb.storage.from(BUCKET).move(from,to); if(error)return toast(`Rename failed: ${error.message}`);
  }
  closeModal('renameModal'); toast('Renamed successfully.'); await load();
}

window.startDelete=(name,folder)=>{
  pendingAction={name,folder}; $('deleteText').textContent=`Delete “${name}”? This cannot be undone.`; openModal('deleteModal');
};

async function deleteItem(){
  const {name,folder}=pendingAction||{}; if(!name)return;
  const prefix=pathJoin(user.id,pathJoin(currentPath,name));
  if(folder){
    const {data,error}=await sb.storage.from(BUCKET).list(prefix,{limit:1000});
    if(error)return toast(`Delete failed: ${error.message}`);
    const paths=(data||[]).filter(x=>x.id!==null).map(x=>pathJoin(prefix,x.name));
    if(paths.length){const r=await sb.storage.from(BUCKET).remove(paths);if(r.error)return toast(`Delete failed: ${r.error.message}`);}
  }else{
    const {error}=await sb.storage.from(BUCKET).remove([prefix]); if(error)return toast(`Delete failed: ${error.message}`);
  }
  closeModal('deleteModal'); toast('Deleted.'); await load();
}

// Make delete available from inline controls through a simple context action.
window.startRename=startRename;
window.openItemMenu=(event,name,folder)=>{
  event.stopPropagation();
  const action=confirm(`Rename “${name}”?\n\nPress OK to rename, or Cancel to delete.`);
  if(action) startRename(name,folder); else window.startDelete(name,folder);
};

init();
