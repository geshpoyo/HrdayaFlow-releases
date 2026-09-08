(async function(){
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  // links are relative to the wiki root so the site works at "/" or any subpath like "/wiki"
  const ROOT=window.__ROOT__||'./';
  const WIKI_ROOT=new URL(ROOT,location.href);
  function urlToGraphSlug(url){
    if(!url)return '';
    var raw=String(url).split('#')[0].split('?')[0],rel='';
    try{
      var u=new URL(raw,WIKI_ROOT.href),rp=WIKI_ROOT.pathname.replace(/\/$/,'')||'',pp=u.pathname.replace(/\/$/,'')||'';
      if(rp&&(pp===rp||pp.startsWith(rp+'/')))pp=pp===rp?'':pp.slice(rp.length+1);
      else if(!/^https?:/i.test(raw)&&raw[0]!=='/')pp=raw.replace(/^\/+/,'').replace(/\/+$/,'');
      else if(raw[0]==='/'){pp=pp.replace(/^\/+/,'');if(rp&&pp.startsWith(rp+'/'))pp=pp.slice(rp.length+1);}
      rel=pp;
    }catch(e){rel=raw.replace(/^\/+/,'').replace(/\/+$/,'');}
    if(!rel)return '';
    return rel.split('/').filter(Boolean).map(function(p){try{return decodeURIComponent(p);}catch(err){return p;}}).map(encodeURIComponent).join('/')+'/';
  }
  function graphHighlight(slugs){
    var bridge=window.__graphBridge__;
    if(bridge&&bridge.setHighlightSlugs)bridge.setHighlightSlugs(slugs);
  }
  function graphRecenter(href){
    var bridge=window.__graphBridge__;
    if(!bridge||!bridge.recenter)return;
    var slug=urlToGraphSlug(href);
    if(slug)bridge.recenter(slug);
  }
  function isWikiHref(h){
    if(!h||h[0]==='#')return false;
    if(/^mailto:/i.test(h)||/^data:/i.test(h)||/^javascript:/i.test(h))return false;
    let u;
    try{u=new URL(h,location.href);}catch(e){return false;}
    if(u.origin!==WIKI_ROOT.origin)return false;
    // site at "/" → pathname "/" becomes "" (not "/"), else `pp.startsWith("//")` rejects all links
    const rp=WIKI_ROOT.pathname.replace(/\/$/,'');
    const pp=u.pathname.replace(/\/$/,'')||'';
    if(!rp)return true;
    return pp===rp||pp.startsWith(rp+'/');
  }
  var wikiNavBridge={slidingOn:null,openPane:null,closeSr:null};
  function shouldOpenWikiLinkInPane(slidingEnabled,href){
    if(!slidingEnabled||!href)return false;
    return isWikiHref(href);
  }
  function resolveWikiLinkNavigation(slidingEnabled,href,modifiers){
    if(modifiers){
      if(modifiers.button===1||modifiers.ctrlKey||modifiers.metaKey||modifiers.shiftKey||modifiers.altKey)return 'navigate';
      if(modifiers.targetBlank)return 'navigate';
    }
    if(shouldOpenWikiLinkInPane(slidingEnabled,href))return 'pane';
    return 'navigate';
  }
  function handleWikiLinkClick(href,ev,opts){
    opts=opts||{};
    var sliding=wikiNavBridge.slidingOn?wikiNavBridge.slidingOn():false;
    var mod=ev?{button:ev.button,ctrlKey:ev.ctrlKey,metaKey:ev.metaKey,shiftKey:ev.shiftKey,altKey:ev.altKey,targetBlank:!!opts.targetBlank}:null;
    var mode=resolveWikiLinkNavigation(sliding,href,mod);
    if(mode==='pane'){
      if(ev)ev.preventDefault();
      graphRecenter(href);
      if(wikiNavBridge.openPane)wikiNavBridge.openPane(href);
      if(opts.closeSearch!==false&&wikiNavBridge.closeSr)wikiNavBridge.closeSr();
      return 'pane';
    }
    if(opts.navigate!==false){
      if(ev)ev.preventDefault();
      graphRecenter(href);
      if(opts.closeSearch!==false&&wikiNavBridge.closeSr)wikiNavBridge.closeSr();
      location.assign(href);
    }
    return 'navigate';
  }
  // theme mode toggle + Senastra theme picker (B1)
  (function(){
    var THEMES=[
      {id:'iroha',label:'いろは'},{id:'raijin',label:'雷神'},{id:'fuujin',label:'風神'},{id:'usui',label:'薄墨'},
      {id:'shouman',label:'初曼'},{id:'hakuro',label:'白郎'},{id:'tsukimi',label:'月見'},{id:'soukou',label:'霜考'},
      {id:'taisetsu',label:'大雪'},{id:'shirakawago',label:'白川郷'},{id:'ryukyu',label:'琉球'},{id:'chojugiga',label:'鳥獣戯画'},
      {id:'hokusai',label:'北斎'},{id:'gogh',label:'ゴッホ'},{id:'geshtalt',label:'geshtalt'}
    ];
    var VALID={};THEMES.forEach(function(t){VALID[t.id]=true;});
    function siteDefault(){return window.__SENASTRA_THEME__||'iroha';}
    function getBase(){
      try{var b=localStorage.getItem('senpub-theme-base');if(b&&VALID[b])return b;}catch(e){}
      return siteDefault();
    }
    function storedMode(){
      try{var s=localStorage.getItem('senpub-theme');if(s==='light'||s==='dark')return s;}catch(e){}
      return null;
    }
    function resolvedMode(){
      var m=storedMode();
      if(m)return m;
      var cur=document.documentElement.getAttribute('data-theme')||'';
      return cur.endsWith('-dark')?'dark':'light';
    }
    function applyTheme(base,mode){
      if(!VALID[base])base=getBase();
      if(mode==='system')mode=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
      document.documentElement.setAttribute('data-theme',mode==='dark'?base+'-dark':base);
    }
    function setBase(base){
      if(!VALID[base])return;
      try{localStorage.setItem('senpub-theme-base',base);}catch(e){}
      applyTheme(base,resolvedMode());
      syncPickerActive();
    }
    function syncPickerActive(){
      var picker=document.getElementById('themePicker');if(!picker)return;
      var cur=getBase();
      picker.querySelectorAll('.theme-picker-item').forEach(function(el){
        el.classList.toggle('is-active',el.getAttribute('data-theme-id')===cur);
        el.setAttribute('aria-selected',el.getAttribute('data-theme-id')===cur?'true':'false');
      });
    }
    var modeBtn=document.getElementById('themeToggle');
    if(modeBtn){
      modeBtn.addEventListener('click',function(){
        var base=getBase(),cur=resolvedMode(),next=cur==='dark'?'light':'dark';
        try{localStorage.setItem('senpub-theme',next);}catch(e){}
        applyTheme(base,next);
      });
    }
    var pickBtn=document.getElementById('themePick');
    var picker=document.getElementById('themePicker');
    function closePicker(){
      if(!picker||picker.hidden)return;
      picker.hidden=true;
      if(pickBtn)pickBtn.setAttribute('aria-expanded','false');
    }
    function openPicker(){
      if(!picker||!pickBtn)return;
      if(!picker.dataset.built){
        picker.innerHTML='<div class="theme-picker-panel" role="listbox">'+THEMES.map(function(t){
          return '<button type="button" class="theme-picker-item" role="option" data-theme-id="'+t.id+'" aria-selected="false">'
            +'<span class="theme-swatch-strip" data-theme="'+t.id+'" aria-hidden="true"><span class="sw1"></span><span class="sw4"></span><span class="sw8"></span></span>'
            +'<span class="theme-picker-label">'+esc(t.label)+'</span></button>';
        }).join('')+'</div>';
        picker.querySelectorAll('.theme-picker-item').forEach(function(el){
          el.addEventListener('click',function(){
            setBase(el.getAttribute('data-theme-id'));
            closePicker();
          });
        });
        picker.dataset.built='1';
      }
      syncPickerActive();
      picker.hidden=false;
      pickBtn.setAttribute('aria-expanded','true');
    }
    if(pickBtn&&picker){
      pickBtn.addEventListener('click',function(e){
        e.stopPropagation();
        if(picker.hidden)openPicker();else closePicker();
      });
      document.addEventListener('click',function(e){
        if(picker.hidden)return;
        if(picker.contains(e.target)||e.target===pickBtn||pickBtn.contains(e.target))return;
        closePicker();
      });
      document.addEventListener('keydown',function(e){
        if(e.key==='Escape')closePicker();
      });
    }
  })();
  // search (Pagefind default | Meilisearch when __SEARCH_CFG__.backend === "meili")
  const q=document.getElementById('q'),sr=document.getElementById('sr');
  if(q&&sr){
    const SEARCH_CFG=window.__SEARCH_CFG__||{backend:'pagefind'};
    const SEARCH_BACKEND=SEARCH_CFG.backend==='meili'?'meili':'pagefind';
    const PF_HIGHLIGHT='highlight',PF_SUB_MAX=3;
    const PF_BASE=new URL('pagefind/',WIKI_ROOT).href;
    let pf=null,pfLoad=null,pfMissing=false,meiliMod=null,meiliLoad=null,activeIdx=-1,flatItems=[],runSeq=0;
    const navSearch=q.closest('.nav-search');
    const palette=document.createElement('div');
    palette.id='searchPalette';
    palette.className='search-palette';
    palette.hidden=true;
    palette.innerHTML='<div class="search-palette-backdrop" tabindex="-1"></div><div class="search-palette-panel" role="dialog" aria-modal="true" aria-label="検索"><div class="search-palette-input"></div><div class="search-palette-results"></div></div>';
    document.body.appendChild(palette);
    const palettePanel=palette.querySelector('.search-palette-panel');
    const paletteInput=palette.querySelector('.search-palette-input');
    const paletteResults=palette.querySelector('.search-palette-results');
    const paletteBackdrop=palette.querySelector('.search-palette-backdrop');
    let focusBeforeOpen=null;
    function isTypingContext(){
      var el=document.activeElement;
      if(!el)return false;
      var tag=el.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return true;
      if(el.isContentEditable)return true;
      return false;
    }
    function restorePaletteDom(){
      if(!navSearch)return;
      if(q.parentElement===paletteInput)navSearch.insertBefore(q,navSearch.firstChild||null);
      if(sr.parentElement===paletteResults)navSearch.appendChild(sr);
    }
    var LAST_Q_KEY='senpub-last-query';
    // 最近の検索（2026-07-14 追加）: 実際にヒットを開いた語だけを localStorage に残し、空でパレットを開いた時に候補として出す
    var RECENT_KEY='senpub-recent-queries',RECENT_MAX=8;
    function getRecent(){
      try{
        var raw=localStorage.getItem(RECENT_KEY);
        if(!raw)return[];
        var a=JSON.parse(raw);
        if(!Array.isArray(a))return[];
        return a.filter(function(s){return typeof s==='string'&&s.trim();}).slice(0,RECENT_MAX);
      }catch(e){return[];}
    }
    function pushRecent(v){
      v=String(v==null?'':v).trim();
      if(!v)return;
      try{
        var list=getRecent().filter(function(s){return s!==v;});
        list.unshift(v);
        localStorage.setItem(RECENT_KEY,JSON.stringify(list.slice(0,RECENT_MAX)));
      }catch(e){}
    }
    function clearRecent(){try{localStorage.removeItem(RECENT_KEY);}catch(e){}}
    function showRecent(){
      openPalette();
      var list=getRecent();
      flatItems=[];activeIdx=-1;
      graphHighlight([]);
      if(!list.length){
        sr.innerHTML='<div class="search-empty">キーワードを入力してください</div>';
        sr.hidden=false;
        sr.setAttribute('role','status');
        sr.removeAttribute('aria-label');
        q.setAttribute('aria-expanded','false');
        return;
      }
      var h='<div class="search-recent-head"><span>最近の検索</span><button type="button" class="search-recent-clear">履歴を消去</button></div>';
      h+='<ul class="search-recent-list">';
      h+=list.map(function(t){
        return '<li><button type="button" class="search-hit search-recent" data-recent-q="'+esc(t)+'" role="option" tabindex="-1" aria-selected="false">'+esc(t)+'</button></li>';
      }).join('');
      h+='</ul>';
      sr.innerHTML=h;
      sr.hidden=false;
      sr.setAttribute('role','listbox');
      sr.setAttribute('aria-label','最近の検索');
      collectFlat();
      setActive(0);
      q.setAttribute('aria-expanded','true');
    }
    function applyQuery(v){
      if(v==null)return;
      q.value=v;
      try{sessionStorage.setItem(LAST_Q_KEY,v);}catch(e){}
      openPalette();
      q.focus();
      try{q.select();}catch(e){}
      run();
    }
    function openPalette(){
      if(!palette.hidden)return;
      focusBeforeOpen=document.activeElement;
      paletteInput.appendChild(q);
      paletteResults.appendChild(sr);
      palette.hidden=false;
      document.body.classList.add('search-palette-open');
      // 直前の検索語を復元（ページ遷移/リロードを跨いでも打ち直し不要）。select() で全選択するのですぐ上書きできる
      if(!q.value){try{var last=sessionStorage.getItem(LAST_Q_KEY);if(last)q.value=last;}catch(e){}}
      q.focus();
      try{q.select();}catch(e){}
      if(q.value.trim())run();
      else showRecent();
    }
    var suppressOpen=false;
    function closePalette(){
      if(palette.hidden)return;
      // フォーカス復帰(prev.focus)で q の focus/click ハンドラが再オープンするのを防ぐ
      // （2026-07-14: これが「パレットから脱出できない」不具合の原因）
      suppressOpen=true;
      palette.hidden=true;
      document.body.classList.remove('search-palette-open');
      restorePaletteDom();
      var prev=focusBeforeOpen;
      focusBeforeOpen=null;
      if(prev&&typeof prev.focus==='function'&&prev!==q)try{prev.focus();}catch(e){}
      else try{q.blur();}catch(e){}
      setTimeout(function(){suppressOpen=false;},0);
    }
    // 脱出手段: backdrop クリック / パレット内のどこでも Escape（2026-07-14 修正: 閉じられない不具合）
    if(paletteBackdrop)paletteBackdrop.addEventListener('click',function(){closeSr();closePalette();});
    palette.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSr();closePalette();}
    });
    q.setAttribute('aria-controls','sr');
    q.setAttribute('aria-autocomplete','list');
    function pfUrl(file){return new URL(file,PF_BASE).href;}
    function meiliModuleUrl(){return new URL('_site/senpub-meili.mjs',WIKI_ROOT).href;}
    function loadPf(){
      if(pf)return Promise.resolve(pf);
      if(pfLoad)return pfLoad;
      pfLoad=import(pfUrl('pagefind.js')).then(function(mod){
        pf=mod.default||mod;
        return pf.options?pf.options({highlightParam:PF_HIGHLIGHT}):pf;
      }).then(function(){return pf;}).catch(function(){pfMissing=true;return null;});
      return pfLoad;
    }
    function loadMeili(){
      if(meiliMod)return Promise.resolve(meiliMod);
      if(meiliLoad)return meiliLoad;
      meiliLoad=import(meiliModuleUrl()).then(function(mod){meiliMod=mod;return mod;}).catch(function(){return null;});
      return meiliLoad;
    }
    function normalizePagefindRow(d){
      const subs=(d.sub_results||[]).filter(function(s,i){return i>0&&s.url&&s.url.indexOf('#')>=0;}).map(function(s){return{url:s.url,title:s.title||''};});
      return{url:d.url||'',title:(d.meta&&d.meta.title)||'',excerptHtml:d.excerpt||'',section:'',subs:subs};
    }
    function resultHref(url){
      if(!url)return ROOT;
      if(url[0]==='/')return url;
      return ROOT+String(url).replace(/^[/]/,'');
    }
    function showState(kind,msg){
      openPalette();
      sr.innerHTML='<div class="search-empty search-'+kind+'">'+esc(msg)+'</div>';
      sr.hidden=false;
      sr.setAttribute('role','status');
      flatItems=[];activeIdx=-1;
      q.setAttribute('aria-expanded','false');
    }
    function closeSr(){
      sr.hidden=true;
      activeIdx=-1;
      flatItems=[];
      q.setAttribute('aria-expanded','false');
      graphHighlight([]);
      closePalette();
    }
    wikiNavBridge.closeSr=closeSr;
    function collectFlat(){
      // a=検索ヒット / button=最近の検索（どちらも矢印キー・Enterで選べる）
      flatItems=Array.from(sr.querySelectorAll('.search-hit'));
    }
    function setActive(idx){
      flatItems.forEach(function(el,i){
        const on=i===idx;
        el.tabIndex=on?0:-1;
        el.setAttribute('aria-selected',on?'true':'false');
        el.classList.toggle('search-active',on);
      });
      activeIdx=idx;
      if(idx>=0&&flatItems[idx])try{flatItems[idx].scrollIntoView({block:'nearest'});}catch(e){}
    }
    function navigateActive(){
      if(activeIdx<0||!flatItems[activeIdx])return;
      var el=flatItems[activeIdx];
      var rq=el.getAttribute('data-recent-q');
      if(rq!=null){applyQuery(rq);return;}
      pushRecent(q.value);
      handleWikiLinkClick(el.href,null,{closeSearch:true});
    }
    function buildRow(row){
      const subs=(row.subs||[]).slice(0,PF_SUB_MAX);
      let h='<div class="search-result">';
      h+='<a class="search-hit search-hit-main" href="'+esc(resultHref(row.url))+'" role="option" tabindex="-1" aria-selected="false">';
      if(row.titleHtml)h+='<span class="search-hit-title">'+row.titleHtml+'</span>';
      else h+='<span class="search-hit-title">'+esc(row.title||'')+'</span>';
      if(row.section)h+='<span class="search-hit-section">'+esc(row.section)+'</span>';
      if(row.excerptHtml)h+='<small class="search-hit-excerpt">'+row.excerptHtml+'</small>';
      h+='</a>';
      if(subs.length){
        h+='<ul class="search-subs" role="group" aria-label="見出し">';
        subs.forEach(function(s){
          h+='<li><a class="search-hit search-sub" href="'+esc(resultHref(s.url))+'" role="option" tabindex="-1" aria-selected="false">'+esc(s.title||'')+'</a></li>';
        });
        h+='</ul>';
      }
      h+='</div>';
      return h;
    }
    async function run(){
      const v=q.value.trim();
      if(!v){
        graphHighlight([]);
        // パレットを開いたまま入力を消した時は閉じずに「最近の検索」へ戻す
        if(!palette.hidden){showRecent();return;}
        closeSr();sr.innerHTML='';return;
      }
      const seq=++runSeq;
      showState('loading','検索中…');
      q.setAttribute('aria-expanded','true');
      let rows=[];
      if(SEARCH_BACKEND==='meili'){
        const mod=await loadMeili();
        if(seq!==runSeq)return;
        if(!mod){
          showState('fallback','Meilisearch モジュール未配置');
          graphHighlight([]);
          return;
        }
        try{
          rows=await mod.searchMeili(SEARCH_CFG,v);
        }catch(e){
          if(seq!==runSeq)return;
          showState('fallback','Meilisearch に接続できません');
          graphHighlight([]);
          return;
        }
      }else{
        const engine=await loadPf();
        if(seq!==runSeq)return;
        if(!engine||pfMissing){
          showState('fallback','検索インデックス未生成（build:search を実行）');
          graphHighlight([]);
          return;
        }
        const res=await engine.debouncedSearch(v);
        if(seq!==runSeq)return;
        const pfRows=await Promise.all((res.results||[]).slice(0,30).map(function(r){return r.data();}));
        rows=pfRows.map(normalizePagefindRow);
      }
      if(seq!==runSeq)return;
      if(!rows.length){showState('nomatch','no match');graphHighlight([]);return;}
      openPalette();
      sr.setAttribute('role','listbox');
      sr.setAttribute('aria-label','検索結果');
      sr.innerHTML=rows.map(function(d){return buildRow(d);}).join('');
      sr.hidden=false;
      collectFlat();
      setActive(0);
      q.setAttribute('aria-expanded','true');
      graphHighlight(rows.map(function(d){return urlToGraphSlug(d.url);}).filter(Boolean));
    }
    q.addEventListener('input',function(){
      try{sessionStorage.setItem(LAST_Q_KEY,q.value);}catch(e){}
      run();
    });
    q.addEventListener('focus',function(){if(suppressOpen)return;openPalette();});
    q.addEventListener('click',function(){if(suppressOpen)return;openPalette();});
    q.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();closeSr();closePalette();return;}
      if(sr.hidden||!flatItems.length)return;
      if(e.key==='ArrowDown'){e.preventDefault();setActive(activeIdx<flatItems.length-1?activeIdx+1:0);}
      else if(e.key==='ArrowUp'){e.preventDefault();setActive(activeIdx>0?activeIdx-1:flatItems.length-1);}
      else if(e.key==='Enter'){e.preventDefault();navigateActive();}
    });
    sr.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();closeSr();closePalette();return;}
      if(!flatItems.length)return;
      if(e.key==='ArrowDown'){e.preventDefault();setActive(activeIdx<flatItems.length-1?activeIdx+1:0);}
      else if(e.key==='ArrowUp'){e.preventDefault();setActive(activeIdx>0?activeIdx-1:flatItems.length-1);}
      else if(e.key==='Enter'){e.preventDefault();navigateActive();}
    });
    sr.addEventListener('mousemove',function(e){
      const a=e.target.closest('.search-hit');
      if(!a)return;
      const idx=flatItems.indexOf(a);
      if(idx>=0)setActive(idx);
    });
    sr.addEventListener('click',function(e){
      var rec=e.target.closest('button.search-recent');
      if(rec){e.preventDefault();applyQuery(rec.getAttribute('data-recent-q'));return;}
      if(e.target.closest('button.search-recent-clear')){e.preventDefault();clearRecent();showRecent();return;}
      var a=e.target.closest('a.search-hit');
      if(!a)return;
      pushRecent(q.value);
      handleWikiLinkClick(a.href,e,{closeSearch:true});
    });
    paletteBackdrop.addEventListener('click',function(){closeSr();});
    palette.addEventListener('keydown',function(e){
      if(e.key!=='Tab'||palette.hidden)return;
      var nodes=palette.querySelectorAll('input:not([disabled]),a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
      var list=Array.from(nodes).filter(function(n){return n.offsetParent!==null;});
      if(!list.length)return;
      var first=list[0],last=list[list.length-1];
      if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
      else if(document.activeElement===last){e.preventDefault();first.focus();}
    });
    document.addEventListener('keydown',function(e){
      if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){
        e.preventDefault();
        openPalette();
        return;
      }
      if(e.key==='/'&&!isTypingContext()){
        e.preventDefault();
        openPalette();
      }
    });
    if(SEARCH_BACKEND!=='meili')(function initLandingHighlight(){
      if(!/[?&]/.test(location.search)||!location.search.includes(PF_HIGHLIGHT+'='))return;
      import(pfUrl('pagefind-highlight.js')).then(function(){
        if(window.PagefindHighlight)new PagefindHighlight({highlightParam:PF_HIGHLIGHT,markContext:'[data-pagefind-body]'});
      }).catch(function(){});
    })();
  }
  // sidebar nav (client-rendered from nav.json)
  const navEl=document.getElementById('nav');
  if(navEl&&window.__NAV__){
    let items=[];try{items=await (await fetch(window.__NAV__)).json();}catch(e){}
    const CUR=window.__CUR__||'';
    const WIKI=window.__WIKI__||'';
    const NAV_KEY='senpub-nav-open';
    const enc=p=>p.split('/').map(encodeURIComponent).join('/');
    function loadNavState(){try{const all=JSON.parse(localStorage.getItem(NAV_KEY)||'{}');return all[WIKI]||{};}catch(e){return {};}}
    function saveNavState(st){try{const all=JSON.parse(localStorage.getItem(NAV_KEY)||'{}');all[WIKI]=st;localStorage.setItem(NAV_KEY,JSON.stringify(all));}catch(e){}}
    const navState=loadNavState();
    function ren(nodes,path){let h='';for(const it of nodes){if(it.c){const fp=path?path+'/'+it.t:it.t;const open=!!navState[fp];const label=it.p?('<a'+(it.p===CUR?' class="active"':'')+' href="'+ROOT+enc(it.p)+'/">'+esc(it.t)+'</a>'):esc(it.t);h+='<details class="nav-folder" data-path="'+esc(fp)+'"'+(open?' open':'')+'><summary>'+label+'</summary>'+ren(it.c,fp)+'</details>';}else{h+='<a'+(it.p===CUR?' class="active"':'')+' href="'+(it.p?ROOT+enc(it.p)+'/':ROOT)+'">'+esc(it.t)+'</a>';}}return h;}
    navEl.innerHTML=ren(items,'');
    let a=navEl.querySelector('a.active'),p=a&&a.parentElement;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}
    if(a)try{a.scrollIntoView({block:'center'});}catch(e){}
    navEl.querySelectorAll('details.nav-folder').forEach(function(d){
      d.addEventListener('toggle',function(){const fp=d.getAttribute('data-path');if(!fp)return;const st=loadNavState();st[fp]=d.open;saveNavState(st);});
    });
  }
  // mobile nav overlay
  (function(){var btn=document.getElementById('navToggle');if(!btn)return;function setOpen(on){document.body.classList.toggle('nav-open',on);btn.setAttribute('aria-expanded',on?'true':'false');}
    btn.addEventListener('click',function(){setOpen(!document.body.classList.contains('nav-open'));});
    document.addEventListener('click',function(e){if(!document.body.classList.contains('nav-open'))return;if(e.target===btn||btn.contains(e.target))return;var sb=document.querySelector('.sidebar');if(sb&&(sb.contains(e.target)||e.target===sb))return;setOpen(false);});
  })();
  // On This Page scroll-spy
  (function(){
    var otpObserver=null,otpCurrent='';
    function setOtpActive(id){
      if(otpCurrent===id)return;
      otpCurrent=id;
      const otp=document.querySelector('.otp');
      if(!otp)return;
      otp.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.classList.toggle('active',a.getAttribute('href')==='#'+id);
      });
    }
    function initOtpScrollSpy(){
      if(otpObserver){otpObserver.disconnect();otpObserver=null;}
      otpCurrent='';
      const otp=document.querySelector('.otp');
      const content=document.querySelector('.senpub-pane.is-active .content')||document.querySelector('.content');
      if(!otp||!content)return;
      const links=Array.from(otp.querySelectorAll('a[href^="#"]'));
      const byId=new Map(links.map(function(a){return[a.getAttribute('href').slice(1),a];}));
      const headings=Array.from(content.querySelectorAll('h1,h2,h3')).filter(function(h){return byId.has(h.id);});
      if(!headings.length)return;
      const visible=new Map();
      otpObserver=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting)visible.set(e.target.id,e);
          else visible.delete(e.target.id);
        });
        if(!visible.size)return;
        const top=Array.from(visible.values()).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top;})[0];
        setOtpActive(top.target.id);
      },{root:null,rootMargin:'-10% 0px -75% 0px',threshold:[0,1]});
      headings.forEach(function(h){otpObserver.observe(h);});
      setOtpActive(headings[0].id);
    }
    const rc=document.querySelector('.rightcol');
    if(rc){
      rc.addEventListener('click',function(e){
        const a=e.target.closest('.otp a[href^="#"]');
        if(!a)return;
        const id=a.getAttribute('href').slice(1),el=document.getElementById(id);
        if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth',block:'start'});setOtpActive(id);}
      });
    }
    initOtpScrollSpy();
    window.__initOtpScrollSpy__=initOtpScrollSpy;
  })();
  // local graph — d3-force + pixi (P2/P3), static canvas fallback, fullscreen overlays
  (function(){
    const GW=340,GH=300;
    let graphLoad=null;
    let graphModuleLoad=null;
    let overlayEl=null;
    let overlayDestroy=null;
    let overlayMode=null;
    let overlayBox=null;
    let graphData=null;
    let activeGraphBox=null;
    let pendingHighlight=[];
    function wikiRoot(){return window.__ROOT__||'./';}
    function graphModuleUrl(){
      return new URL('_site/senpub-graph.mjs',new URL(wikiRoot(),location.href)).href;
    }
    function fetchGraph(){
      if(!graphLoad)graphLoad=fetch(wikiRoot()+'_site/graph.json').then(function(r){if(!r.ok)throw new Error(String(r.status));return r.json();}).then(function(g){graphData=g;return g;});
      return graphLoad;
    }
    function loadGraphModule(){
      if(!graphModuleLoad)graphModuleLoad=import(graphModuleUrl()).catch(function(){return null;});
      return graphModuleLoad;
    }
    function overlaySize(){
      return{width:window.innerWidth,height:Math.max(320,window.innerHeight)};
    }
    function ensureOverlay(){
      if(overlayEl)return overlayEl;
      overlayEl=document.createElement('div');
      overlayEl.className='graph-overlay';
      overlayEl.innerHTML='<div class="graph-overlay-backdrop" aria-hidden="true"></div><div class="graph-overlay-panel" role="dialog" aria-modal="true" aria-label="Graph"><button type="button" class="graph-overlay-close" aria-label="Close">×</button><div class="graph-overlay-viewport"></div></div>';
      document.body.appendChild(overlayEl);
      overlayEl.querySelector('.graph-overlay-backdrop').addEventListener('click',closeOverlay);
      overlayEl.querySelector('.graph-overlay-close').addEventListener('click',closeOverlay);
      document.addEventListener('keydown',function(e){
        if(e.key==='Escape'&&overlayEl&&overlayEl.classList.contains('open')){e.preventDefault();closeOverlay();}
        if((e.ctrlKey||e.metaKey)&&e.key==='g'){
          e.preventDefault();
          if(overlayEl&&overlayEl.classList.contains('open')&&overlayMode==='global')closeOverlay();
          else{
            const box=overlayBox||document.querySelector('.graph');
            if(box)openOverlay('global',box).catch(function(){});
          }
        }
      });
      return overlayEl;
    }
    function closeOverlay(){
      if(overlayDestroy){overlayDestroy();overlayDestroy=null;}
      if(overlayEl)overlayEl.classList.remove('open');
      overlayMode=null;
      document.body.classList.remove('graph-overlay-open');
    }
    async function openOverlay(mode,box){
      const g=await fetchGraph();
      const mod=await loadGraphModule();
      if(!mod||!mod.renderGraph)return;
      const el=ensureOverlay();
      const vp=el.querySelector('.graph-overlay-viewport');
      const slug=box.getAttribute('data-slug');
      if(!slug||!vp)return;
      if(overlayDestroy){overlayDestroy();overlayDestroy=null;}
      overlayMode=mode;
      overlayBox=box;
      const sz=overlaySize();
      const cfg=mode==='global'
        ?{global:true,width:sz.width,height:sz.height}
        :{width:sz.width,height:sz.height,scale:0.5,depth:1,enableRadial:false,focusOnHover:false,topHubCount:0,global:false};
      const res=await mod.renderGraph(vp,Object.assign(cfg,{graph:g,slug,wiki:window.__WIKI__||'',wikiRoot:wikiRoot()}));
      overlayDestroy=res&&res.destroy;
      el.classList.add('open');
      document.body.classList.add('graph-overlay-open');
    }
    function getVisibleGraphBox(){
      return activeGraphBox||document.querySelector('.graph');
    }
    function showGraphRelated(box,node){
      var panel=box&&box.querySelector('.graph-related');
      if(!panel||!graphData||!node)return;
      var api=box._graphApi;
      var neighbors=api&&api.getSemanticNeighborGids?api.getSemanticNeighborGids(node._gid):[];
      if(!neighbors.length){panel.hidden=true;panel.innerHTML='';return;}
      var prefix=wikiRoot().endsWith('/')?wikiRoot():wikiRoot()+'/';
      var h='<h4 class="graph-related-title">関連ノート</h4><ul class="graph-related-list">';
      neighbors.slice(0,12).forEach(function(nb){
        var n=graphData.nodes[nb.gid];
        if(!n)return;
        h+='<li><a class="graph-related-link" href="'+esc(prefix+n.u)+'">'+esc(n.t)+'</a></li>';
      });
      h+='</ul>';
      panel.innerHTML=h;
      panel.hidden=false;
    }
    function graphRenderCfg(box,g,slug){
      var sem=box.querySelector('.graph-semantic');
      return{
        graph:g,slug:slug,wiki:window.__WIKI__||'',wikiRoot:wikiRoot(),
        showSemantic:!!(sem&&sem.getAttribute('aria-pressed')==='true'),
        highlightSlugs:pendingHighlight,
        onNodeSelect:function(n){showGraphRelated(box,n);}
      };
    }
    async function renderForceGraph(box,slug,g){
      const mod=await loadGraphModule();
      const vp=box.querySelector('.graph-viewport');
      const cv=box.querySelector('.graph-canvas');
      if(!mod||!mod.renderGraph||!vp)return false;
      if(box._graphDestroy)box._graphDestroy();
      const res=await mod.renderGraph(vp,graphRenderCfg(box,g,slug));
      box._graphDestroy=res&&res.destroy;
      box._graphApi=res||null;
      box._mode='force';
      activeGraphBox=box;
      if(cv){cv.hidden=true;cv.setAttribute('aria-hidden','true');}
      vp.hidden=false;
      if(res&&res.setHighlightSlugs&&pendingHighlight.length)res.setHighlightSlugs(pendingHighlight);
      return true;
    }
    async function recenterGraph(slug){
      const box=getVisibleGraphBox();
      if(!box||!slug)return;
      box.setAttribute('data-slug',slug);
      let g;
      try{g=await fetchGraph();}catch(e){return;}
      box._mounted=false;
      await mount(box);
    }
    function localFromGraph(g,slug){
      const idx=(g.nodes||[]).findIndex(function(n){return n.u===slug;});
      if(idx<0)return{center:{title:'',kind:'center'},neighbors:[]};
      const center={title:g.nodes[idx].t,kind:'center'};
      const prefix=wikiRoot(),out=[],back=[],seen=new Set();
      (g.links||[]).forEach(function(lk){
        const a=lk[0],b=lk[1];
        if(a===idx&&b!==idx){var n=g.nodes[b];if(!seen.has(b)){seen.add(b);out.push({title:n.t,href:prefix+n.u,kind:'out'});}}
        else if(b===idx&&a!==idx){var n2=g.nodes[a];if(!seen.has(a)){seen.add(a);back.push({title:n2.t,href:prefix+n2.u,kind:'back'});}}
      });
      return{center,neighbors:out.slice(0,8).concat(back.slice(0,6))};
    }
    function tok(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    function colors(){return{center:tok('--color-accent'),out:tok('--color-accent-subtle'),back:tok('--color-text-tertiary'),line:tok('--color-border-strong'),text:tok('--color-text-secondary'),textPri:tok('--color-text-primary'),font:tok('--font-family-sans')||'sans-serif'};}
    function layout(data,W,H){
      const cx=W/2,cy=H/2,r=Math.min(W,H)*0.34,nbs=data.neighbors||[];
      const nodes=[{title:data.center.title,kind:'center',href:null,x:cx,y:cy}];
      nbs.forEach(function(nb,k){const a=(2*Math.PI*k)/Math.max(nbs.length,1)-Math.PI/2;nodes.push(Object.assign({},nb,{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}));});
      return nodes;
    }
    function paint(box,hover){
      const cv=box.querySelector('.graph-canvas');if(!cv||!box._nodes)return;
      const W=box._W||GW,H=box._H||GH;
      const ctx=cv.getContext('2d'),c=box._colors,n=box._nodes;
      ctx.clearRect(0,0,W,H);
      for(let i=1;i<n.length;i++){ctx.strokeStyle=c.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(n[0].x,n[0].y);ctx.lineTo(n[i].x,n[i].y);ctx.stroke();}
      n.forEach(function(nd,i){const cen=i===0,hov=i===hover,r=cen?11:(hov?8:6);
        ctx.fillStyle=cen?c.center:(nd.kind==='out'?c.out:c.back);ctx.beginPath();ctx.arc(nd.x,nd.y,r,0,Math.PI*2);ctx.fill();
        if(cen||hov){ctx.fillStyle=cen?c.textPri:c.text;ctx.font=(cen?11:10)+'px '+c.font;ctx.textAlign='center';ctx.fillText(nd.title.slice(0,cen?10:14),nd.x,nd.y+r+14);}});
    }
    function hit(box,mx,my){
      const n=box._nodes||[];
      for(let i=n.length-1;i>=0;i--){const r=i===0?11:8,dx=mx-n[i].x,dy=my-n[i].y;if(dx*dx+dy*dy<=r*r)return i;}
      return-1;
    }
    function xy(cv,e,W,H){const r=cv.getBoundingClientRect();return{mx:(e.clientX-r.left)*(W/r.width),my:(e.clientY-r.top)*(H/r.height)};}
    function hostSize(box){
      const host=box.querySelector('.graph-host');
      const rect=host?host.getBoundingClientRect():null;
      const W=Math.round(rect&&rect.width?rect.width:GW)||GW;
      const H=Math.round(rect&&rect.height?rect.height:GH)||GH;
      return{W,H};
    }
    function mountFallback(box,slug,g){
      const cv=box.querySelector('.graph-canvas');
      const vp=box.querySelector('.graph-viewport');
      const host=box.querySelector('.graph-host');
      if(!cv||!slug)return false;
      if(vp)vp.hidden=true;
      cv.hidden=false;
      cv.removeAttribute('aria-hidden');
      const data=localFromGraph(g,slug);
      const dpr=window.devicePixelRatio||1;
      function resizeFallback(){
        const s=hostSize(box);
        box._W=s.W;box._H=s.H;
        cv.width=s.W*dpr;cv.height=s.H*dpr;
        cv.style.width='100%';cv.style.height='100%';
        cv.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
        box._nodes=layout(data,s.W,s.H);
        paint(box,box._hover>=0?box._hover:null);
      }
      box._colors=colors();box._hover=-1;box._mode='fallback';
      resizeFallback();
      cv.onmousemove=function(e){const p=xy(cv,e,box._W,box._H),h=hit(box,p.mx,p.my);if(h!==box._hover){box._hover=h;paint(box,h>=0?h:null);}};
      cv.onmouseleave=function(){box._hover=-1;paint(box,null);};
      cv.onclick=function(e){const p=xy(cv,e,box._W,box._H),h=hit(box,p.mx,p.my);if(h>0&&box._nodes[h].href)location.href=box._nodes[h].href;};
      if(host&&!box._fallbackRo){
        box._fallbackRo=new ResizeObserver(function(){resizeFallback();});
        box._fallbackRo.observe(host);
      }
      return true;
    }
    var SEM_KEY='senpub-show-semantic';
    function readSemanticPref(){
      try{return sessionStorage.getItem(SEM_KEY)==='1';}catch(e){return false;}
    }
    function writeSemanticPref(on){
      try{sessionStorage.setItem(SEM_KEY,on?'1':'0');}catch(e){}
    }
    function wireGraphActions(box){
      const ex=box.querySelector('.graph-expand');
      const gl=box.querySelector('.graph-global');
      const sem=box.querySelector('.graph-semantic');
      if(ex&&!ex._wired){ex._wired=true;ex.addEventListener('click',function(e){e.preventDefault();openOverlay('local',box).catch(function(){});});}
      if(gl&&!gl._wired){gl._wired=true;gl.addEventListener('click',function(e){e.preventDefault();openOverlay('global',box).catch(function(){});});}
      if(sem&&!sem._wired){
        sem._wired=true;
        if(readSemanticPref())sem.setAttribute('aria-pressed','true');
        sem.addEventListener('click',function(e){
          e.preventDefault();
          var on=sem.getAttribute('aria-pressed')!=='true';
          sem.setAttribute('aria-pressed',on?'true':'false');
          writeSemanticPref(on);
          if(box._graphApi&&box._graphApi.setShowSemantic)box._graphApi.setShowSemantic(on);
          else if(box._mode==='force'){box._mounted=false;mount(box).catch(function(){});}
        });
      }
    }
    async function mount(box){
      const slug=box.getAttribute('data-slug');
      const vp=box.querySelector('.graph-viewport');
      const cv=box.querySelector('.graph-canvas');
      if(!slug||(!vp&&!cv))return;
      if(box._mounted&&box._mode==='force')return;
      wireGraphActions(box);
      let g;
      try{g=await fetchGraph();}catch(e){return;}
      box._mounted=true;
      try{
        if(await renderForceGraph(box,slug,g))return;
      }catch(e){}
      mountFallback(box,slug,g);
    }
    function remountTheme(box){
      if(box._mode==='fallback'){box._colors=colors();paint(box,box._hover>=0?box._hover:null);}
      else if(box._mode==='force'&&box._graphDestroy){box._mounted=false;mount(box).catch(function(){});}
    }
    window.__mountGraph__=function(b){wireGraphActions(b);mount(b).catch(function(){});};
    window.__closeGraphOverlay__=closeOverlay;
    window.__graphBridge__={
      setHighlightSlugs:function(slugs){
        pendingHighlight=Array.isArray(slugs)?slugs:[];
        var box=getVisibleGraphBox();
        if(box&&box._graphApi&&box._graphApi.setHighlightSlugs)box._graphApi.setHighlightSlugs(pendingHighlight);
      },
      recenter:recenterGraph
    };
    document.querySelectorAll('.graph').forEach(function(b){mount(b).catch(function(){});});
    new MutationObserver(function(){document.querySelectorAll('.graph').forEach(remountTheme);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  })();
  // sliding panes (reading.slidingPanes: true | "toggle")
  (function(){
    if(!window.__SLIDING__)return;
    const WIKI=window.__WIKI__||'';
    const PANE_KEY='senpub-pane-w';
    const MIN=360,MAX=1200,DEFAULT=700,SPINE_DEFAULT=36,HANDLE_DEFAULT=8;
    const rc=document.getElementById('renderContainer');
    if(!rc)return;
    const mq=window.matchMedia('(max-width: 1024px)');
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    function slidingOn(){return document.body.classList.contains('senpub-sliding')&&!mq.matches;}
    wikiNavBridge.slidingOn=slidingOn;
    function paneStore(){try{const all=JSON.parse(localStorage.getItem(PANE_KEY)||'{}');return all;}catch(e){return {};}}
    function loadPaneWidth(){try{const w=paneStore()[WIKI];if(w){const n=Number(w);if(n>=MIN&&n<=MAX)document.documentElement.style.setProperty('--senpub-pane-width',n+'px');}}catch(e){}}
    function savePaneWidth(px){try{const all=paneStore();all[WIKI]=px;localStorage.setItem(PANE_KEY,JSON.stringify(all));}catch(e){}}
    loadPaneWidth();
    let activeIndex=0;
    function paneNodes(){return Array.from(rc.querySelectorAll('.senpub-pane'));}
    function cssPx(name,fallback){
      const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return parseFloat(v)||fallback;
    }
    function spineWidth(){return cssPx('--senpub-spine-width',SPINE_DEFAULT);}
    function handleWidth(){return cssPx('--senpub-pane-handle-width',HANDLE_DEFAULT);}
    function paneWidth(pane){
      const v=getComputedStyle(pane).getPropertyValue('--senpub-pane-width').trim();
      if(v)return parseFloat(v);
      const root=getComputedStyle(document.documentElement).getPropertyValue('--senpub-pane-width').trim();
      return parseFloat(root)||DEFAULT;
    }
    function updateCollapse(){
      const panes=paneNodes();
      if(!panes.length)return;
      if(!slidingOn()){
        panes.forEach(function(p){p.classList.remove('is-collapsed');});
        return;
      }
      const spineW=spineWidth(),handleW=handleWidth(),viewport=rc.clientWidth;
      const collapsed=new Array(panes.length).fill(false);
      function widthAt(i){return collapsed[i]?spineW:paneWidth(panes[i])+handleW;}
      function totalWidth(){
        let t=0;for(let i=0;i<panes.length;i++)t+=widthAt(i);return t;
      }
      while(totalWidth()>viewport){
        let did=false;
        for(let i=0;i<activeIndex;i++){
          if(!collapsed[i]){collapsed[i]=true;did=true;break;}
        }
        if(!did)break;
      }
      panes.forEach(function(p,i){p.classList.toggle('is-collapsed',collapsed[i]);});
    }
    function refreshPaneState(){
      const panes=paneNodes();
      if(!panes.length)return;
      activeIndex=Math.min(Math.max(0,activeIndex),panes.length-1);
      panes.forEach(function(p,i){
        p.dataset.paneIndex=String(i);
        p.style.setProperty('--pane-index',i);
        p.classList.toggle('is-active',i===activeIndex);
      });
      updateCollapse();
    }
    (function initFirstPane(){
      const panes=paneNodes();
      if(panes.length){
        // 相対 data-url を絶対 URL に正規化し、同一ページの二重オープンを防ぐ
        panes[0].dataset.url=location.href;
      }
      activeIndex=Math.max(0,panes.length-1);
    })();
    refreshPaneState();
    let resizeTimer;
    function scheduleCollapse(){clearTimeout(resizeTimer);resizeTimer=setTimeout(updateCollapse,100);}
    window.addEventListener('resize',scheduleCollapse);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(scheduleCollapse).observe(rc);
    mq.addEventListener('change',refreshPaneState);
    // ライト/ダークの隣のトグル: スライディング ON/OFF（reading.slidingPanes:"toggle"）
    (function(){
      const btn=document.getElementById('slideToggle');
      if(!btn)return;
      function reflect(){btn.setAttribute('aria-pressed',document.body.classList.contains('senpub-sliding')?'true':'false');}
      btn.addEventListener('click',function(){
        const on=document.body.classList.toggle('senpub-sliding');
        try{localStorage.setItem('senpub-sliding',on?'on':'off');}catch(e){}
        refreshPaneState();
        reflect();
      });
      reflect();
    })();
    function absUrl(href){return new URL(href,location.href).href;}
    function shouldIntercept(e,a){
      if(!slidingOn())return false;
      if(e.defaultPrevented||e.button===1||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return false;
      if(a.target==='_blank')return false;
      return isWikiHref(a.getAttribute('href'));
    }
    function rewriteRelativeUrls(root,pageUrl){
      root.querySelectorAll('a[href],img[src],video[src],audio[src],source[src]').forEach(function(el){
        ['href','src'].forEach(function(attr){
          if(!el.hasAttribute(attr))return;
          const val=el.getAttribute(attr);
          if(!val||val[0]==='#'||val.startsWith('data:')||val.startsWith('mailto:')||/^https?:\/\//i.test(val))return;
          el.setAttribute(attr,new URL(val,pageUrl).href);
        });
      });
    }
    function extractPage(doc){
      const content=doc.querySelector('.senpub-pane.is-active .content')||doc.querySelector('article.content')||doc.querySelector('.content');
      const title=(doc.querySelector('title')?.textContent||'').split('|')[0].trim();
      const right=doc.querySelector('.rightcol');
      return{content:content?content.innerHTML:'',title,right:right?right.innerHTML:''};
    }
    function typesetPane(body){
      if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([body]).catch(function(){});
      if(window.mermaid){const nodes=body.querySelectorAll('.mermaid');if(nodes.length)window.mermaid.run({nodes}).catch(function(){});}
    }
    function prepareRightcol(html,pageUrl){
      const root=document.createElement('div');
      root.innerHTML=html;
      rewriteRelativeUrls(root,pageUrl);
      return root.innerHTML;
    }
    function updateRightcol(html){
      const aside=document.querySelector('.rightcol');if(!aside)return;
      aside.innerHTML=html;
      aside.querySelectorAll('.graph').forEach(function(g){if(window.__mountGraph__)window.__mountGraph__(g);});
      if(window.__initOtpScrollSpy__)window.__initOtpScrollSpy__();
    }
    function scrollToPane(pane){
      // sticky 背表紙を押し出さない：アクティブ右端が viewport 右端に来るよう寄せる（収まるなら 0）
      const behavior=reducedMotion.matches?'auto':'smooth';
      const target=Math.max(0,pane.offsetLeft+pane.offsetWidth-rc.clientWidth);
      try{rc.scrollTo({left:target,behavior});}catch(e){rc.scrollLeft=target;}
    }
    function createPane(title,html,url){
      const pane=document.createElement('div');
      pane.className='senpub-pane';
      pane.dataset.url=url;
      pane.innerHTML='<button class="senpub-pane-spine" type="button" aria-label="'+esc(title)+'">'+esc(title)+'</button><div class="senpub-pane-body"><article class="content">'+html+'</article></div><div class="senpub-pane-handle" role="separator" aria-orientation="vertical" aria-label="ペイン幅を変更"></div>';
      return pane;
    }
    function paneUrlKey(u){
      try{
        const raw=String(u||'');
        // build 時の相対 data-url は wiki ルート基準。location 基準だと深い階層で誤解決する
        const base=(/^https?:\/\//i.test(raw)||raw.startsWith('/')||raw.startsWith('.'))?location.href:WIKI_ROOT.href;
        const x=new URL(raw,base);
        return x.origin+(x.pathname.replace(/\/$/,'')||'')+'/';
      }catch(e){return String(u||'');}
    }
    function findPaneByUrl(url){
      const key=paneUrlKey(url);
      return paneNodes().find(function(p){return paneUrlKey(p.dataset.url||'')===key;})||null;
    }
    let opening=false;
    async function openPane(href){
      if(!slidingOn()||opening)return;
      const url=absUrl(href);
      const existing=findPaneByUrl(url);
      if(existing){
        activeIndex=paneNodes().indexOf(existing);
        refreshPaneState();
        scrollToPane(existing);
        history.pushState({senpubPane:true},'',url);
        return;
      }
      opening=true;
      try{
        const res=await fetch(url);
        if(!res.ok)return;
        const pageUrl=res.url||url;
        const doc=new DOMParser().parseFromString(await res.text(),'text/html');
        const data=extractPage(doc);
        if(!data.content)return;
        const body=document.createElement('div');
        body.innerHTML=data.content;
        rewriteRelativeUrls(body,pageUrl);
        const pane=createPane(data.title||'Page',body.innerHTML,pageUrl);
        rc.appendChild(pane);
        activeIndex=paneNodes().length-1;
        refreshPaneState();
        typesetPane(pane.querySelector('.senpub-pane-body'));
        if(data.right)updateRightcol(prepareRightcol(data.right,pageUrl));
        else if(window.__initOtpScrollSpy__)window.__initOtpScrollSpy__();
        scrollToPane(pane);
        history.pushState({senpubPane:true},'',pageUrl);
      }catch(err){}finally{opening=false;}
    }
    wikiNavBridge.openPane=openPane;
    document.addEventListener('click',function(e){
      const spine=e.target.closest('.senpub-pane-spine');
      if(spine){
        const pane=spine.closest('.senpub-pane');
        if(pane){
          activeIndex=paneNodes().indexOf(pane);
          refreshPaneState();
          scrollToPane(pane);
        }
        return;
      }
      const a=e.target.closest('a');
      if(!a||!shouldIntercept(e,a))return;
      handleWikiLinkClick(a.href,e,{closeSearch:true});
    });
    window.addEventListener('popstate',function(){location.reload();});
    let dragPane=null,startX=0,startW=0;
    function clampW(n){return Math.min(MAX,Math.max(MIN,n));}
    rc.addEventListener('pointerdown',function(e){
      const handle=e.target.closest('.senpub-pane-handle');
      if(!handle||!slidingOn())return;
      dragPane=handle.closest('.senpub-pane');
      if(!dragPane)return;
      startX=e.clientX;startW=paneWidth(dragPane);
      document.body.classList.add('senpub-sliding-resizing');
      try{handle.setPointerCapture(e.pointerId);}catch(err){}
      e.preventDefault();
    });
    rc.addEventListener('pointermove',function(e){
      if(!dragPane)return;
      const w=clampW(startW+(e.clientX-startX));
      dragPane.style.setProperty('--senpub-pane-width',w+'px');
      updateCollapse();
    });
    function endDrag(e){
      if(!dragPane)return;
      const w=clampW(paneWidth(dragPane));
      dragPane.style.setProperty('--senpub-pane-width',w+'px');
      document.documentElement.style.setProperty('--senpub-pane-width',w+'px');
      savePaneWidth(w);
      document.body.classList.remove('senpub-sliding-resizing');
      try{e.target.releasePointerCapture(e.pointerId);}catch(err){}
      dragPane=null;
      updateCollapse();
    }
    rc.addEventListener('pointerup',endDrag);
    rc.addEventListener('pointercancel',endDrag);
    rc.addEventListener('dblclick',function(e){
      const handle=e.target.closest('.senpub-pane-handle');
      if(!handle)return;
      const pane=handle.closest('.senpub-pane');
      if(!pane)return;
      pane.style.removeProperty('--senpub-pane-width');
      document.documentElement.style.setProperty('--senpub-pane-width',DEFAULT+'px');
      savePaneWidth(DEFAULT);
      updateCollapse();
    });
  })();
  // hover preview
  (function(){
    if(!window.__HOVER_PREVIEW__||window.matchMedia('(hover: none)').matches)return;
    const cache=new Map();let pop=null,timer=null,pending=null;
    function close(){clearTimeout(timer);timer=null;if(pop){pop.remove();pop=null;}pending=null;}
    function abs(h){try{return new URL(h,location.href).href;}catch(e){return h;}}
    function internal(a){return a&&a.tagName==='A'&&isWikiHref(a.getAttribute('href'));}
    function extract(html){const doc=new DOMParser().parseFromString(html,'text/html'),title=(doc.querySelector('title')?.textContent||'').trim(),c=doc.querySelector('.content');
      let text='';if(c){const el=c.querySelector('p')||c;text=el.textContent.replace(/\s+/g,' ').trim();}if(text.length>200)text=text.slice(0,197)+'…';return{title,text};}
    function place(link){if(!pop)return;const r=link.getBoundingClientRect();pop.style.visibility='hidden';document.body.appendChild(pop);
      const pr=pop.getBoundingClientRect();let top=r.bottom+8,left=r.left;if(left+pr.width>window.innerWidth-8)left=Math.max(8,window.innerWidth-pr.width-8);
      if(top+pr.height>window.innerHeight-8)top=Math.max(8,r.top-pr.height-8);pop.style.top=top+'px';pop.style.left=left+'px';pop.style.visibility='';}
    function show(link,data){close();pending=link;pop=document.createElement('div');pop.className='hover-preview';
      pop.innerHTML='<div class="hover-preview-title">'+esc(data.title)+'</div><div class="hover-preview-body">'+esc(data.text)+'</div>';
      pop.addEventListener('mouseleave',close);place(link);}
    document.addEventListener('mouseover',function(e){const a=e.target.closest('.content a');if(!internal(a))return;clearTimeout(timer);pending=a;
        timer=setTimeout(async function(){const url=abs(a.getAttribute('href'));let data=cache.get(url);
          if(!data){try{const res=await fetch(url);if(!res.ok)return;data=extract(await res.text());cache.set(url,data);}catch(err){return;}}
          if(pending===a)show(a,data);},300);});
    document.addEventListener('mouseout',function(e){const a=e.target.closest('.content a');if(!internal(a))return;const rel=e.relatedTarget;if(pop&&rel&&(pop.contains(rel)||pop===rel))return;if(rel&&a.contains(rel))return;close();});
    document.addEventListener('scroll',close,true);
  })();
})();