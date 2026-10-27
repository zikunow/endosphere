'use strict';
document.querySelectorAll('.elementor-menu-toggle').forEach(toggle=>{
 const nav=toggle.parentElement.querySelector('nav.elementor-nav-menu--dropdown');
 if(!nav)return;
 const set=open=>{if(open)nav.style.setProperty('--local-menu-top',Math.max(8,toggle.closest('header').getBoundingClientRect().bottom+8)+'px');toggle.classList.toggle('elementor-active',open);toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('local-open',open);nav.setAttribute('aria-hidden',String(!open));nav.querySelectorAll('a').forEach(a=>a.tabIndex=open?0:-1);};
 set(false);toggle.addEventListener('click',()=>set(toggle.getAttribute('aria-expanded')!=='true'));
 toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle.click();}if(e.key==='Escape')set(false);});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
});
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(tab){const group=tab.closest('[role="tablist"]');const peers=group?[...group.querySelectorAll('[role="tab"]')]:tabs;peers.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));if(panel){panel.hidden=!active;panel.classList.toggle('e-active',active);}});}
tabs.forEach(tab=>{if(tab.getAttribute('aria-selected')==='true')selectTab(tab);tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();let i=tabs.indexOf(tab);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[i]);tabs[i].focus();}});});
document.querySelectorAll('.uael-ba-container').forEach(box=>{const image=box.querySelector('.uael-before-img');if(!image)return;const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value='50';range.className='local-compare';range.setAttribute('aria-label','Vorher-Nachher-Vergleich');const divider=document.createElement('span');divider.className='local-divider';box.append(range,divider);range.addEventListener('input',()=>{image.style.clipPath=`inset(0 ${100-Number(range.value)}% 0 0)`;divider.style.left=range.value+'%';});});
const dialog=document.createElement('dialog');dialog.className='local-lightbox';const large=document.createElement('img');const close=document.createElement('button');close.textContent='Schließen';close.type='button';dialog.append(large,close);document.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.querySelectorAll('a[href]').forEach(a=>{if(/\.(jpe?g|png|webp)(\?.*)?$/i.test(a.getAttribute('href'))){a.addEventListener('click',e=>{e.preventDefault();large.src=a.getAttribute('href');large.alt=a.querySelector('img')?.alt||'Bild';dialog.showModal();});}});
document.querySelectorAll('.ti-controls [role="button"]').forEach(button=>{const widget=button.closest('.ti-widget');const row=widget?.querySelector('.ti-reviews-container-wrapper');if(!row)return;const move=()=>row.scrollBy({left:(button.classList.contains('ti-next')?1:-1)*Math.max(295,row.clientWidth*.8),behavior:'smooth'});button.addEventListener('click',move);button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();move();}});});

// Keep anchor targets and the dropdown below the responsive sticky header.
const stickyHeader=document.querySelector('header.elementor-location-header');
if(stickyHeader){
 const updateHeaderOffset=()=>{
  const bottom=stickyHeader.getBoundingClientRect().bottom;
  document.documentElement.style.setProperty('--local-header-offset',Math.ceil(stickyHeader.getBoundingClientRect().height+24)+'px');
  stickyHeader.querySelectorAll('nav.local-open').forEach(nav=>nav.style.setProperty('--local-menu-top',Math.ceil(bottom+8)+'px'));
 };
 new ResizeObserver(updateHeaderOffset).observe(stickyHeader);
 window.addEventListener('resize',updateHeaderOffset);
 updateHeaderOffset();
}

const consultationDialog=document.getElementById('consultation-dialog');
if(consultationDialog){
 document.querySelectorAll('[data-open-consultation]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();consultationDialog.showModal();}));
 consultationDialog.querySelector('.local-consultation-close').addEventListener('click',()=>consultationDialog.close());
 consultationDialog.addEventListener('click',event=>{if(event.target===consultationDialog){const rect=consultationDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)consultationDialog.close();}});
}

// Close method submenus after navigation, outside click or Escape.
document.querySelectorAll('.local-method-menu').forEach(menu=>{
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
 document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}});
});
