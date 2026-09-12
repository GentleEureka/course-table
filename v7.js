(() => {
'use strict';
const STORE='kejian-timetable-v1';
const MIN_SECTIONS=12;
const REOPEN_KEY='kejian-v7-reopen-time-settings';
const $=s=>document.querySelector(s);
const addSectionButton=$('#addSectionButton');
const coreAddSection=addSectionButton?.onclick;
function readState(){try{return JSON.parse(localStorage.getItem(STORE))}catch(e){return null}}
function writeState(state){localStorage.setItem(STORE,JSON.stringify(state))}
function activeBoard(state){return state?.boards?.find(b=>b.id===state.activeBoardId)||state?.boards?.[0]||null}
function syncVisibleSettings(b){const f=$('#settingsForm');if(!f)return;b.times=Array.isArray(b.times)?b.times:[];$('#timeEditor')?.querySelectorAll('input[type="time"]').forEach(inp=>{const i=+inp.dataset.i,k=+inp.dataset.k;while(b.times.length<=i)b.times.push(['','']);b.times[i][k]=inp.value});if(f.elements.name)b.name=f.elements.name.value.trim()||b.name;if(f.elements.firstDay?.value)b.firstDay=f.elements.firstDay.value;if(f.elements.termWeeks?.value)b.termWeeks=Math.max(1,Math.min(60,+f.elements.termWeeks.value||b.termWeeks));if(f.elements.showWeekend)b.showWeekend=f.elements.showWeekend.checked;if(f.elements.showOtherWeeks)b.showOtherWeeks=f.elements.showOtherWeeks.checked;if(f.elements.reminder)b.reminder=f.elements.reminder.checked}
function sectionInUse(b,section){return (b.courses||[]).some(c=>(c.slots||[]).some(s=>+s.start<=section&&+s.end>=section))}
function removeSection(section){if(section<=MIN_SECTIONS)return;const state=readState(),b=activeBoard(state);if(!b)return;syncVisibleSettings(b);if(sectionInUse(b,section)){alert(`第 ${section} 节已有课程，请先调整对应课程时段后再删除。`);return}b.times=Array.isArray(b.times)?b.times:[];b.times.splice(section-1,1);for(const c of b.courses||[])for(const s of c.slots||[])if(+s.start>section){s.start=+s.start-1;s.end=+s.end-1}b.maxSections=Math.max(MIN_SECTIONS,(+b.maxSections||MIN_SECTIONS)-1);if(b.times.length>b.maxSections)b.times.length=b.maxSections;writeState(state);sessionStorage.setItem(REOPEN_KEY,'1');location.reload()}
function makeButton(kind,section){const button=document.createElement('button');button.type='button';button.className=`time-row-control time-row-${kind}`;button.textContent=kind==='remove'?'×':'+';if(kind==='remove'){button.title=section<=MIN_SECTIONS?'默认保留 12 节':`删除第 ${section} 节`;button.setAttribute('aria-label',button.title);button.disabled=section<=MIN_SECTIONS;button.onclick=e=>{e.preventDefault();e.stopPropagation();removeSection(section)}}else{button.title='添加一节';button.setAttribute('aria-label','添加一节');button.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof coreAddSection==='function')coreAddSection.call(addSectionButton,e);else addSectionButton?.click();setTimeout(()=>{decorateRows();$('#timeEditor')?.lastElementChild?.scrollIntoView({block:'nearest',behavior:'smooth'})},0)}}return button}
function decorateRows(){const ed=$('#timeEditor');if(!ed)return;[...ed.children].forEach((row,i)=>{const section=i+1;row.querySelectorAll('.time-row-control').forEach(x=>x.remove());const label=row.querySelector('b');if(label)label.textContent=String(section);row.querySelectorAll('input[type="time"]').forEach((inp,k)=>{inp.dataset.i=String(i);inp.dataset.k=String(k)});row.append(makeButton('remove',section),makeButton('add',section))})}
function bindRows(){const ed=$('#timeEditor');if(!ed)return;new MutationObserver(()=>queueMicrotask(decorateRows)).observe(ed,{childList:true});$('#settingsButton')?.addEventListener('click',()=>setTimeout(decorateRows,0));decorateRows()}
function reopenAfterDelete(){if(sessionStorage.getItem(REOPEN_KEY)!=='1')return;sessionStorage.removeItem(REOPEN_KEY);setTimeout(()=>{const settings=$('#settingsButton');settings?.click();setTimeout(()=>{const details=$('#settingsForm details');if(details)details.open=true;decorateRows();$('#timeEditor')?.lastElementChild?.scrollIntoView({block:'nearest'})},60)},40)}
bindRows();
reopenAfterDelete();
})();
