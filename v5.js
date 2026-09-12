(() => {
'use strict';
const STORE='kejian-timetable-v1';
const MIGRATION_FLAG='kejian-v5-firstday-20260831';
const FIRST_DAY='2026-08-31';
const MAX_SECTIONS=12;
const DEFAULT_TIMES=[['08:00','08:45'],['08:55','09:40'],['10:00','10:45'],['10:55','11:40'],['14:00','14:45'],['14:55','15:40'],['16:00','16:45'],['16:55','17:40'],['19:00','19:45'],['19:55','20:40'],['21:00','21:45'],['21:55','22:40']];
const $=s=>document.querySelector(s);
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function readState(){try{return JSON.parse(localStorage.getItem(STORE))}catch(e){return null}}
function writeState(state){localStorage.setItem(STORE,JSON.stringify(state))}
function blankBoard(name='我的课表'){return{id:uid(),name,firstDay:FIRST_DAY,termWeeks:20,maxSections:MAX_SECTIONS,showWeekend:true,showOtherWeeks:false,reminder:true,times:DEFAULT_TIMES.map(x=>[...x]),courses:[]}}
function migrateFirstDay(){if(localStorage.getItem(MIGRATION_FLAG)==='1')return false;const state=readState();if(!state?.boards?.length){localStorage.setItem(MIGRATION_FLAG,'1');return false}const active=state.boards.find(b=>b.id===state.activeBoardId)||state.boards[0];let changed=false;if(active&&active.firstDay!==FIRST_DAY){active.firstDay=FIRST_DAY;changed=true}localStorage.setItem(MIGRATION_FLAG,'1');if(changed)writeState(state);return changed}
function bindDeleteBoard(){const button=$('#deleteBoardButton');if(!button)return;button.onclick=()=>{const state=readState();if(!state?.boards?.length)return;const current=state.boards.find(b=>b.id===state.activeBoardId)||state.boards[0];const name=current?.name||'当前课表';const ok=confirm(`确定删除此课表“${name}”？\n\n该课表中的全部课程、周次和设置都会从这台设备删除。此操作无法撤销。`);if(!ok)return;state.boards=state.boards.filter(b=>b.id!==current.id);if(!state.boards.length){const fresh=blankBoard();state.boards=[fresh];state.activeBoardId=fresh.id}else{state.activeBoardId=state.boards[0].id}writeState(state);location.reload()}}
function bindNewBoardDefault(){const form=$('#newBoardForm');if(!form)return;form.addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;setTimeout(()=>{const state=readState();if(!state?.boards?.length)return;const active=state.boards.find(b=>b.id===state.activeBoardId)||state.boards[state.boards.length-1];if(active&&active.firstDay!==FIRST_DAY){active.firstDay=FIRST_DAY;writeState(state);location.reload()}},0)})}
function rowStart(node){const direct=parseInt(node.style.gridRowStart,10);if(Number.isFinite(direct))return direct;const m=(node.style.gridRow||'').match(/^\s*(\d+)/);return m?+m[1]:0}
function clampCourseCard(card,startRow){const end=card.style.gridRowEnd||'';const m=end.match(/span\s+(\d+)/i);if(!m)return;const allowed=Math.max(1,13-startRow+1);if(+m[1]>allowed)card.style.gridRowEnd=`span ${allowed}`}
function enforceScheduleRows(){const schedule=$('#schedule');if(!schedule)return;const compact=matchMedia('(max-width:720px)').matches;schedule.style.gridTemplateRows=compact?'30px repeat(12,minmax(0,1fr))':'46px repeat(12,76px)';[...schedule.children].forEach(node=>{const start=rowStart(node);if(start>=14){node.remove();return}if(node.classList?.contains('course-card')&&start>=2)clampCourseCard(node,start)})}
function limitSelectOptions(root=document){root.querySelectorAll?.('.slot-start,.slot-end').forEach(select=>{[...select.options].forEach(opt=>{if(+opt.value>MAX_SECTIONS)opt.remove()});if(+select.value>MAX_SECTIONS)select.value=String(MAX_SECTIONS)})}
function limitTimeEditor(){const box=$('#timeEditor');if(!box)return;[...box.children].slice(MAX_SECTIONS).forEach(node=>node.remove())}
function enforceTwelveSections(){enforceScheduleRows();limitSelectOptions();limitTimeEditor()}
function bindTwelveSectionLimit(){const schedule=$('#schedule');const slots=$('#slotList');const times=$('#timeEditor');const observer=new MutationObserver(()=>queueMicrotask(enforceTwelveSections));if(schedule)observer.observe(schedule,{childList:true});if(slots)observer.observe(slots,{childList:true,subtree:true});if(times)observer.observe(times,{childList:true});window.addEventListener('resize',enforceTwelveSections);document.addEventListener('click',()=>queueMicrotask(enforceTwelveSections));enforceTwelveSections()}
function installThemeStyles(){if(document.querySelector('link[data-kejian-theme]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='./theme.css';link.dataset.kejianTheme='1';document.head.append(link)}
function applyAutoTheme(){const hour=new Date().getHours();const dark=hour>=18||hour<6;document.documentElement.classList.toggle('dark-theme',dark);const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#0f172a':'#eaf0fb'}
function initAutoTheme(){installThemeStyles();applyAutoTheme();window.addEventListener('pageshow',applyAutoTheme);document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAutoTheme()});setInterval(applyAutoTheme,60000)}
bindDeleteBoard();bindNewBoardDefault();bindTwelveSectionLimit();initAutoTheme();
if(migrateFirstDay())setTimeout(()=>location.reload(),0);
})();
