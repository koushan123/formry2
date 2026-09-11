import {test,expect} from '@playwright/test';

import {writeFile} from 'node:fs/promises';
test('rendering, pooled effects, audio cleanup and repeated restart resource stability',async({page,browser},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test');await page.click('#start');await page.click('#tutorial-go');
 // Warm the lazily uploaded particle geometry before comparing retained resources.
 await page.evaluate(()=>{window.__game.view.impact({x:0,z:0,strong:true});window.__game.audio.play('strong');});
 await page.waitForTimeout(1000);await page.keyboard.press('Escape');await page.waitForTimeout(700);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Performance.enable');
 const snapshot=async()=>{
  await cdp.send('HeapProfiler.collectGarbage');
  const metrics=await cdp.send('Performance.getMetrics');
  const resources=await page.evaluate(()=>{const {view,audio}=window.__game;return {geometries:view.renderer.info.memory.geometries,textures:view.renderer.info.memory.textures,voices:audio.voices.size,noiseBuffers:audio.buffers.length,particlePool:view.particles.length};});
  return {...resources,heap:metrics.metrics.find(m=>m.name==='JSHeapUsedSize').value};
 };
 const before=await snapshot();
 await page.click('#resume');
 // Stress only: saturate the fixed particle pool and audio voices during an 8-second render sample.
 await page.evaluate(()=>{
  const {game,view,audio,diagnostics}=window.__game;game.rageLeft=6;game.player.block=true;
  diagnostics.frames=0;diagnostics.totalMs=0;diagnostics.maxMs=0;diagnostics.cursor=0;diagnostics.samples.fill(0);
  window.__stress=setInterval(()=>{view.impact({x:game.enemy.x,z:game.enemy.z,strong:true});audio.play('strong');},110);
 });
 await page.waitForTimeout(8000);
 const rendering=await page.evaluate(()=>{
  clearInterval(window.__stress);const {diagnostics:d,view}=window.__game;
  const sorted=Array.from(d.samples).filter(v=>v>0).sort((a,b)=>a-b);
  return {fps:1000*d.frames/d.totalMs,p95FrameMs:sorted[Math.floor(sorted.length*.95)],maxFrameMs:d.maxMs,drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles};
 });
 await page.keyboard.press('Escape');
 for(let i=0;i<10;i++){await page.click('#restart');await page.waitForTimeout(80);await page.keyboard.press('Escape');}
 await page.waitForTimeout(1000);const after=await snapshot();
 const report={browser:browser.version(),viewport:'1440x900',rendering,before,after,heapDelta:after.heap-before.heap};
 await writeFile(testInfo.outputPath('performance.json'),JSON.stringify(report,null,2));
 await testInfo.attach('performance',{path:testInfo.outputPath('performance.json'),contentType:'application/json'});
 expect(after.geometries).toBe(before.geometries);expect(after.textures).toBe(before.textures);
 expect(after.noiseBuffers).toBe(6);expect(after.particlePool).toBe(48);expect(after.voices).toBe(0);
 // Allow engine/JIT variation; retained memory must not scale with round count.
 expect(after.heap-before.heap).toBeLessThan(8*1024*1024);
 expect(errors).toEqual([]);
});
