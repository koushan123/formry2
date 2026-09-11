// Small reusable noise bank, bounded polyphony and explicit node cleanup.
export class AudioManager {
 constructor(){this._volume=.6;this._muted=false;this.voices=new Set();this.rageVoices=[];this.buffers=[];}
 get volume(){return this._volume;}
 set volume(v){this._volume=Math.max(0,Math.min(1,Number(v)||0));this.updateMaster();}
 get muted(){return this._muted;}
 set muted(v){this._muted=Boolean(v);this.updateMaster();}
 updateMaster(){if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.025);}
 unlock(){
  if(!this.ctx){
   this.ctx=new(window.AudioContext||window.webkitAudioContext)();
   this.master=this.ctx.createGain();const limiter=this.ctx.createDynamicsCompressor();
   limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;
   this.master.connect(limiter).connect(this.ctx.destination);this.updateMaster();
   for(let variant=0;variant<6;variant++){
    const buffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.25),this.ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    this.buffers.push(buffer);
   }
  }
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
 }
 connectVoice(source,nodes){
  if(this.voices.size>=32){source.disconnect();nodes.forEach(n=>n.disconnect());return false;}
  this.voices.add(source);source.onended=()=>{source.disconnect();nodes.forEach(n=>n.disconnect());this.voices.delete(source);};return true;
 }
 tone(frequency,duration,level,delay=0,wave='sine'){
  const ctx=this.ctx,t=ctx.currentTime+delay,o=ctx.createOscillator(),gain=ctx.createGain();
  o.type=wave;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,frequency*.55),t+duration);
  gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(level,t+.006);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  o.connect(gain).connect(this.master);if(this.connectVoice(o,[gain])){o.start(t);o.stop(t+duration);}
 }
 noise(frequency,level,rate=1){
  const ctx=this.ctx,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=this.buffers[Math.floor(Math.random()*this.buffers.length)];source.playbackRate.value=rate;
  filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=level;
  source.connect(filter).connect(gain).connect(this.master);if(this.connectVoice(source,[filter,gain]))source.start();
 }
 setRage(enabled){
  if(!this.ctx)return;
  if(enabled&&!this.rageVoices.length){
   for(const frequency of [55,82.4]){
    const o=this.ctx.createOscillator(),gain=this.ctx.createGain();o.type='triangle';o.frequency.value=frequency;
    gain.gain.setValueAtTime(0,this.ctx.currentTime);gain.gain.linearRampToValueAtTime(.065,this.ctx.currentTime+.25);
    o.connect(gain).connect(this.master);if(this.connectVoice(o,[gain])){o.start();this.rageVoices.push({o,gain});}
   }
  }else if(!enabled&&this.rageVoices.length){
   for(const {o,gain} of this.rageVoices){gain.gain.setTargetAtTime(.001,this.ctx.currentTime,.035);o.stop(this.ctx.currentTime+.16);}this.rageVoices=[];
  }
 }
 stop(){this.setRage(false);for(const voice of this.voices){try{voice.stop();}catch{}}}
 play(type){
  if(!this.ctx||this.muted||this.volume===0)return;
  const variation=.9+Math.random()*.2;
  switch(type){
   case 'punch':this.noise(1800,.12,1.4*variation);break;
   case 'miss':this.noise(2800,.1,1.6*variation);break;
   case 'hit':case 'strong':
    this.tone((type==='strong'?65:105)*variation,.18,type==='strong'?.55:.38);
    this.noise(type==='strong'?1800:1350,.38,variation);
    this.tone(280*variation,.11,.075,.045,'triangle');break;
   case 'stagger':this.tone(175*variation,.38,.09,0,'sawtooth');break;
   case 'hurt':this.tone(46,.24,.45);this.noise(450,.32,.8);break;
   case 'block':this.tone(240*variation,.075,.16,0,'triangle');this.noise(800,.19,1.7);break;
   case 'dodge':this.noise(2200,.09,1.2);break;
   case 'windup':this.tone(440,.1,.1,0,'triangle');this.tone(660,.08,.09,.12,'triangle');break;
   case 'rage':[110,220,440].forEach((f,i)=>this.tone(f,.5,.17,i*.07,'triangle'));break;
   case 'combo':this.tone(520*variation,.13,.06,0,'triangle');break;
   case 'victory':this.setRage(false);[330,440,550,660].forEach((f,i)=>this.tone(f,.65,.2,i*.12,'triangle'));this.noise(600,.3,.7);break;
   case 'defeat':this.setRage(false);this.tone(150,.7,.18,0,'triangle');break;
  }
 }
}
