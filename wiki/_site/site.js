(async function(){
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  // links are relative to the wiki root so the site works at "/" or any subpath like "/wiki"
  const ROOT=window.__ROOT__||'./';
  // theme toggle（既定は <head> インラインで適用済み。ここはボタンの配線のみ）
  (function(){var btn=document.getElementById('themeToggle');if(!btn)return;function cur(){return document.documentElement.getAttribute('data-theme')||((window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');}btn.addEventListener('click',function(){var next=cur()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('senpub-theme',next);}catch(e){}});})();
  // sidebar nav (client-rendered from nav.json)
  const navEl=document.getElementById('nav');
  if(navEl&&window.__NAV__){
    let items=[];try{items=await (await fetch(window.__NAV__)).json();}catch(e){}
    const CUR=window.__CUR__||'';
    const enc=p=>p.split('/').map(encodeURIComponent).join('/');
    function ren(nodes){let h='';for(const it of nodes){if(it.c){h+='<details class="nav-folder"><summary>'+esc(it.t)+'</summary>'+ren(it.c)+'</details>';}else{h+='<a'+(it.p===CUR?' class="active"':'')+' href="'+(it.p?ROOT+enc(it.p)+'/':ROOT)+'">'+esc(it.t)+'</a>';}}return h;}
    navEl.innerHTML=ren(items);
    let a=navEl.querySelector('a.active'),p=a&&a.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}
    if(a)try{a.scrollIntoView({block:'center'});}catch(e){}
  }
  // search
  const q=document.getElementById('q'),sr=document.getElementById('sr');
  if(q){let idx=[];try{idx=await (await fetch(window.__SEARCH__)).json();}catch(e){}
    function run(){const v=q.value.trim().toLowerCase();if(!v){sr.hidden=true;sr.innerHTML='';return;}
      const hits=idx.filter(it=>(it.title+' '+(it.description||'')).toLowerCase().includes(v)).slice(0,30);
      sr.innerHTML=hits.map(h=>'<a href="'+ROOT+h.url.replace(/^[/]/,'')+'">'+esc(h.title)+'<br><small style="color:#5a6763">'+esc(h.description||'')+'</small></a>').join('')||'<div style="padding:8px;color:#5a6763">no match</div>';
      sr.hidden=false;}
    q.addEventListener('input',run);
    document.addEventListener('click',e=>{if(!sr.contains(e.target)&&e.target!==q)sr.hidden=true;});
  }
})();