import {test,expect} from '@playwright/test';

test('menus, mouse capture, controls, full victory, retry and defeat',async({page,browser},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test');await expect(page.locator('#start')).toBeVisible();await page.screenshot({path:testInfo.outputPath('menu.png')});
 await page.click('#settings');await page.locator('#volume').fill('0.3');await page.click('#back');await page.click('#scenarios');await expect(page.locator('.scenario-item').first()).toContainText('READY');await page.click('#boxing');
 await expect(page.locator('#tutorial-go')).toBeVisible();await page.waitForTimeout(150);
 expect(await page.evaluate(()=>window.__game.game.elapsed)).toBe(0);await page.click('#tutorial-skip');
 await expect(page.locator('#hud')).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.pointerLockElement?.id)).toBe('world');
 expect(await page.evaluate(()=>window.__game.audio.ctx.state)).toBe('running');
 await page.keyboard.down('KeyW');await page.waitForTimeout(300);await page.keyboard.up('KeyW');expect(await page.evaluate(()=>window.__game.game.player.z)).toBeLessThan(3.3);
 const yaw=await page.evaluate(()=>window.__game.game.player.yaw);await page.mouse.move(750,460);await page.mouse.move(780,460);expect(await page.evaluate(()=>window.__game.game.player.yaw)).not.toBe(yaw);
 await page.mouse.down({button:'right'});expect(await page.evaluate(()=>window.__game.game.player.block)).toBe(true);await page.mouse.up({button:'right'});
 await page.keyboard.press('Shift');expect(await page.evaluate(()=>window.__game.game.player.dodgeCooldown)).toBeGreaterThan(0);
 await page.keyboard.press('Escape');await expect(page.locator('#resume')).toBeVisible();const elapsed=await page.evaluate(()=>window.__game.game.elapsed);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__game.game.elapsed)).toBe(elapsed);await page.click('#resume');
 let sawRage=false,sawCombo=false,sawOpening=false,blocking=false,moving=false,iterations=0;
 // Actual keyboard/mouse attacks through the full health pool. Only aim is assisted.
 while(iterations++<2400){
  const s=await page.evaluate(()=>{
   const g=window.__game.game,p=g.player,e=g.enemy;
   p.yaw=Math.atan2(-(e.x-p.x),-(e.z-p.z));p.pitch=0;
   return {state:g.state,threat:e.state==='ATTACK',opening:e.state==='RECOVER',distance:Math.hypot(e.x-p.x,e.z-p.z),ready:p.cooldown===0,rage:g.rageLeft,combo:g.combo};
  });
  if(s.state!=='playing')break;
  if(s.threat!==blocking){blocking=s.threat;if(blocking)await page.mouse.down({button:'right'});else await page.mouse.up({button:'right'});}
  if((s.distance>2.12)!==moving){moving=s.distance>2.12;if(moving)await page.keyboard.down('KeyW');else await page.keyboard.up('KeyW');}
  if(!blocking&&s.ready){await page.mouse.down();await page.mouse.up();}
  if(s.rage>0&&!sawRage){sawRage=true;await page.screenshot({path:testInfo.outputPath('release-mode.png')});}
  sawCombo ||=s.combo>=5;sawOpening ||=s.opening;
  await page.waitForTimeout(65);
 }
 await page.keyboard.up('KeyW');await page.mouse.up({button:'right'});
 await expect(page.locator('#again')).toBeVisible();await expect(page.locator('#dialog')).toContainText('PRESSURE OFF.');
 expect(sawRage).toBe(true);expect(sawCombo).toBe(true);expect(sawOpening).toBe(true);
 await page.screenshot({path:testInfo.outputPath('victory.png')});
 const round=await page.evaluate(()=>{const g=window.__game.game;return {seconds:g.elapsed,hits:g.hits,releases:g.rageActivations};});
 await testInfo.attach('round-result',{body:JSON.stringify({browser:browser.version(),...round}),contentType:'application/json'});
 await page.click('#again');expect(await page.evaluate(()=>window.__game.game.hits)).toBe(0);await page.screenshot({path:testInfo.outputPath('fight.png')});
 // Accelerate the unmodified simulation for the idle-player defeat path.
 await page.evaluate(()=>{const g=window.__game.game;for(let i=0;i<24000&&g.state==='playing';i++)g.update(.01);});
 await expect(page.locator('#again')).toBeVisible();await expect(page.locator('#dialog')).toContainText('SHAKE IT OFF.');await page.screenshot({path:testInfo.outputPath('defeat.png')});
 await page.click('#again');await expect(page.locator('#hud')).toBeVisible();await page.keyboard.press('Escape');await page.click('#home');await expect(page.locator('#start')).toBeVisible();expect(errors).toEqual([]);
});
