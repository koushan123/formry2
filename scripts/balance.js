import {Game} from '../src/game.js';
import {SCENARIOS} from '../src/config.js';

// Explicit synthetic playstyles, not claims about real players.
export function simulatePlaystyle(style='experienced',seed=1,difficulty='normal'){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const g=new Game();g.reset(SCENARIOS[0],difficulty);
 let nextPunch=0,lastState='',defend=true,reactionAt=0,aimOffset=0,misses=0;
 const input={x:0,z:0},dt=1/120;
 for(let i=0;i<120*360&&g.state==='playing';i++){
  const p=g.player,e=g.enemy,experienced=style==='experienced';
  if(e.state==='ATTACK'&&lastState!=='ATTACK'){
   defend=experienced||random()<.88;reactionAt=g.elapsed+(experienced?.15:.35+random()*.35);
  }
  lastState=e.state;
  const distance=Math.hypot(e.x-p.x,e.z-p.z);
  if(!p.contactPending)aimOffset=0;
  p.yaw=Math.atan2(-(e.x-p.x),-(e.z-p.z))+aimOffset;p.pitch=0;
  p.block=e.state==='ATTACK'&&defend&&g.elapsed>=reactionAt;
  input.z=distance>2.12?-1:distance<1.85?.5:0;
  if(!p.block&&g.elapsed>=nextPunch&&distance<2.6){
   if(!experienced&&random()<.18){aimOffset=1.1;p.yaw+=aimOffset;misses++;}
   g.combat.punch();nextPunch=g.elapsed+(experienced?(g.rageLeft>0?.26+random()*.015:.38+random()*.06):.8+random()*.35);
  }
  g.update(dt,input);
 }
 return {style,seed,difficulty,outcome:g.state,seconds:+g.elapsed.toFixed(1),hits:g.hits,health:+g.player.health.value.toFixed(1),releases:g.rageActivations,misses};
}
if(process.argv[1]?.endsWith('balance.js')){
 for(const difficulty of ['easy','normal','hard'])for(const style of ['experienced','new']){
  const runs=Array.from({length:20},(_,i)=>simulatePlaystyle(style,i+1,difficulty));
  const wins=runs.filter(r=>r.outcome==='victory'),times=wins.map(r=>r.seconds).sort((a,b)=>a-b);
  console.log(JSON.stringify({difficulty,style,wins:wins.length,runs:runs.length,min:times[0],median:times[Math.floor(times.length/2)],max:times.at(-1),sample:runs[0]}));
 }
}
