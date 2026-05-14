var cropState = { formType:'new', img:null, scale:1, offsetX:0, offsetY:0, dragging:false, startX:0, startY:0, origX:0, origY:0 };
var galleryPending = { formType:null };
var editingItemId = null;
var newImages = []; 
var editImages = [];

function escapeHtml(s){ var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

function showTab(tab){
  ['items','orders','new-item','edit-item'].forEach(function(t){ var el=document.getElementById('tab-'+t); if(el)el.classList.add('hidden'); });
  var target=document.getElementById('tab-'+tab); if(target)target.classList.remove('hidden');
  ['tab-items-btn','tab-orders-btn','tab-new-item-btn'].forEach(function(id){
    var btn=document.getElementById(id); if(btn){btn.classList.remove('bg-brand-gold/10','text-brand-gold','border-brand-gold/20','active-tab');btn.classList.add('text-brand-on-surface-variant','border-transparent');}
  });
  var ab=document.getElementById('tab-'+tab+'-btn'); if(ab){ab.classList.add('bg-brand-gold/10','text-brand-gold','border-brand-gold/20','active-tab');ab.classList.remove('text-brand-on-surface-variant','border-transparent');}
  if(tab==='items')loadItems();
  if(tab==='orders')loadOrders();
}

async function loadItems(){
  try{
    var items=await API.getAllMerchItems();
    var list=document.getElementById('items-list');
    if(!items||!items.length){list.innerHTML='<p class="text-brand-on-surface-variant py-8 text-center">Nessun articolo.</p>';return;}
    list.innerHTML=items.map(function(i){
      var src=i.immaginePath?API_BASE_URL+i.immaginePath:null;
      var ih=src?'<img src="'+escapeHtml(src)+'" alt="" class="w-full h-full object-cover rounded-lg" />':'<i class="fa-solid fa-film"></i>';
      return '<div class="cine-premium-card p-4 flex items-center gap-4'+(i.attivo?'':' opacity-50')+'">'
        +'<div class="w-12 h-12 rounded-lg bg-brand-surface-dim flex items-center justify-center text-brand-gold text-xl flex-shrink-0">'+ih+'</div>'
        +'<div class="flex-1 min-w-0"><p class="text-sm font-bold text-brand-on-surface">'+escapeHtml(i.nome)+'</p>'
        +'<p class="text-xs text-brand-on-surface-variant">'+escapeHtml(i.categoria)+' &middot; Stock: '+i.stock+' &middot; Varianti: '+(i.varianti?i.varianti.length:0)+' &middot; Immagini: '+(i.immagini?i.immagini.length:0)+' &middot; '+(i.attivo?'Attivo':'Disattivato')+'</p></div>'
        +'<div class="text-right"><p class="text-lg font-bold text-brand-gold font-serif">&euro;'+i.prezzo.toFixed(2)+'</p>'
        +'<div class="flex gap-1 mt-1"><button onclick="editItem('+i.id+')" class="text-xs text-brand-on-surface-variant hover:text-brand-gold"><i class="fa-solid fa-pen"></i></button>'
        +'<button onclick="deleteItem('+i.id+',\''+escapeHtml(i.nome).replace(/'/g,"\\'")+'\')" class="text-xs text-brand-on-surface-variant hover:text-brand-red"><i class="fa-solid fa-trash"></i></button></div></div></div>';
    }).join('');
  }catch(e){document.getElementById('items-list').innerHTML='<p class="text-brand-red py-4">Errore: '+escapeHtml(e.message)+'</p>';}
}

function updatePreview(previewId,src){
  var el=document.getElementById(previewId);
  el.innerHTML=src?'<img src="'+escapeHtml(src)+'" alt="" class="w-full h-full object-cover" />':'<i class="fa-solid fa-film"></i>';
}

function renderGallery(ft){
  var container=document.getElementById(ft+'-images-gallery');
  var arr=ft==='new'?newImages:editImages;
  container.innerHTML=arr.map(function(p,i){
    return '<div class="relative w-16 h-16 rounded-lg bg-brand-surface-dim overflow-hidden border border-brand-outline-variant/20 flex-shrink-0">'
      +'<img src="'+escapeHtml(p.startsWith('/')?API_BASE_URL+p:p)+'" alt="" class="w-full h-full object-cover" />'
      +'<button type="button" onclick="removeGalleryImage(\''+ft+'\','+i+')" class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-brand-red text-white text-[10px] flex items-center justify-center">&times;</button></div>';
  }).join('');
}

function addGalleryImage(ft){
  galleryPending.formType=ft;
  document.getElementById('gallery-file-input').click();
}

document.getElementById('gallery-file-input').addEventListener('change',async function(e){
  var file=e.target.files[0]; if(!file)return;
  var ft=galleryPending.formType; if(!ft)return;
  try{
    var existingImg=ft==='new'?document.getElementById('new-item-immagine').value:document.getElementById('edit-item-immagine').value;
    if(!editingItemId&&ft==='edit'){ editingItemId=parseInt(document.getElementById('edit-item-id').value); }
    var result;
    if(editingItemId&&ft==='edit'){
      result=await API.addMerchItemImage(editingItemId,file);
    } else {
      result=await API.uploadMerchImage(file);
    }
    var arr=ft==='new'?newImages:editImages;
    arr.push(result.path);
    renderGallery(ft);
    if(!existingImg){
      var hid=ft+'-item-immagine'; document.getElementById(hid).value=result.path;
      updatePreview(ft+'-img-preview',API_BASE_URL+result.path);
    }
  }catch(err){alert('Errore upload: '+(err.message||''));}
  this.value='';
});

function removeGalleryImage(ft,idx){
  var arr=ft==='new'?newImages:editImages;
  arr.splice(idx,1);
  renderGallery(ft);
  var hid=ft+'-item-immagine';
  if(arr.length===0){document.getElementById(hid).value='';updatePreview(ft+'-img-preview',null);}
  else if(document.getElementById(hid).value===arr[idx]){document.getElementById(hid).value=arr[0];updatePreview(ft+'-img-preview',API_BASE_URL+arr[0]);}
}

var newVariants=[], editVariants=[];

function parseVariantList(text){
  if(!text||!text.trim())return[];
  return text.split(/[,;\n]+/).map(function(s){return s.trim();}).filter(Boolean);
}

function uniqueColors(ft){
  var arr=ft==='new'?newVariants:editVariants;
  var set={}; arr.forEach(function(v){if(v.colore)set[v.colore]=true;});
  return Object.keys(set);
}
function uniqueSizes(ft){
  var arr=ft==='new'?newVariants:editVariants;
  var set={}; arr.forEach(function(v){if(v.taglia)set[v.taglia]=true;});
  return Object.keys(set);
}

function generateVariantMatrix(ft){
  var colors=parseVariantList(document.getElementById(ft+'-variant-colors').value);
  var sizes=parseVariantList(document.getElementById(ft+'-variant-sizes').value);
  var defaultStock=parseInt(document.getElementById(ft+'-variant-default-stock').value)||5;

  var arr=ft==='new'?newVariants:editVariants;

  var existing={};
  arr.forEach(function(v,i){
    var key=(v.colore||'')+'|'+(v.taglia||'');
    if(colors.indexOf(v.colore)>=0 && sizes.indexOf(v.taglia)>=0){
      if(!existing[key]){existing[key]=v;}
    }
  });

  arr.length=0;
  colors.forEach(function(c){
    sizes.forEach(function(s){
      var key=c+'|'+s;
      var v=existing[key]||{colore:c,taglia:s,stock:defaultStock,prezzo:null};
      arr.push(v);
    });
  });

  renderVariantMatrix(ft);
}

function renderVariantMatrix(ft){
  var container=document.getElementById(ft+'-variants-list');
  var arr=ft==='new'?newVariants:editVariants;
  var colors=uniqueColors(ft), sizes=uniqueSizes(ft);

  if(!arr.length){container.innerHTML='<p class="text-xs text-brand-on-surface-variant py-2">Inserisci colori e taglie e clicca Genera</p>';return;}

  var html='<div class="text-xs font-bold text-brand-on-surface-variant grid gap-1 mb-1" style="grid-template-columns:80px repeat('+sizes.length+',1fr)">';
  html+='<span></span>';
  sizes.forEach(function(s){html+='<span class="text-center">'+escapeHtml(s)+'</span>';});
  html+='</div>';

  colors.forEach(function(c){
    html+='<div class="flex items-center gap-1 mb-1">';
    html+='<span class="text-xs font-semibold text-brand-on-surface w-[80px] flex-shrink-0 truncate">'+escapeHtml(c)+'</span>';
    sizes.forEach(function(s){
      var v=arr.find(function(x){return x.colore===c&&x.taglia===s;})||{colore:c,taglia:s,stock:0,prezzo:null};
      var stock=v.stock||0, prezzo=v.prezzo||'';
      var bg=stock>0?'bg-brand-gold/5 border-brand-gold/10':'bg-brand-surface-container border-brand-outline-variant/10';
      html+='<div class="flex-1 rounded-lg '+bg+' border px-1 py-0.5 text-center">'
        +'<input type="number" value="'+stock+'" onchange="updateMatrixVariant(\''+ft+'\',\''+escapeHtml(c)+'\',\''+escapeHtml(s)+'\',\'stock\',parseInt(this.value)||0)" class="w-full text-[10px] text-center bg-transparent text-brand-on-surface" placeholder="0" min="0">'
        +'<input type="number" step="0.01" value="'+prezzo+'" onchange="updateMatrixVariant(\''+ft+'\',\''+escapeHtml(c)+'\',\''+escapeHtml(s)+'\',\'prezzo\',this.value?parseFloat(this.value):null)" class="w-full text-[10px] text-center bg-transparent text-brand-gold mt-0.5" placeholder="Prezzo">'
        +'</div>';
    });
    html+='</div>';
  });
  container.innerHTML=html;
}

function updateMatrixVariant(ft, colore, taglia, field, val){
  var arr=ft==='new'?newVariants:editVariants;
  var v=arr.find(function(x){return x.colore===colore&&x.taglia===taglia;});
  if(v)v[field]=val;
}

function loadVariantInputs(ft){
  var arr=ft==='new'?newVariants:editVariants;
  var colors=uniqueColors(ft), sizes=uniqueSizes(ft);
  document.getElementById(ft+'-variant-colors').value=colors.join(', ');
  document.getElementById(ft+'-variant-sizes').value=sizes.join(', ');
}

function openCropEditor(ft){
  cropState.formType=ft; cropState.scale=1; cropState.offsetX=0; cropState.offsetY=0;
  document.getElementById('crop-zoom').value=1; document.getElementById('crop-zoom-val').textContent='100%';
  document.getElementById('crop-image').style.display='none';
  document.getElementById('crop-modal').classList.remove('hidden');
  document.getElementById('crop-file-input').click();
}
function closeCropEditor(){ document.getElementById('crop-modal').classList.add('hidden'); cropState.img=null; }
document.getElementById('crop-file-input').addEventListener('change',function(e){
  var file=e.target.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){cropState.img=img;cropState.scale=1;cropState.offsetX=0;cropState.offsetY=0;document.getElementById('crop-zoom').value=1;document.getElementById('crop-zoom-val').textContent='100%';applyCropTransform();document.getElementById('crop-image').style.display='block';};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file); this.value='';
});
function applyCropTransform(){
  var img=document.getElementById('crop-image'); if(!cropState.img)return;
  var c=document.getElementById('crop-container'),cw=c.clientWidth,ch=c.clientHeight;
  var iw=cropState.img.naturalWidth,ih=cropState.img.naturalHeight;
  var bs=Math.max(cw/iw,ch/ih),s=bs*cropState.scale;
  img.style.width=(iw*s)+'px';img.style.height=(ih*s)+'px';
  img.style.left=((cw-iw*s)/2+cropState.offsetX)+'px';
  img.style.top=((ch-ih*s)/2+cropState.offsetY)+'px';
  document.getElementById('crop-image').src=cropState.img.src;
}
document.getElementById('crop-zoom').addEventListener('input',function(){cropState.scale=parseFloat(this.value);document.getElementById('crop-zoom-val').textContent=Math.round(cropState.scale*100)+'%';applyCropTransform();});
var drag=document.getElementById('crop-drag-area');
drag.addEventListener('mousedown',function(e){if(!cropState.img)return;cropState.dragging=true;cropState.startX=e.clientX;cropState.startY=e.clientY;cropState.origX=cropState.offsetX;cropState.origY=cropState.offsetY;e.preventDefault();});
drag.addEventListener('touchstart',function(e){if(!cropState.img||e.touches.length!==1)return;cropState.dragging=true;cropState.startX=e.touches[0].clientX;cropState.startY=e.touches[0].clientY;cropState.origX=cropState.offsetX;cropState.origY=cropState.offsetY;});
window.addEventListener('mousemove',function(e){if(!cropState.dragging)return;cropState.offsetX=cropState.origX+(e.clientX-cropState.startX);cropState.offsetY=cropState.origY+(e.clientY-cropState.startY);applyCropTransform();});
window.addEventListener('touchmove',function(e){if(!cropState.dragging||e.touches.length!==1)return;cropState.offsetX=cropState.origX+(e.touches[0].clientX-cropState.startX);cropState.offsetY=cropState.origY+(e.touches[0].clientY-cropState.startY);applyCropTransform();});
window.addEventListener('mouseup',function(){cropState.dragging=false;});
window.addEventListener('touchend',function(){cropState.dragging=false;});

async function confirmCrop(){
  if(!cropState.img)return;
  var c=document.getElementById('crop-container'),cw=c.clientWidth,ch=c.clientHeight;
  var canvas=document.createElement('canvas'); canvas.width=512;canvas.height=512;
  var ctx=canvas.getContext('2d');
  var iw=cropState.img.naturalWidth,ih=cropState.img.naturalHeight;
  var bs=Math.max(cw/iw,ch/iw),s=bs*cropState.scale;
  var sx=(cw-iw*s)/2+cropState.offsetX,sy=(ch-ih*s)/2+cropState.offsetY;
  ctx.fillStyle='#14100c';ctx.fillRect(0,0,512,512);
  ctx.drawImage(cropState.img,sx*(512/cw),sy*(512/ch),iw*s*(512/cw),ih*s*(512/ch));
  canvas.toBlob(async function(blob){
    if(!blob){alert('Errore elaborazione immagine.');return;}
    try{
      var result=await API.uploadMerchImage(new File([blob],'merch-'+Date.now()+'.png',{type:'image/png'}));
      var ft=cropState.formType,pid=ft+'-img-preview',hid=ft+'-item-immagine';
      document.getElementById(hid).value=result.path;
      updatePreview(pid,API_BASE_URL+result.path);
    }catch(e){alert('Errore upload: '+(e.message||''));}
    closeCropEditor();
  },'image/png',0.9);
}

async function editItem(id){
  try{
    editingItemId=id;
    var item=await API.getMerchItemById(id);
    if(!item)return;
    document.getElementById('edit-item-id').value=item.id;
    document.getElementById('edit-item-nome').value=item.nome;
    document.getElementById('edit-item-descrizione').value=item.descrizione||'';
    document.getElementById('edit-item-prezzo').value=item.prezzo;
    document.getElementById('edit-item-stock').value=item.stock;
    document.getElementById('edit-item-categoria').value=item.categoria;
    document.getElementById('edit-item-immagine').value=item.immaginePath||'';
    document.getElementById('edit-item-attivo').checked=item.attivo;
    document.getElementById('edit-item-title').textContent='Modifica: '+item.nome;
    updatePreview('edit-img-preview',item.immaginePath?API_BASE_URL+item.immaginePath:null);
    editImages=(item.immagini||[]).slice();
    renderGallery('edit');
    editVariants=(item.varianti||[]).map(function(v){return {colore:v.colore||'',taglia:v.taglia||'',stock:v.stock,prezzo:v.prezzo};});
    loadVariantInputs('edit');
    renderVariantMatrix('edit');
    showTab('edit-item');
  }catch(e){alert('Errore: '+e.message);}
}

async function deleteItem(id,nome){ if(!confirm('Eliminare "'+nome+'"?'))return; try{await API.deleteMerchItem(id);loadItems();}catch(e){alert('Errore: '+e.message);} }

function getFormData(ft){
  return {
    nome:document.getElementById(ft+'-item-nome').value.trim(),
    descrizione:document.getElementById(ft+'-item-descrizione').value.trim()||null,
    prezzo:parseFloat(document.getElementById(ft+'-item-prezzo').value),
    stock:parseInt(document.getElementById(ft+'-item-stock').value),
    categoria:document.getElementById(ft+'-item-categoria').value,
    immaginePath:document.getElementById(ft+'-item-immagine').value||null,
    immagini:ft==='new'?newImages.slice():editImages.slice(),
    varianti:(ft==='new'?newVariants:editVariants).filter(function(v){return v.colore||v.taglia;}).map(function(v){return {colore:v.colore||null,taglia:v.taglia||null,stock:v.stock,prezzo:v.prezzo||null};}),
    attivo:document.getElementById(ft+'-item-attivo').checked
  };
}

document.getElementById('edit-item-form').addEventListener('submit',async function(e){
  e.preventDefault();
  try{
    var data=getFormData('edit');
    await API.updateMerchItem(parseInt(document.getElementById('edit-item-id').value),data);
    editingItemId=null; editImages=[]; editVariants=[];
    showTab('items');
  }catch(e){alert('Errore: '+e.message);}
});

document.getElementById('new-item-form').addEventListener('submit',async function(e){
  e.preventDefault();
  try{
    var data=getFormData('new');
    await API.createMerchItem(data);
    document.getElementById('new-item-form').reset();
    document.getElementById('new-item-stock').value=10;
    document.getElementById('new-item-attivo').checked=true;
    document.getElementById('new-item-immagine').value='';
    updatePreview('new-img-preview',null);
    newImages=[]; renderGallery('new');
    newVariants=[]; renderVariantMatrix('new');
    document.getElementById('new-variant-colors').value='';
    document.getElementById('new-variant-sizes').value='';
    showTab('items');
  }catch(e){alert('Errore: '+e.message);}
});

async function loadOrders(){
  try{
    var orders=await API.getAllMerchOrders();
    var list=document.getElementById('orders-list');
    if(!orders||!orders.length){list.innerHTML='<p class="text-brand-on-surface-variant py-8 text-center">Nessun ordine.</p>';return;}
    var colors={'Pending':'text-yellow-400','Paid':'text-green-400','Shipped':'text-blue-400','Cancelled':'text-red-400'};
    var validStatuses=['Pending','Paid','Shipped','Cancelled'];
    list.innerHTML=orders.map(function(o){
      return '<div class="cine-premium-card p-4">'
        +'<div class="flex items-center justify-between mb-2"><div><span class="text-xs font-mono text-brand-gold">'+escapeHtml(o.codiceOrdine||'')+'</span>'
        +'<span class="ml-2 text-[10px] uppercase tracking-widest '+(colors[o.stato]||'text-brand-on-surface-variant')+'">'+escapeHtml(o.stato)+'</span></div>'
        +'<div class="flex items-center gap-2"><span class="text-xs text-brand-on-surface-variant">'+escapeHtml(o.userEmail||'')+'</span>'
        +'<select onchange="updateOrderStatus('+o.id+', this.value)" class="text-xs rounded-lg bg-brand-surface-container border border-brand-outline-variant/30 px-2 py-1 text-brand-on-surface">'
        +validStatuses.map(function(s){return '<option value="'+s+'"'+(o.stato===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div></div>'
        +'<div class="space-y-1 mb-2">'+o.items.map(function(i){return '<div class="flex justify-between text-xs text-brand-on-surface-variant"><span>'+escapeHtml(i.nome)+' &times; '+i.quantita+'</span><span>&euro;'+i.subTotale.toFixed(2)+'</span></div>';}).join('')+'</div>'
        +'<div class="border-t border-brand-outline-variant/10 pt-2 flex justify-between"><span class="text-xs text-brand-on-surface-variant">'+new Date(o.createdAtUtc).toLocaleString('it-IT')+'</span>'
        +'<span class="text-sm font-bold text-brand-gold font-serif">&euro;'+o.totale.toFixed(2)+'</span></div></div>';
    }).join('');
  }catch(e){document.getElementById('orders-list').innerHTML='<p class="text-brand-red py-4">Errore: '+escapeHtml(e.message)+'</p>';}
}

async function updateOrderStatus(id,s){try{await API.updateMerchOrderStatus(id,s);loadOrders();}catch(e){alert('Errore: '+e.message);}}

document.addEventListener('DOMContentLoaded',function(){showTab('items');});

window.showTab = showTab;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.addGalleryImage = addGalleryImage;
window.removeGalleryImage = removeGalleryImage;
window.generateVariantMatrix = generateVariantMatrix;
window.updateMatrixVariant = updateMatrixVariant;
window.openCropEditor = openCropEditor;
window.closeCropEditor = closeCropEditor;
window.confirmCrop = confirmCrop;
window.updateOrderStatus = updateOrderStatus;
