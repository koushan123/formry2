import {TouchInput} from './touch.js';

export class InputManager {
 constructor(canvas,game,{onPause,onAttack,onDodge,sensitivity}){
  this.keys=new Set();this.canvas=canvas;this.game=game;this.sensitivity=sensitivity;
  this.touch=null;
  const isTouch='ontouchstart' in window||navigator.maxTouchPoints>0;
  window.addEventListener('keydown',e=>{if(game.state!=='playing')return;if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Escape','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code.startsWith('Shift')&&!e.repeat)onDodge(this.axes());if(e.code==='Escape')onPause();});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||game.state!=='playing')return;game.player.yaw-=e.movementX*this.sensitivity();game.player.pitch=Math.max(-1.15,Math.min(1.15,game.player.pitch-e.movementY*this.sensitivity()));});
  canvas.addEventListener('mousedown',e=>{if(game.state!=='playing'||document.pointerLockElement!==canvas)return;if(e.button===0)onAttack();if(e.button===2){game.player.block=true;game.player.buffered=false;}});
  window.addEventListener('mouseup',e=>{if(e.button===2)game.player.block=false;});
  window.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&game.state==='playing'&&!isTouch)onPause();});
  window.addEventListener('blur',()=>{this.clear();if(game.state==='playing')onPause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing')onPause();});
  if(isTouch){
   this.touch=new TouchInput();
   this.touch.onPunch=()=>{if(game.state==='playing')onAttack();};
   this.touch.onBlockStart=()=>{game.player.block=true;game.player.buffered=false;};
   this.touch.onBlockEnd=()=>{game.player.block=false;};
   this.touch.onDodge=d=>onDodge({x:d.x,z:0});
   this.touch.onPause=()=>onPause();
  }
 }
 axes(){
  const t=this.touch?this.touch.axes():{x:0,z:0};
  return{x:Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'))+t.x,z:Number(this.keys.has('KeyS'))-Number(this.keys.has('KeyW'))+t.z};
 }
 lookDelta(){return this.touch?this.touch.lookDelta():null;}
 clear(){this.keys.clear();this.game.player.block=false;this.game.player.buffered=false;}
 async capture(){
  if(this.touch)this.touch.show(); // re-show pads after pause/resume
  if('ontouchstart' in window||navigator.maxTouchPoints>0)return;
  await this.canvas.requestPointerLock();
 }
}
