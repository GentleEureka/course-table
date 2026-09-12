(() => {
'use strict';
const STORE='kejian-timetable-v1';
const $=s=>document.querySelector(s);
function readState(){try{return JSON.parse(localStorage.getItem(STORE))}catch(e){return null}}
function writeState(state){localStorage.setItem(STORE,JSON.stringify(state))}
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
})();
