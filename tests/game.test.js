import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,Health} from '../src/game.js';
import {CONFIG as C,ScenarioManager,SCENARIOS,DIFFICULTIES} from '../src/config.js';
import {normalizeSettings} from '../src/settings.js';
const step=(g,t,input)=>{for(let i=0;i<Math.ceil(t/.01);i++)g.update(.01,input);};
const ready=()=>{const g=new Game();g.reset();g.player.z=2;g.enemy.attackCooldown=999;return g;};
// Resolve a scheduled contact without advancing unrelated AI in isolated combat checks.
const strike=g=>{g.player.cooldown=0;g.hitStop=0;g.combat.punch();g.combat.update(C.punchContact+.001);};

test('health clamps at zero and ignores negative damage',()=>{const h=new Health(100);h.damage(-2);assert.equal(h.value,100);h.damage(200);assert.ok(h.dead);});
test('punch checks distance, aim, pitch and cooldown',()=>{
 const g=ready(),max=g.enemy.health.max;g.player.z=4;strike(g);assert.equal(g.enemy.health.value,max);
 g.player.z=2;g.player.yaw=Math.PI;strike(g);assert.equal(g.enemy.health.value,max);
 g.player.yaw=0;g.player.pitch=1;strike(g);assert.equal(g.enemy.health.value,max);
 g.player.pitch=0;strike(g);assert.equal(g.enemy.health.value,max-C.punchDamage);
 assert.equal(g.combat.punch(),false);assert.equal(g.enemy.health.value,max-C.punchDamage);
});
test('combos reset on miss and timeout, fifth hit staggers',()=>{
 const g=ready();for(let i=0;i<5;i++){g.enemy.z=0;strike(g);}
 assert.equal(g.combo,5);assert.equal(g.enemy.state,'STAGGER');assert.equal(g.enemy.health.value,g.enemy.health.max-55);
 step(g,C.comboTimeout+1);assert.equal(g.combo,0);g.player.yaw=Math.PI;strike(g);assert.equal(g.combo,0);
});
test('release triggers at its threshold, boosts damage, then resets',()=>{
 const g=ready();for(let i=0;i<100/C.releasePerHit;i++){g.enemy.z=0;strike(g);}
 assert.equal(g.release,100);assert.equal(g.rageLeft,C.rageDuration);
 g.enemy.state='CHASE';const health=g.enemy.health.value;g.enemy.z=0;strike(g);
 assert.equal(health-g.enemy.health.value,Math.round(C.punchDamage*C.rageMultiplier));
 step(g,C.rageDuration+1);assert.equal(g.release,0);assert.equal(g.rageLeft,0);
});
test('AI approaches, telegraphs, attacks, recovers and defeats idle player',()=>{
 const g=new Game();g.reset();step(g,.1);assert.equal(g.enemy.state,'CHASE');assert.ok(g.enemy.z>0);
 step(g,120);assert.equal(g.state,'defeat');assert.ok(g.player.health.dead);
});
test('block reduces frontal damage; dodging avoids attacks',()=>{
 const g=ready();g.player.block=true;g.enemy.state='ATTACK';g.enemy.timer=.1;step(g,.11);
 assert.equal(g.player.health.value,100-g.difficulty.damage*C.blockMultiplier);assert.equal(g.combat.punch(),false);
 g.player.block=false;g.enemy.state='ATTACK';g.enemy.timer=.05;const health=g.player.health.value;
 g.dodge(1,0);step(g,.06);assert.equal(g.player.health.value,health);assert.ok(g.player.x>0);
});
test('walls clamp movement and opponent bodies cannot overlap',()=>{
 const g=ready();g.enemy.x=-5;g.enemy.z=-5;step(g,5,{x:1,z:1});assert.ok(g.player.x<=C.arenaLimit);assert.ok(g.player.z<=C.arenaLimit);
 g.player.x=g.enemy.x+.01;g.player.z=g.enemy.z;g.update(.001);assert.ok(Math.hypot(g.player.x-g.enemy.x,g.player.z-g.enemy.z)>1.3);
});
test('victory stops combat and reset clears the complete round state',()=>{
 const g=ready();for(let i=0;i<500&&g.state==='playing';i++){g.enemy.z=0;strike(g);}
 assert.equal(g.state,'victory');assert.equal(g.enemy.state,'DEFEATED');const health=g.player.health.value;
 step(g,30);assert.equal(g.player.health.value,health);assert.equal(g.combat.punch(),false);g.reset();
 assert.equal(g.hits,0);assert.equal(g.score,0);assert.equal(g.release,0);assert.equal(g.player.health.value,100);assert.equal(g.enemy.health.value,SCENARIOS[0].opponent.health);
 assert.equal(g.hitStop,0);assert.equal(g.player.buffered,false);assert.equal(g.player.contactPending,false);
});
test('pause freezes movement, damage and round timer',()=>{
 const g=ready();g.combat.punch();g.state='paused';step(g,20,{x:1,z:1});assert.equal(g.elapsed,0);assert.equal(g.player.x,0);assert.equal(g.player.health.value,100);assert.equal(g.hits,0);
});
test('scenario manager selects descriptors and rejects missing scenarios',()=>{const s=new ScenarioManager();assert.equal(s.select('boxing').opponent.health,SCENARIOS[0].opponent.health);assert.throws(()=>s.select('missing'));});

test('damage occurs at contact, only once, and uses current aim',()=>{
 const g=ready();g.combat.punch();assert.equal(g.hits,0);g.update(C.punchContact/2);assert.equal(g.hits,0);g.player.yaw=Math.PI;g.update(C.punchContact);assert.equal(g.hits,0);
 g.player.yaw=0;step(g,.5);g.combat.punch();step(g,.1);assert.equal(g.hits,1);step(g,.2);assert.equal(g.hits,1);
});
test('rapid clicks buffer one punch and do not create an unlimited queue',()=>{
 const g=ready();g.combat.punch();for(let i=0;i<20;i++)g.combat.punch();assert.equal(g.player.buffered,true);
 step(g,1);assert.equal(g.hits,2);assert.equal(g.player.buffered,false);
});
test('hit-stop freezes AI, movement and animation while the real round timer advances',()=>{
 const g=ready();strike(g);const x=g.player.x,age=g.player.swingAge,time=g.elapsed;g.update(.01,{x:1,z:0});
 assert.equal(g.player.x,x);assert.equal(g.player.swingAge,age);assert.equal(g.elapsed,time+.01);assert.ok(g.hitStop>0);
});
test('openings increase damage; stagger lock prevents repeated interruption',()=>{
 const g=ready();g.enemy.state='RECOVER';strike(g);assert.equal(g.enemy.health.max-g.enemy.health.value,Math.round(C.punchDamage*C.vulnerabilityMultiplier));
 g.combo=4;g.enemy.staggerLock=1;g.enemy.state='ATTACK';g.enemy.timer=.5;strike(g);assert.equal(g.enemy.state,'ATTACK');
 g.combo=9;g.enemy.staggerLock=0;strike(g);assert.equal(g.enemy.state,'STAGGER');
});
test('rage accelerates punch cadence and impact timing',()=>{
 const g=ready();g.rageLeft=6;g.combat.punch();assert.equal(g.player.cooldown,C.ragePunchCooldown);assert.equal(g.player.contactAt,C.ragePunchContact);
});
test('enemy commits to its attack direction; stepping out of the arc avoids damage',()=>{
 const g=ready();g.enemy.state='ATTACK';g.enemy.timer=.02;g.enemy.attackYaw=0;g.player.x=2;g.player.z=0;step(g,.03);assert.equal(g.player.health.value,100);assert.equal(g.enemy.state,'RECOVER');
});
test('difficulty changes only the intended opponent properties and survives explicit retry selection',()=>{
 const g=ready();g.reset(SCENARIOS[0],'easy');assert.ok(g.difficulty.damage<DIFFICULTIES.normal.damage);assert.ok(g.difficulty.windup>DIFFICULTIES.normal.windup);assert.equal(g.enemy.health.max,SCENARIOS[0].opponent.health);
 g.reset(SCENARIOS[0],'hard');assert.ok(g.enemy.health.max>SCENARIOS[0].opponent.health);assert.ok(g.difficulty.speed>DIFFICULTIES.normal.speed);assert.ok(g.difficulty.windup<DIFFICULTIES.normal.windup);
 g.reset(SCENARIOS[0],'invalid');assert.equal(g.difficultyId,'normal');
});
test('dodge cooldown prevents repeated invulnerability and rear attacks bypass block',()=>{
 const g=ready();assert.equal(g.dodge(),true);assert.equal(g.dodge(),false);step(g,C.dodgeCooldown+.1);assert.equal(g.dodge(),true);
 g.player.dodge=0;g.player.z=2;g.player.yaw=Math.PI;g.player.block=true;g.enemy.state='ATTACK';g.enemy.timer=.01;step(g,.02);assert.equal(g.player.health.value,100-g.difficulty.damage);
});
test('settings reject malformed values and preserve valid difficulty',()=>{
 assert.equal(normalizeSettings(null).difficulty,'normal');assert.equal(normalizeSettings({difficulty:'hard',volume:90,sensitivity:Infinity}).difficulty,'hard');assert.equal(normalizeSettings({volume:90}).volume,1);assert.equal(normalizeSettings({difficulty:'unknown'}).difficulty,'normal');
});

test('normal balance stays within the target durations for declared synthetic playstyles',async()=>{
 const {simulatePlaystyle}=await import('../scripts/balance.js');
 for(let seed=1;seed<=20;seed++)for(const style of ['experienced','new']){
  const result=simulatePlaystyle(style,seed,'normal');assert.equal(result.outcome,'victory');
  const [min,max]=style==='experienced'?[60,120]:[120,240];
  assert.ok(result.seconds>=min&&result.seconds<=max,`${style} seed ${seed}: ${result.seconds}s`);
 }
});
