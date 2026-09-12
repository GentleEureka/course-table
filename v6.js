(() => {
'use strict';
const STORE='kejian-timetable-v1';
const FONT_STORE='kejian-v6-course-font-scale';
const FONT_MIN=80,FONT_MAX=140,FONT_STEP=5,FONT_DEFAULT=100;
const $=s=>document.querySelector(s);
function readState(){try{return JSON.parse(localStorage.getItem(STORE))}catch(e){return null}}
function writeState(state){localStorage.setItem(STORE,JSON.stringify(state))}
function readFontMap(){try{const x=JSON.parse(localStorage.getItem(FONT_STORE));return x&&typeof x==='object'?x:{}}catch(e){return {}}}
function writeFontMap(map){localStorage.setItem(FONT_STORE,JSON.stringify(map))}
function activeBoard(state=readState()){return state?.boards?.find(b=>b.id===state.activeBoardId)||state?.boards?.[0]||null}
function clampScale(v){v=Number(v);if(!Number.isFinite(v))v=FONT_DEFAULT;return Math.max(FONT_MIN,Math.min(FONT_MAX,Math.round(v/FONT_STEP)*FONT_STEP))}
function syncFontMapFromState(){const state=readState();if(!state?.boards?.length)return;const map=readFontMap();const ids=new Set(state.boards.map(b=>b.id));let changed=false;for(const b of state.boards){if(map[b.id]==null&&Number.isFinite(Number(b.cardFontScale))){map[b.id]=clampScale(b.cardFontScale);changed=true}}for(const id of Object.keys(map)){if(!ids.has(id)){delete map[id];changed=true}}if(changed)writeFontMap(map)}
function currentScale(){const state=readState(),b=activeBoard(state);if(!b)return FONT_DEFAULT;const map=readFontMap();return clampScale(map[b.id]??b.cardFontScale??FONT_DEFAULT)}
function setFontVars(scale){scale=clampScale(scale);const compact=matchMedia('(max-width:720px)').matches;const name=(compact?12.5:16)*scale/100;const meta=(compact?10.5:13)*scale/100;const weeks=(compact?9.5:12)*scale/100;const root=document.documentElement;root.style.setProperty('--course-name-size',`${name.toFixed(2)}px`);root.style.setProperty('--course-meta-size',`${meta.toFixed(2)}px`);root.style.setProperty('--course-weeks-size',`${weeks.toFixed(2)}px`)}
function applySavedFontScale(){syncFontMapFromState();setFontVars(currentScale())}
function saveCurrentScale(scale){const state=readState(),b=activeBoard(state);if(!b)return;const map=readFontMap();map[b.id]=clampScale(scale);writeFontMap(map);setFontVars(map[b.id])}
function installFontScaleSetting(){const form=$('#settingsForm');if(!form||$('#cardFontScaleField'))return;const details=form.querySelector('details');const label=document.createElement('label');label.id='cardFontScaleField';label.innerHTML='<span class="font-scale-title">课表色块字号 <strong id="cardFontScaleValue">100%</strong></span><input id="cardFontScale" name="cardFontScale" type="range" min="80" max="140" step="5" value="100"><small>调整课程名、地点等色块内文字大小</small>';
if(details)form.insertBefore(label,details);else form.querySelector('.dialog-actions')?.before(label);
const range=$('#cardFontScale'),out=$('#cardFontScaleValue');
range.addEventListener('input',()=>{const value=clampScale(range.value);out.textContent=`${value}%`;setFontVars(value)});
const loadControl=()=>{const value=currentScale();range.value=String(value);out.textContent=`${value}%`;setFontVars(value)};
$('#settingsButton')?.addEventListener('click',()=>setTimeout(loadControl,0));
form.addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;saveCurrentScale(range.value)});
$('#settingsDialog')?.addEventListener('close',applySavedFontScale);
}
function patchSyncCode(){setTimeout(()=>{const box=$('#syncCode');if(!box?.value)return;try{const obj=JSON.parse(decodeURIComponent(escape(atob(box.value.trim()))));if(!obj?.board)return;obj.board.cardFontScale=currentScale();box.value=btoa(unescape(encodeURIComponent(JSON.stringify(obj))))}catch(e){}},0)}
function bindSyncFontScale(){const share=$('#shareBoardButton');if(share)share.addEventListener('click',patchSyncCode);const form=$('#codeForm');if(form)form.addEventListener('submit',()=>setTimeout(()=>{syncFontMapFromState();applySavedFontScale()},20))}
function bindBoardFontRefresh(){const list=$('#boardList');if(list)new MutationObserver(()=>applySavedFontScale()).observe(list,{childList:true});window.addEventListener('resize',applySavedFontScale)}
function rowStart(node){const direct=parseInt(node.style.gridRowStart,10);if(Number.isFinite(direct))return direct;const m=(node.style.gridRow||'').match(/^\s*(\d+)/);return m?+m[1]:0}
function applySessionGaps(){const schedule=$('#schedule');if(!schedule)return;for(const node of schedule.children){node.classList.remove('session-gap-top');const row=rowStart(node);if(row===6||row===10)node.classList.add('session-gap-top')}}
function bindSessionGaps(){const schedule=$('#schedule');if(!schedule)return;new MutationObserver(()=>queueMicrotask(applySessionGaps)).observe(schedule,{childList:true});applySessionGaps()}
function syncPanelOpenState(){const panel=$('#boardPanel');const open=!!panel?.classList.contains('open');document.documentElement.classList.toggle('panel-open',open);document.body.classList.toggle('panel-open',open)}
function bindPanelScrollLock(){const panel=$('#boardPanel');if(!panel)return;new MutationObserver(syncPanelOpenState).observe(panel,{attributes:true,attributeFilter:['class']});document.addEventListener('touchmove',e=>{if(!panel.classList.contains('open'))return;if(!panel.contains(e.target))e.preventDefault()},{passive:false,capture:true});panel.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});syncPanelOpenState()}
function bindRenameBoard(){
  const button=$('#renameBoardButton');
  if(!button)return;
  button.onclick=()=>{
    const state=readState();
    if(!state?.boards?.length)return;
    const current=state.boards.find(b=>b.id===state.activeBoardId)||state.boards[0];
    const value=prompt('给当前课表命名：',current?.name||'我的课表');
    if(value===null)return;
    const name=value.trim();
    if(!name){alert('课表名称不能为空');return}
    if(name.length>30){alert('课表名称最多 30 个字符');return}
    current.name=name;
    writeState(state);
    location.reload();
  };
}
bindRenameBoard();
installFontScaleSetting();
bindSyncFontScale();
bindBoardFontRefresh();
bindSessionGaps();
bindPanelScrollLock();
applySavedFontScale();
})();
