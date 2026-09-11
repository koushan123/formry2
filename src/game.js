import {CONFIG as C, SCENARIOS, DIFFICULTIES} from './config.js';

export class Health {
 constructor(max){this.max=max;this.value=max;}
 damage(amount){this.value=Math.max(0,this.value-Math.max(0,amount));}
 get dead(){return this.value===0;}
}
const clamp=v=>Math.max(-C.arenaLimit,Math.min(C.arenaLimit,v));

export class CombatController {
 constructor(game){this.game=game;}
 punch(){
  const g=this.game,p=g.player;
  if(g.state!=='playing')return false;
  if(p.block){g.emit('guarding');return false;}
  // One buffered input: clicking during recovery never builds an invisible queue.
  if(p.cooldown>0||g.hitStop>0){p.buffered=true;g.emit('buffered');return false;}
  p.buffered=false;p.swingAge=0;p.swingId++;p.contactPending=true;
  p.contactAt=g.rageLeft>0?C.ragePunchContact:C.punchContact;
  p.swingDuration=g.rageLeft>0?.21:C.punchAnimation;
  p.cooldown=g.rageLeft>0?C.ragePunchCooldown:C.punchCooldown;
  g.emit('punch',{rage:g.rageLeft>0});return true;
 }
 update(dt){
  const g=this.game,p=g.player;
  p.cooldown=Math.max(0,p.cooldown-dt);p.swingAge+=dt;
  if(p.contactPending&&p.swingAge>=p.contactAt){p.contactPending=false;if(!p.block)this.resolve();}
  if(p.buffered&&p.cooldown===0&&!p.block&&g.hitStop===0)this.punch();
 }
 resolve(){
  const g=this.game,p=g.player,e=g.enemy;
  if(g.state!=='playing')return false;
  const dx=e.x-p.x,dz=e.z-p.z,dist=Math.hypot(dx,dz);
  const dot=dist?(dx*-Math.sin(p.yaw)+dz*-Math.cos(p.yaw))/dist:1;
  if(dist>C.punchRange||dot<.8||Math.abs(p.pitch)>.6){g.combo=0;g.comboLeft=0;g.emit('miss',{reason:dist>C.punchRange?'STEP CLOSER':'AIM AT STATIC'});return false;}
  g.combo++;g.hits++;g.bestCombo=Math.max(g.combo,g.bestCombo);g.comboLeft=C.comboTimeout;
  const power=g.combo%5===0,rage=g.rageLeft>0,strong=rage||power;
  const vulnerable=e.state==='STAGGER'||e.state==='RECOVER';
  const damage=Math.round(C.punchDamage*(rage?C.rageMultiplier:power?C.powerMultiplier:1)*(vulnerable?C.vulnerabilityMultiplier:1));
  e.health.damage(damage);g.score+=damage*10+g.combo*10;
  e.recoil=C.recoilDuration;e.recoilSide=p.swingId%2?1:-1;e.hitStrength=strong?1:.6;
  // Strong hits expose an opening, but cannot permanently stun-lock the opponent.
  if(power&&e.staggerLock<=0){e.state='STAGGER';e.timer=C.staggerDuration;e.staggerLock=C.staggerImmunity;g.emit('stagger');}
  if(dist>.01){const force=strong?.13:.055;e.x=clamp(e.x+dx/dist*force);e.z=clamp(e.z+dz/dist*force);}
  g.hitStop=strong?C.strongHitStop:C.hitStop;
  g.emit('hit',{strong,rage,vulnerable,damage,x:e.x-dx/Math.max(.01,dist)*.3,z:e.z-dz/Math.max(.01,dist)*.3});
  if(g.combo===3||g.combo===5||g.combo%10===0)g.emit('combo',{count:g.combo});
  if(!rage){g.release=Math.min(100,g.release+C.releasePerHit);if(g.release===100){g.rageLeft=C.rageDuration;g.rageActivations++;g.emit('rage');}}
  if(g.scenario.isComplete(g)){e.state='DEFEATED';g.state='victory';p.buffered=false;p.contactPending=false;g.hitStop=C.knockoutHitStop;g.emit('victory');}
  return true;
 }
}

export class EnemyController {
 constructor(game){this.game=game;}
 update(dt){
  const g=this.game,e=g.enemy,p=g.player,tuning=g.difficulty;
  e.recoil=Math.max(0,e.recoil-dt);e.staggerLock=Math.max(0,e.staggerLock-dt);
  const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz),nx=dx/Math.max(.001,dist),nz=dz/Math.max(.001,dist);
  if(e.state!=='ATTACK')e.yaw=Math.atan2(dx,dz);
  if(e.state==='STAGGER'||e.state==='RECOVER'){
   e.timer-=dt;if(e.timer<=0){e.state='CHASE';e.attackCooldown=tuning.interval;}
   return;
  }
  if(e.state==='ATTACK'){
   e.timer-=dt;
   if(e.timer<=0){
    const inArc=nx*Math.sin(e.attackYaw)+nz*Math.cos(e.attackYaw)>C.attackArc;
    if(dist<C.enemyRange+.25&&inArc){
     const facing=(-Math.sin(p.yaw)*-nx+-Math.cos(p.yaw)*-nz)>.35;
     if(p.dodge>0)g.emit('evade');
     else{
      const blocked=p.block&&facing;p.health.damage(tuning.damage*(blocked?C.blockMultiplier:1));
      g.emit(blocked?'block':'hurt');if(!blocked){g.combo=0;g.comboLeft=0;}
      if(p.health.dead){g.state='defeat';p.buffered=false;p.contactPending=false;g.emit('defeat');}
     }
    }else g.emit('evade');
    e.state='RECOVER';e.timer=tuning.recovery;
   }
   return;
  }
  e.state='CHASE';e.attackCooldown=Math.max(0,e.attackCooldown-dt);
  if(dist>C.combatDistance+.08){e.x=clamp(e.x+nx*tuning.speed*dt);e.z=clamp(e.z+nz*tuning.speed*dt);}
  else if(dist<C.combatDistance-.15){e.x=clamp(e.x-nx*tuning.speed*.7*dt);e.z=clamp(e.z-nz*tuning.speed*.7*dt);}
  else{e.x=clamp(e.x+nz*C.strafeSpeed*e.strafeSide*dt);e.z=clamp(e.z-nz*C.strafeSpeed*e.strafeSide*dt);}
  if(dist<=C.enemyRange&&e.attackCooldown===0){e.state='ATTACK';e.timer=tuning.windup;e.attackYaw=e.yaw;e.strafeSide*=-1;g.emit('windup');}
 }
}

export class Game {
 constructor(onEvent=()=>{}){this.onEvent=onEvent;this.combat=new CombatController(this);this.ai=new EnemyController(this);this.reset();this.state='menu';}
 emit(type,data={}){this.onEvent(type,data);}
 reset(scenario=SCENARIOS[0],difficulty='normal'){
  this.scenario=scenario;this.difficultyId=DIFFICULTIES[difficulty]?difficulty:'normal';this.difficulty=DIFFICULTIES[this.difficultyId];this.state='playing';
  this.player={x:0,z:3.4,yaw:0,pitch:0,health:new Health(C.playerHealth),cooldown:0,block:false,dodge:0,dodgeCooldown:0,dodgeX:0,dodgeZ:0,buffered:false,contactPending:false,swingAge:1,swingDuration:C.punchAnimation,contactAt:C.punchContact,swingId:0};
  this.enemy={x:0,z:0,health:new Health(Math.round(scenario.opponent.health*this.difficulty.health)),state:'IDLE',timer:0,yaw:0,attackYaw:0,attackCooldown:.6,recoil:0,recoilSide:1,hitStrength:0,staggerLock:0,strafeSide:1};
  this.combo=0;this.bestCombo=0;this.hits=0;this.score=0;this.elapsed=0;this.release=0;this.rageLeft=0;this.comboLeft=0;this.hitStop=0;this.visualTime=0;this.rageActivations=0;
 }
 dodge(x=0,z=1){
  const p=this.player;if(this.state!=='playing'||p.dodgeCooldown>0)return false;
  const len=Math.hypot(x,z)||1;p.dodgeX=x/len;p.dodgeZ=z/len;p.dodge=C.dodgeDuration;p.dodgeCooldown=C.dodgeCooldown;this.emit('dodge');return true;
 }
 update(dt,input={x:0,z:0}){
  if(this.state!=='playing')return;
  this.elapsed+=dt;
  if(this.hitStop>0){const frozen=Math.min(dt,this.hitStop);this.hitStop-=frozen;dt-=frozen;if(dt<=0)return;}
  this.visualTime+=dt;
  const p=this.player;p.dodgeCooldown=Math.max(0,p.dodgeCooldown-dt);
  this.comboLeft=Math.max(0,this.comboLeft-dt);if(this.comboLeft===0)this.combo=0;
  if(this.rageLeft>0){this.rageLeft=Math.max(0,this.rageLeft-dt);if(this.rageLeft===0){this.release=0;this.emit('calm');}}
  let x=input.x||0,z=input.z||0;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
  let speed=C.moveSpeed*(p.block?.52:1);
  if(p.dodge>0){x=p.dodgeX;z=p.dodgeZ;speed=C.dodgeSpeed;}
  p.x=clamp(p.x+(x*Math.cos(p.yaw)+z*Math.sin(p.yaw))*speed*dt);
  p.z=clamp(p.z+(-x*Math.sin(p.yaw)+z*Math.cos(p.yaw))*speed*dt);
  this.combat.update(dt);
  if(this.state==='playing'&&this.hitStop===0)this.ai.update(dt);
  const dx=p.x-this.enemy.x,dz=p.z-this.enemy.z,d=Math.hypot(dx,dz);
  if(d<C.bodyRadius*2){const nx=d>.001?dx/d:Math.sin(p.yaw),nz=d>.001?dz/d:Math.cos(p.yaw);p.x=clamp(this.enemy.x+nx*C.bodyRadius*2);p.z=clamp(this.enemy.z+nz*C.bodyRadius*2);}
  p.dodge=Math.max(0,p.dodge-dt);
 }
}
