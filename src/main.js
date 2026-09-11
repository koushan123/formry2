import './style.css';
import {Game} from './game.js';
import {ArenaView} from './scene.js';
import {AudioManager} from './audio.js';
import {InputManager} from './input.js';
import {ScenarioManager,DIFFICULTIES} from './config.js';
import {UIManager,formatTime} from './ui.js';
import {loadSettings,saveSettings} from './settings.js'; const $=id=>document.getElementById(id),audio=new AudioManager(),scenarios=new ScenarioManager(),ui=new UIManager();
const settings=loadSettings();audio.volume=settings.volume;
let view,endDelay=0;
const game=new Game((type,data)=>{
 audio.play(type==='hit'?(data.strong?'strong':'hit'):type);
 ui.event(type,data,game);
 if(type==='punch')view.punch();
 if(type==='hit')view.impact(data);
 if(type==='hurt'){view.shake=.055;view.cameraKick=.025;}
 if(type==='victory'||type==='defeat'){
  input.clear();endDelay=type==='victory'?1.65:.7;document.exitPointerLock?.();
  if(input.touch)input.touch.hide();
 }
});
try{view=new ArenaView($('world'));}catch(error){
 $('modal').hidden=false;$('dialog').innerHTML='<h2>3D UNAVAILABLE</h2><p>This game needs WebGL. Enable hardware acceleration or use a desktop browser with WebGL support.</p>';throw error;
}
const input=new InputManager($('world'),game,{onPause:pause,onAttack:()=>game.combat.punch(),onDodge:axes=>game.dodge(axes.x,axes.z||(!axes.x?1:0)),sensitivity:()=>settings.sensitivity});
function toast(text){$('toast').textContent=text;$('toast').style.opacity=1;setTimeout(()=>$('toast').style.opacity=0,3500);}
function modal(html){$('dialog').innerHTML=html;$('modal').hidden=false;requestAnimationFrame(()=>$('dialog').querySelector('button,input,select')?.focus());}
function applySettings(){
 audio.volume=settings.volume;document.body.classList.toggle('reduced-motion',settings.reducedMotion);
 const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
 if(touch)$('control-strip').innerHTML='<span><kbd>STICK</kbd> MOVE</span><span><kbd>PAD</kbd> LOOK</span><span><kbd>FIRE</kbd> PUNCH/BLOCK</span><span><kbd>FIRE SWIPE</kbd> DODGE</span><span><kbd>PAUSE</kbd> PAUSE</span>';
 document.body.classList.remove('theme-mauve','theme-dark');if(settings.theme==='mauve')document.body.classList.add('theme-mauve');if(settings.theme==='dark')document.body.classList.add('theme-dark');
 $('menu-difficulty').textContent=DIFFICULTIES[settings.difficulty].label.toUpperCase();saveSettings(settings);
}
function showMenu(){
 game.state='menu';input.clear();audio.stop();document.exitPointerLock?.();view.reset();ui.reset();endDelay=0;
 if(input.touch)input.touch.hide();
 $('modal').hidden=true;$('hud').hidden=true;
 for(const id of ['menu','preview-card','menu-footer'])$(id).hidden=false;
 document.body.classList.remove('playing','rage','low-health');
}
function tutorial(next){
 const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
 modal(touch
  ?'<div class="eyebrow">TEN SECONDS IN YOUR CORNER</div><h2>GLOVES UP.</h2><p>Defeat Static. Release the pressure.</p><div class="tutorial-controls"><span><kbd>LEFT STICK</kbd> Move</span><span><kbd>RIGHT PAD</kbd> Look</span><span><kbd>FIRE tap</kbd> Punch</span><span><kbd>FIRE hold</kbd> Block</span><span><kbd>FIRE swipe</kbd> Dodge</span><span><kbd>PAUSE</kbd> Pause</span></div><p><b>Static about to strike?</b> Block or dodge.<br><b>Staggered?</b> Punch fast for extra damage.<br>Land hits to enter faster, stronger release mode.</p><button class="primary" id="tutorial-go">LET’S GO <span>↗</span></button><button class="secondary" id="tutorial-skip">SKIP / I KNOW THE CONTROLS</button>'
  :'<div class="eyebrow">TEN SECONDS IN YOUR CORNER</div><h2>GLOVES UP.</h2><p>Defeat Static. Release the pressure.</p><div class="tutorial-controls"><span><kbd>WASD</kbd> Move</span><span><kbd>MOUSE</kbd> Look</span><span><kbd>LMB</kbd> Punch</span><span><kbd>RMB</kbd> Hold to block</span><span><kbd>SHIFT</kbd> Dodge</span><span><kbd>ESC</kbd> Pause</span></div><p><b>Orange warning?</b> Block or dodge.<br><b>Green opening?</b> Punch for extra impact.<br>Land hits to enter faster, stronger release mode.</p><button class="primary" id="tutorial-go">LET’S GO <span>↗</span></button><button class="secondary" id="tutorial-skip">SKIP / I KNOW THE CONTROLS</button>');
 const proceed=()=>{settings.tutorialSeen=true;saveSettings(settings);next();};
 $('tutorial-go').onclick=proceed;$('tutorial-skip').onclick=proceed;
}
function start(){
 if(!settings.tutorialSeen){game.state='tutorial';tutorial(beginRound);return;}
 beginRound();
}
 async function beginRound(){
 audio.unlock();audio.stop();game.reset(scenarios.current,settings.difficulty);view.reset();ui.reset();input.clear();endDelay=0;
 if(input.touch)input.touch.show();
 for(const id of ['menu','preview-card','menu-footer'])$(id).hidden=true;
 $('modal').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');ui.callout('BREATHE IN. GLOVES UP.',1.5,1);
 $('hud').classList.add('reset');ui.update(game,0);$('hud').getBoundingClientRect();requestAnimationFrame(()=>$('hud').classList.remove('reset'));
 try{await input.capture();}catch{pause();toast('Mouse capture was unavailable. Click RESUME to try again.');}
}
function pause(){
 if(game.state!=='playing')return;
 game.state='paused';input.clear();audio.stop();document.exitPointerLock?.();
 // Pads stay visible on touch so RESUME can bring you straight back in.
 if(input.touch)input.touch.show();
 modal('<div class="eyebrow">TAKE A BREATHER</div><h2>IN YOUR CORNER.</h2><p>Block the orange warning. Punch the green opening.</p><button class="primary" id="resume">RESUME <span>↗</span></button><button class="secondary" id="pause-settings">SETTINGS</button><button class="secondary" id="howto">CONTROLS</button><button class="secondary" id="restart">RESTART ROUND</button><button class="secondary" id="home">MAIN MENU</button>');
 $('resume').onclick=resume;$('restart').onclick=start;$('home').onclick=showMenu;
 $('pause-settings').onclick=()=>showSettings(true);$('howto').onclick=()=>tutorial(resume);
}
async function resume(){
 audio.unlock();
 if(input.touch){input.touch.show();game.state='playing';$('modal').hidden=true;return;}
 try{await input.capture();game.state='playing';$('modal').hidden=true;}catch{toast('Click RESUME to allow mouse capture.');}
}
function showSettings(fromPause=false){
 modal(`<div class="eyebrow">MAKE IT YOURS</div><h2>SETTINGS</h2><label>Difficulty<select id="difficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${settings.difficulty===id?'selected':''}>${d.label}</option>`).join('')}</select></label><p class="setting-note">${fromPause?'Difficulty changes apply when you restart.':'Easy: gentler attacks. Hard: faster, tougher Static.'}</p><label>Sound volume<input id="volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><label>Mouse sensitivity<input id="sensitivity" type="range" min="0.0005" max="0.005" step="0.0001" value="${settings.sensitivity}"></label><label>Reduced camera motion<input id="motion" type="checkbox" ${settings.reducedMotion?'checked':''}></label><label>Theme<select id="theme">${[['rose','Rose Pink'],['mauve','Muted Mauve'],['dark','Dark Mode']].map(([id,label])=>`<option value="${id}" ${settings.theme===id?'selected':''}>${label}</option>`).join('')}</select></label><button class="primary" id="back">DONE <span>↗</span></button>`);
 const save=()=>{settings.volume=Number($('volume').value);settings.sensitivity=Number($('sensitivity').value);settings.reducedMotion=$('motion').checked;settings.difficulty=$('difficulty').value;settings.theme=$('theme').value;applySettings();};
 for(const id of ['volume','sensitivity','motion','difficulty','theme'])$(id).oninput=save;
 $('back').onclick=()=>{if(fromPause){game.state='playing';pause();}else $('modal').hidden=true;};
}
function results(){
 const won=game.state==='victory';
 modal(`<div class="eyebrow">ROUND COMPLETE / ${won?'ANGER RELEASED':'ANOTHER SHOT'} / ${game.difficulty.label.toUpperCase()}</div><h2>${won?'ANGER RELEASED.':'SHAKE IT OFF.'}</h2><p>${won?`You won, ${'KUSEAN'}. Static is down. Take a breath — you earned it.`:'You lost this round. Block the warning, punch the opening. You’ve got another shot.'}</p><div class="stats"><div><b>${game.bestCombo}</b><span>COMBO</span></div><div><b>${game.hits}</b><span>HITS LANDED</span></div><div><b>${formatTime(game.elapsed)}</b><span>ROUND TIME</span></div></div><p>SCORE <strong>${game.score.toLocaleString()}</strong> · ${game.rageActivations} RELEASES</p><button class="primary" id="again">${won?'PLAY AGAIN':'RETRY'} <span>↗</span></button>${won?'<button class="secondary" disabled>NEXT SCENARIO / COMING SOON</button>':''}<button class="secondary" id="home">MAIN MENU</button>`);
 $('again').onclick=start;$('home').onclick=showMenu;
}
$('start').onclick=start;$('settings').onclick=()=>showSettings();
$('brand').onclick=e=>{e.preventDefault();if(game.state==='playing')pause();};
$('scenarios').onclick=()=>{
 modal('<div class="eyebrow">CHOOSE YOUR RELEASE</div><h2>SCENARIOS</h2><div class="scenario-item"><b>01 / THE BOXING ROOM</b><small>READY · Defeat Static · 1–4 minute round</small><button class="primary" id="boxing">ENTER THE RING <span>↗</span></button></div><div class="scenario-item"><b>02 / COMING SOON</b><small>LOCKED · More ways to leave it all behind.</small></div><button class="secondary" id="back">BACK</button>');
 $('boxing').onclick=()=>{scenarios.select('boxing');start();};$('back').onclick=()=>$('modal').hidden=true;
};
$('quit').onclick=()=>modal('<div class="eyebrow">UNTIL NEXT ROUND</div><h2>TAKE IT EASY.</h2><p>You can close this browser tab to quit, or stay for another round.</p><button class="primary" id="stay">BACK TO THE CLUB <span>↗</span></button>');
$('dialog').addEventListener('click',e=>{if(e.target.closest('#stay'))$('modal').hidden=true;});
$('sound').onclick=()=>{audio.unlock();audio.muted=!audio.muted;$('sound').textContent=audio.muted?'SOUND OFF':'SOUND ON';$('sound').setAttribute('aria-label',audio.muted?'Enable audio':'Mute audio');};
applySettings();
// Bounded diagnostics, accessible only through the opt-in development bridge.
const diagnostics={frames:0,totalMs:0,maxMs:0,samples:new Float32Array(600),cursor:0};
let last=performance.now();
function frame(now){
 const rawDt=(now-last)/1000,dt=Math.min(.25,rawDt);last=now;
 if(import.meta.env.DEV&&game.state==='playing'){diagnostics.frames++;diagnostics.totalMs+=rawDt*1000;diagnostics.maxMs=Math.max(diagnostics.maxMs,rawDt*1000);diagnostics.samples[diagnostics.cursor++%600]=rawDt*1000;}
 const axes=input.axes();
 const look=input.lookDelta();
 if(look&&game.state==='playing'&&!settings.reducedMotion){game.player.yaw-=look.x*dt*2.4;game.player.pitch=Math.max(-1.15,Math.min(1.15,game.player.pitch-look.y*dt*1.8));}
 let remaining=dt;
 while(remaining>0){const step=Math.min(1/120,remaining);game.update(step,axes);remaining-=step;}
 const paused=game.state==='paused'||game.state==='tutorial';
 ui.update(game,paused?0:dt);audio.setRage(game.rageLeft>0&&game.state==='playing');
 if(endDelay>0){endDelay-=dt;if(endDelay<=0)results();}
 let renderDt=paused?0:dt;
 if(game.state==='victory'&&game.hitStop>0){const frozen=Math.min(renderDt,game.hitStop);game.hitStop-=frozen;renderDt-=frozen;}
 view.render(game,renderDt,game.state==='menu'||game.state==='tutorial',now/1000,settings.reducedMotion);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))window.__game={game,view,input,audio,start,pause,showMenu,settings,diagnostics};
