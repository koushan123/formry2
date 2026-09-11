const TOUCH='ontouchstart' in window||navigator.maxTouchPoints>0;
import {CONFIG as C} from './config.js';

export const formatTime=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export class UIManager {
 constructor(){this.nodes=new Map();this.values=new Map();this.calloutLeft=0;this.calloutPriority=0;this.hitLeft=0;this.flash=0;this.comboPulse=0;this.inputLeft=0;}
 node(id){if(!this.nodes.has(id))this.nodes.set(id,document.getElementById(id));return this.nodes.get(id);}
 text(id,value){value=String(value);if(this.values.get(id)===value)return;this.values.set(id,value);this.node(id).textContent=value;}
 width(id,value){this.node(id).style.transform=`scaleX(${Math.max(0,Math.min(1,value)).toFixed(3)})`;}
 callout(text,duration=.7,priority=0){if(this.calloutLeft>0&&priority<this.calloutPriority)return;this.text('callout',text);this.calloutLeft=duration;this.calloutPriority=priority;}
 input(text){this.text('attack-status',text);this.inputLeft=.7;}
 reset(){this.calloutLeft=0;this.calloutPriority=0;this.flash=0;this.hitLeft=0;this.comboPulse=0;this.inputLeft=0;this.values.clear();}
 event(type,data,game){
  if(type==='hit'){this.hitLeft=.12;this.comboPulse=.16;if(data.strong)this.callout(data.vulnerable?'WIDE OPEN.':'POWER SHOT.',.55);}
  if(type==='combo')this.callout(data.count===3?'NICE. ×3':data.count===5?'POWERFUL. ×5':`KEEP IT GOING. ×${data.count}`,1,1);
  if(type==='rage')this.callout('RELEASE. LET IT OUT.',1.8,3);
  if(type==='calm')this.callout('BREATHE. GO AGAIN.',1.1,2);
  if(type==='hurt'){this.flash=.42;this.input(TOUCH?'HIT TAKEN / HOLD FIRE TO BLOCK':'HIT TAKEN / HOLD RIGHT CLICK TO BLOCK');}
  if(type==='block')this.input('BLOCKED / YOUR TURN');
  if(type==='evade')this.input('DODGED / YOUR TURN');
  if(type==='miss')this.input(data.reason);
  if(type==='buffered')this.input('NEXT PUNCH READY');
  if(type==='guarding')this.input('RELEASE RIGHT CLICK TO PUNCH');
  if(type==='victory'||type==='defeat')this.callout(type==='victory'?'KNOCKOUT. PRESSURE OFF.':'DOWN, BUT NOT OUT.',2,5);
 }
 update(game,dt){
  this.calloutLeft=Math.max(0,this.calloutLeft-dt);this.hitLeft=Math.max(0,this.hitLeft-dt);this.flash=Math.max(0,this.flash-dt*1.6);this.comboPulse=Math.max(0,this.comboPulse-dt);this.inputLeft=Math.max(0,this.inputLeft-dt);
  const p=game.player,e=game.enemy,raging=game.rageLeft>0,threat=e.state==='ATTACK',opening=e.state==='RECOVER'||e.state==='STAGGER';
  this.text('health-value',Math.ceil(p.health.value));this.width('health-bar',p.health.value/p.health.max);
  this.text('enemy-value',`${Math.ceil(e.health.value/e.health.max*100)}%`);this.width('enemy-bar',e.health.value/e.health.max);
  this.text('enemy-state',e.state==='DEFEATED'?'DEFEATED':threat?'INCOMING':opening?'OPEN':'READY');
  this.text('combat-cue',threat?'BLOCK OR DODGE':opening?'OPENING / PUNCH NOW':'CLOSE IN. FIND YOUR RHYTHM.');
  this.node('combat-cue').classList.toggle('threat',threat);this.node('combat-cue').classList.toggle('opening',opening);
  this.width('warning-bar',threat?1-e.timer/game.difficulty.windup:0);
  this.text('combo-value',`×${game.combo}`);this.width('combo-timer',game.comboLeft/C.comboTimeout);
  this.text('combo-label',game.combo>=5?'POWERFUL':game.combo>=3?'NICE COMBO':'HIT COMBO');
  this.node('combo-value').style.transform=`scale(${1+this.comboPulse*.5})`;
  this.width('release-bar',raging?game.rageLeft/C.rageDuration:game.release/100);
  this.text('release-value',raging?`${game.rageLeft.toFixed(1)}s`:`${game.release}%`);
  this.text('release-label',raging?'RELEASE MODE':'RELEASE');
  this.text('release-note',raging?'FASTER HANDS. HEAVIER HITS.':'LAND HITS. LET IT OUT.');
  this.text('dodge-status',p.dodgeCooldown>0?`DODGE / ${p.dodgeCooldown.toFixed(1)}s`:TOUCH?'FIRE SWIPE / DODGE READY':'SHIFT / DODGE READY');
  this.text('timer',formatTime(game.elapsed));this.text('round-difficulty',game.difficulty.label.toUpperCase());
  this.node('callout').style.opacity=this.calloutLeft>0?1:0;
  this.node('hit-marker').style.opacity=this.hitLeft>0?1:0;
  this.node('damage-flash').style.opacity=this.flash;
  this.node('attack-status').style.opacity=this.inputLeft>0?1:0;
  document.body.classList.toggle('rage',raging&&game.state==='playing');
  document.body.classList.toggle('low-health',p.health.value<=25&&game.state==='playing');
 }
}
