import {test,expect} from '@playwright/test';
test('production build is self-contained and works at laptop resolution',async({page})=>{
 const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
 await page.setViewportSize({width:1280,height:720});await page.goto('http://127.0.0.1:4187/?test');await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>window.__game)).toBeUndefined();
 await page.click('#quit');await expect(page.locator('#dialog')).toContainText('TAKE IT EASY.');await page.click('#stay');
 await page.click('#sound');await expect(page.locator('#sound')).toHaveText('SOUND OFF');
 await page.click('#settings');await page.locator('#motion').check();await page.locator('#difficulty').selectOption('hard');await page.click('#back');
 await expect(page.locator('#menu-difficulty')).toHaveText('HARD');
 await page.click('#start');await expect(page.locator('#tutorial-go')).toBeInViewport();await page.click('#tutorial-go');
 await expect.poll(()=>page.evaluate(()=>document.pointerLockElement?.id)).toBe('world');await expect(page.locator('#round-difficulty')).toHaveText('HARD');
 await page.keyboard.press('Escape');await page.click('#pause-settings');await expect(page.locator('#motion')).toBeChecked();await page.locator('#difficulty').selectOption('easy');
 await page.click('#back');await page.click('#resume');await expect(page.locator('#round-difficulty')).toHaveText('HARD');
 await page.keyboard.press('Escape');await page.click('#restart');await expect(page.locator('#round-difficulty')).toHaveText('EASY');
 await page.keyboard.press('Escape');await page.click('#howto');await page.click('#tutorial-skip');await expect.poll(()=>page.evaluate(()=>document.pointerLockElement?.id)).toBe('world');
 await page.keyboard.press('Escape');await page.click('#home');await page.reload();await expect(page.locator('#menu-difficulty')).toHaveText('EASY');
 expect(failed).toEqual([]);expect(errors).toEqual([]);
});
