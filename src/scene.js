import * as THREE from 'three';
import {CONFIG as C} from './config.js';
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
export class ArenaView {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#1A1018');this.scene.fog=new THREE.FogExp2('#1A1018',.042);
  this.camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.07,70);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.scene.add(new THREE.HemisphereLight('#B7849C','#241019',1.7));
  const key=new THREE.SpotLight('#FFD9E6',170,32,1, .6,1.4);key.position.set(2,9,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0002;key.shadow.normalBias=.025;key.target.position.set(0,0,0);this.scene.add(key,key.target);
  const rim=new THREE.PointLight('#FF8FB1',45,16,1.5);rim.position.set(-5,4,-3);this.scene.add(rim);this.rimLight=rim;
  const fill=new THREE.PointLight('#B7849C',40,18,1.5);fill.position.set(6,5,-6);this.scene.add(fill);
  this.materials={floor:mat('#241420'),wall:mat('#1E0F1A'),steel:mat('#2A1622',.4,.6),cream:mat('#E8A8BC'),orange:mat('#B0527A'),green:mat('#D46A8C'),dark:mat('#120A10')};
  this.neon=(x,y,z,w,h,text='#FF8FB1')=>{const glow=new THREE.PointLight(text,14,10,1.6);glow.position.set(x,y,z+ .6);this.scene.add(glow);};
  this.unitBox=new THREE.BoxGeometry(1,1,1);this.unitSphere=new THREE.SphereGeometry(1,16,12);this.cylinders=new Map();
  this.buildRoom();this.enemy=this.buildRobot();this.scene.add(this.enemy);this.buildHands();
  this.particles=[];const geometry=new THREE.BoxGeometry(.055,.055,.055),pm=new THREE.MeshBasicMaterial({color:'#FF8FB1'});for(let i=0;i<48;i++){const mesh=new THREE.Mesh(geometry,pm);mesh.visible=false;this.scene.add(mesh);this.particles.push({mesh,v:new THREE.Vector3(),life:0});}
  this.shake=0;this.punchTime=0;this.handIndex=0;this.defeat=0;this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};window.addEventListener('resize',this.resize);this.resize();
 }
 box(w,h,d,m,x=0,y=0,z=0,parent=this.scene){const mesh=new THREE.Mesh(this.unitBox,m);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 cylinder(r1,r2,h,m,x,y,z,parent=this.scene){const ratio=r1/r2;if(!this.cylinders.has(ratio))this.cylinders.set(ratio,new THREE.CylinderGeometry(ratio,1,1,12));const mesh=new THREE.Mesh(this.cylinders.get(ratio),m);mesh.scale.set(r2,h,r2);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
 ball(x,y,z,sx,sy,sz,m,parent){const mesh=new THREE.Mesh(this.unitSphere,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;}
 label(text,w,h,size=90,color='#d8dfb4',bg=null){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${size}px Arial`;ctx.fillText(text,512,128);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));return mesh;}
 buildRoom(){
  const m=this.materials;
  this.box(32,.25,30,m.floor,0,-.38,0);this.box(30,10,.3,m.wall,0,4.5,-10);this.box(.3,10,30,m.wall,-12,4.5,0);this.box(.3,10,30,m.wall,12,4.5,0);
  for(let x=-12;x<=12;x+=4){this.box(.2,9,.4,m.steel,x,4,-9.7);this.box(.15,.17,24,m.steel,x,8,0);}
  for(let y=0;y<6;y+=.65)this.box(24,.02,.02,m.steel,0,y,-9.8);
  for(const x of [-7,0,7]){this.box(3,.12,.4,new THREE.MeshStandardMaterial({color:'#E8A8BC',emissive:'#D46A8C',emissiveIntensity:2.2}),x,7,-2);this.box(.03,1,.03,m.steel,x,7.6,-2);}
  this.box(12.4,.5,12.4,m.dark,0,-.12,0);this.box(11.8,.08,11.8,mat('#4A2638',.25,.8),0,.16,0);
  // Canvas markings sit just above the mat; all graphics are generated locally.
  const mark=this.label('LET IT OUT.',7,1.75,100,'#D46A8C');mark.rotation.x=-Math.PI/2;mark.position.set(0,.208,1);this.scene.add(mark);
  const sub=this.label('ANGER RELEASE  /  THE VELVET RING',6,1,40,'#B7849C');sub.rotation.x=-Math.PI/2;sub.position.set(0,.21,2.1);this.scene.add(sub);
  const border=mat('#B7849C');for(const x of [-5.4,5.4])this.box(.035,.008,10.8,border,x,.208,0);for(const z of [-5.4,5.4])this.box(10.8,.008,.035,border,0,.208,z);
  for(const x of [-5.9,5.9])for(const z of [-5.9,5.9]){this.cylinder(.12,.16,2.8,m.steel,x,1.4,z);this.box(.35,1.6,.35,x*z>0?m.orange:m.green,x,1.65,z);this.cylinder(.18,.18,.08,m.cream,x,2.85,z);}
  for(let y=.85;y<=2.5;y+=.55){
   for(const z of [-5.9,5.9]){const rope=this.cylinder(.037,.037,11.8,y>2?m.cream:m.dark,0,y,z);rope.rotation.z=Math.PI/2;}
   for(const x of [-5.9,5.9]){const rope=this.cylinder(.037,.037,11.8,y>2?m.cream:m.dark,x,y,0);rope.rotation.x=Math.PI/2;}
  }
  const wallTitle=this.label('RELEASE YOUR ANGER',13,3,95,'#FF8FB1');wallTitle.position.set(0,5.2,-9.8);this.scene.add(wallTitle);this.neon(0,5.2,-9);
  const wallSub=this.label('THE VELVET RING  /  EST. 2026',9,1,42,'#B7849C');wallSub.position.set(0,3.8,-9.78);this.scene.add(wallSub);
  for(const x of [-9,9]){this.cylinder(.025,.025,2,m.steel,x,5,-6);this.cylinder(.55,.55,2.2,m.dark,x,2.9,-6);this.cylinder(.56,.56,.25,m.orange,x,2.6,-6);this.box(2.5,.2,.8,m.steel,x,.7,-8);for(const dx of [-.9,.9])this.box(.12,.7,.5,m.steel,x+dx,.3,-8);}
  for(let i=0;i<3;i++)this.box(2,.18,.5,m.steel,7,.1+i*.18,4+i*.5);
 }
 buildRobot(){
  const root=new THREE.Group(),m=this.materials;this.robotBody=new THREE.Group();root.add(this.robotBody);const b=this.robotBody;
  this.robotMaterial=m.dark.clone();this.robotMaterial.metalness=.5;this.robotMaterial.roughness=.45;this.robotMaterial.emissive.set('#4A2638');
  this.box(.8,.8,.48,this.robotMaterial,0,1.65,0,b);this.box(.62,.16,.52,m.dark,0,1.25,0,b);this.box(.66,.4,.46,m.dark,0,.97,0,b);this.box(.18,.25,.5,m.cream,0,1.57,.015,b);
  this.cylinder(.14,.14,.2,m.steel,0,2.15,0,b);this.robotHead=new THREE.Group();this.robotHead.position.y=2.2;b.add(this.robotHead);
  this.box(.63,.65,.55,this.robotMaterial,0,.32,0,this.robotHead);
  // The enemy wears the player's own face: a symbolic representation of frustration.
  const faceTexture=new THREE.TextureLoader().load('/player-portrait-alt.jpg');
  faceTexture.colorSpace=THREE.SRGBColorSpace;faceTexture.center.set(.5,.42);faceTexture.repeat.set(.82,.66);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.62,.66),new THREE.MeshBasicMaterial({map:faceTexture,toneMapped:false}));
  face.position.set(0,.33,.279);this.robotHead.add(face);
  this.eyeMaterial=new THREE.MeshStandardMaterial({color:'#FFD9E6',emissive:'#FF8FB1',emissiveIntensity:1.6});
  for(const side of [-1,1]){
   this.cylinder(.12,.14,.52,m.steel,side*.24,.6,0,b);this.box(.32,.38,.35,m.orange,side*.25,.57,0,b);this.box(.38,.18,.58,m.dark,side*.25,.29,.11,b);
   this.ball(side*.53,1.91,0,.23,.25,.25,m.steel,b);
   const arm=new THREE.Group();arm.position.set(side*.54,1.88,0);b.add(arm);this.cylinder(.13,.16,.46,m.orange,side*.1,-.22,.02,arm);this.cylinder(.14,.14,.38,m.steel,side*.12,-.27,.22,arm).rotation.x=1;
   this.ball(side*.13,-.03,.44,.29,.33,.32,m.green,arm);this.box(.34,.13,.36,m.dark,side*.13,-.27,.4,arm);if(side<0)this.leftArm=arm;else this.rightArm=arm;
  }
  const badge=this.label('STATIC',.57,.18,90,'#e9dda5');badge.position.set(0,1.88,.246);b.add(badge);return root;
 }
 buildHands(){this.hands=[];for(const side of [-1,1]){const group=new THREE.Group();this.camera.add(group);this.ball(0,0,0,.2,.23,.29,this.materials.dark,group);this.ball(side*-.12,-.07,-.05,.1,.14,.16,this.materials.dark,group);this.box(.26,.15,.22,this.materials.cream,0,-.2,.09,group);this.cylinder(.1,.12,.44,this.materials.dark,0,-.38,.2,group).rotation.x=-.35;group.userData.side=side;this.hands.push(group);}}
 impact(data){this.shake=data.strong?.085:.035;this.cameraKick=data.strong?.045:.018;let count=data.strong?24:12;for(const p of this.particles){if(p.life>0)continue;p.mesh.position.set(data.x,2.25+Math.random()*.2,data.z);p.v.set((Math.random()-.5)*5,1+Math.random()*3,(Math.random()-.5)*5);p.life=.3+Math.random()*.3;p.mesh.visible=true;if(--count===0)break;}}
 punch(){this.handIndex=1-this.handIndex;}
 reset(){this.defeat=0;this.shake=0;this.cameraKick=0;this.punchTime=0;this.handIndex=0;this.camera.fov=68;this.camera.updateProjectionMatrix();for(const p of this.particles){p.life=0;p.mesh.visible=false;}}
 render(game,dt,menu,time,reducedMotion=false){
  const e=game.enemy,p=game.player;
  if(!menu)time=game.visualTime;
  if(game.hitStop>0&&game.state==='playing')dt=0;
  this.enemy.position.set(e.x,.03,e.z);this.enemy.rotation.y=e.yaw;
  if(game.state==='victory')this.defeat=Math.min(1,this.defeat+dt*1.2);
  const recoil=e.recoil/C.recoilDuration,stagger=e.state==='STAGGER';
  this.robotBody.rotation.z=this.defeat*-1.4+recoil*e.recoilSide*.06+(stagger?Math.sin(time*15)*.045:0);
  this.robotBody.position.y=-this.defeat*.55+(menu?Math.sin(time*2)*.025:0);
  this.robotBody.rotation.x=-recoil*.15*e.hitStrength;
  this.robotHead.rotation.x=-recoil*.3*e.hitStrength;
  this.robotHead.rotation.z=recoil*e.recoilSide*.16;
  this.robotMaterial.emissiveIntensity=.25+recoil*.9+(stagger?.5:0);
  const attack=e.state==='ATTACK',progress=attack?1-e.timer/game.difficulty.windup:0;
  this.eyeMaterial.emissive.set(attack?'#ff2d6b':stagger?'#ffffff':'#FF8FB1');
  this.eyeMaterial.color.set(attack?'#ff5f92':'#FFD9E6');
  const strike=attack?Math.max(0,(progress-.68)/.32):e.state==='RECOVER'?Math.pow(e.timer/game.difficulty.recovery,9):0;
  this.leftArm.rotation.x=stagger?.45:Math.sin(time*3)*.04;
  this.rightArm.rotation.x=-strike*1.25+(attack?.3*(1-strike):0);
  this.rightArm.position.z=strike*.28;
  if(menu){this.camera.position.set(9,5.3,11);this.camera.lookAt(-1.9,1.2,0);this.enemy.rotation.y=.4;}
  else{
   this.camera.position.set(p.x,2.15-(p.dodge>0&&!reducedMotion?.17:0),p.z);
   this.camera.rotation.set(p.pitch+(reducedMotion?0:this.cameraKick||0),p.yaw,0);
   if(!reducedMotion){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;this.camera.rotation.z=p.dodge>0?-.045*p.dodgeX:0;}
  }
  const targetFov=game.rageLeft>0&&!menu&&!reducedMotion?72:68;
  this.rimLight.intensity=game.rageLeft>0&&!menu?45+Math.sin(time*18)*12:45;
  if(Math.abs(this.camera.fov-targetFov)>.01){this.camera.fov+=(targetFov-this.camera.fov)*Math.min(1,dt*6);this.camera.updateProjectionMatrix();}
  this.shake=Math.max(0,this.shake-dt*.5);this.cameraKick=Math.max(0,(this.cameraKick||0)-dt*.2);
  for(let i=0;i<2;i++){
   const hand=this.hands[i],s=hand.userData.side;hand.visible=!menu;
   const age=p.swingAge,contact=p.contactAt;
   // Fast extension, a brief contact plateau, then a slower recovery.
   const extension=age<contact?1-Math.pow(1-age/contact,2):Math.max(0,1-(age-contact)/Math.max(.01,p.swingDuration-contact));
   const punch=i===this.handIndex?extension:0;
   hand.position.set(s*(p.block?.24:.42)-s*punch*.24,p.block?-.14:-.44+Math.sin(time*4+i)*.012+punch*.16,-.7-punch*.58);
   hand.rotation.x=-punch*.35;hand.rotation.z=-s*(p.block?.3:.12+punch*.18);
  }
  for(const part of this.particles)if(part.life>0){part.life-=dt;part.mesh.visible=part.life>0;part.v.y-=dt*8;part.mesh.position.addScaledVector(part.v,dt);part.mesh.rotation.x+=dt*8;part.mesh.scale.setScalar(Math.max(.1,part.life*2));}
  this.renderer.render(this.scene,this.camera);
 }
}
