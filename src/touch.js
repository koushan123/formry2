/* Lightweight touch controls for Anger Release.
 *
 * Mirrors the keyboard/mouse InputManager actions onto on-screen pads so the
 * existing combat, movement and round code is reused untouched:
 *   - Left joystick: movement (same axes contract as WASD: x = right, z = back).
 *   - Right pad: look — a rate-based aim stick applied to player yaw/pitch.
 *   - FIRE pad: tap = punch, hold = block (like right-click), swipe off the
 *     pad = dodge in that direction (like Shift + direction).
 *   - Pause pad: same as Esc.
 *
 * The main loop reads `axes()` (movement) and `lookDelta()` (yaw/pitch rates)
 * each frame; handlers mirror attack/block/dodge/pause. Hidden by default;
 * main.js shows/hides them around rounds.
 */
const FIRE_TAP_MS=220;
export class TouchInput{
 constructor(){
  this.touches=new Map();this.lookX=0;this.lookY=0;this.dodgeCooldown=0;
  this.joy=this.frame('touch-joy');this.stick=this.frame('touch-stick');this.joy.appendChild(this.stick);
  this.look=this.frame('touch-look');this.pivot=this.frame('touch-pivot');this.look.appendChild(this.pivot);
  this.fire=this.frame('touch-fire');
  this.pause=this.frame('touch-pause');this.pause.textContent='\u23F8';
  for(const el of [this.joy,this.look,this.fire,this.pause])document.body.appendChild(el);
  this.onPunch=null;this.onBlockStart=null;this.onBlockEnd=null;this.onDodge=null;this.onPause=null;
  window.addEventListener('pointerdown',e=>this.down(e),{passive:false});
  window.addEventListener('pointermove',e=>this.move(e),{passive:false});
  window.addEventListener('pointerup',e=>this.up(e),{passive:false});
  window.addEventListener('pointercancel',e=>this.up(e),{passive:false});
 }
 frame(name){
  const styles={
   'touch-joy':'position:fixed;left:18px;bottom:190px;width:140px;height:140px;border-radius:70px;background:rgba(74,38,56,.32);backdrop-filter:blur(6px);border:1px solid #b7849c44;z-index:30;touch-action:none;display:none;',
   'touch-stick':'position:absolute;left:50%;top:50%;width:62px;height:62px;border-radius:31px;background:linear-gradient(135deg,#D46A8C,#B0527A);box-shadow:0 0 32px #ff8fb188;transform:translate(-50%,-50%);',
   'touch-look':'position:fixed;right:18px;bottom:190px;width:190px;height:170px;border-radius:24px;background:rgba(26,16,24,.45);backdrop-filter:blur(6px);border:1px solid #b7849c44;z-index:30;touch-action:none;display:none;',
   'touch-pivot':'position:absolute;left:50%;top:50%;width:36px;height:36px;border-radius:20px;background:#FFD9E6;box-shadow:0 0 22px #ff8fb1;transform:translate(-50%,-50%);opacity:.85;',
   'touch-fire':'position:fixed;right:38px;bottom:74px;width:88px;height:88px;border-radius:44px;background:linear-gradient(135deg,#FF8FB1,#B0527A);box-shadow:0 0 36px #ff8fb199;z-index:31;touch-action:none;display:none;text-align:center;',
   'touch-pause':'position:fixed;left:18px;bottom:78px;width:64px;height:64px;border-radius:32px;background:rgba(26,16,24,.55);border:1px solid #b7849c66;z-index:31;touch-action:none;display:none;text-align:center;font-size:26px;line-height:60px;color:#E8A8BC;'};
  const el=document.createElement('div');el.className=name;el.style.cssText=styles[name]||'';
  if(name==='touch-fire'){const span=document.createElement('span');span.textContent='FIRE';span.style.cssText='font:800 13px DM Sans,Arial;color:#2a0f1d;line-height:88px;letter-spacing:1px';el.appendChild(span);}
  return el;
 }
 show(){for(const el of [this.joy,this.look,this.fire,this.pause])el.style.display='block';}
 hide(){for(const el of [this.joy,this.look,this.fire,this.pause])el.style.display='none';this.touches.clear();this.lookX=0;this.lookY=0;}
 target(e){
  const el=document.elementFromPoint(e.clientX,e.clientY);if(!el)return null;
  if(el===this.joy||this.joy.contains(el))return 'joy';
  if(el===this.look||this.look.contains(el))return 'look';
  if(el===this.fire||this.fire.contains(el))return 'fire';
  if(el===this.pause||this.pause.contains(el))return 'pause';
  return null;
 }
 down(e){
  if(e.pointerType==='mouse')return; // desktop keeps keyboard/mouse flow
  const t=this.target(e);if(!t)return;
  e.preventDefault();e.stopPropagation();
  if(t==='pause'){this.onPause?.();return;}
  const rec={role:t,x0:e.clientX,y0:e.clientY,cur:{x:0,y:0},start:performance.now(),dodged:false};
  this.touches.set(e.pointerId,rec);
  if(t==='fire'){
   // Block only engages after a short hold, so quick taps punch cleanly.
   rec.timer=setTimeout(()=>{rec.held=true;rec.blocking=true;if(this.onBlockStart)this.onBlockStart();},FIRE_TAP_MS);
  }
 }
 move(e){
  const rec=this.touches.get(e.pointerId);if(!rec)return;e.preventDefault();
  if(rec.role==='joy'){
   const r=this.joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);
   const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
   rec.cur={x:dx,y:dy};
   this.stick.style.transform=`translate(calc(-50% + ${dx*42}px),calc(-50% + ${dy*42}px))`;
  }else if(rec.role==='look'){
   const r=this.look.getBoundingClientRect();
   const nx=Math.max(-1,Math.min(1,(e.clientX-r.left)/(r.width/2)-1));
   const ny=Math.max(-1,Math.min(1,(e.clientY-r.top)/(r.height/2)-1));
   this.lookX=nx;this.lookY=ny;
   this.pivot.style.transform=`translate(calc(-50% + ${nx*55}px),calc(-50% + ${ny*45}px))`;
  }else if(rec.role==='fire'&&!rec.dodged){
   const dx=e.clientX-rec.x0,dy=e.clientY-rec.y0,d=Math.hypot(dx,dy);
   if(d>44&&this.dodgeCooldown<=0&&this.onDodge){
    this.onDodge({x:dx/d,z:dy/d});rec.dodged=true;this.dodgeCooldown=.5;
    clearTimeout(rec.timer);rec.held=true;
    setTimeout(()=>{this.dodgeCooldown=0;},500);
   }
  }
 }
 up(e){
  const rec=this.touches.get(e.pointerId);if(!rec)return;e.preventDefault();
  this.touches.delete(e.pointerId);
  if(rec.role==='joy'){this.stick.style.transform='translate(-50%,-50%)';}
  else if(rec.role==='look'){this.lookX=0;this.lookY=0;this.pivot.style.transform='translate(-50%,-50%)';}
  else if(rec.role==='fire'){
   clearTimeout(rec.timer);
   if(rec.blocking&&this.onBlockEnd)this.onBlockEnd();
   else if(!rec.dodged&&!rec.held&&performance.now()-rec.start<FIRE_TAP_MS&&this.onPunch)this.onPunch();
  }
 }
 axes(){
  let x=0,z=0;
  for(const rec of this.touches.values())if(rec.role==='joy'){x+=rec.cur.x;z+=rec.cur.y;}
  const m=Math.hypot(x,z);if(m>1){x/=m;z/=m;}
  return{x,z};
 }
 lookDelta(){
  if(!this.lookX&&!this.lookY)return null;
  return{x:this.lookX,y:this.lookY};
 }
 dodgeBusy(){return this.dodgeCooldown>0;}
}
