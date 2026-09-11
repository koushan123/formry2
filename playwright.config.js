import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:240000,workers:1,
 projects:[{name:'chrome',use:{channel:'chrome'}},{name:'edge',use:{channel:'msedge'}}],
 use:{baseURL:'http://127.0.0.1:5186',viewport:{width:1440,height:900},trace:{mode:'retain-on-failure',screenshots:false,snapshots:false}},
 webServer:[
  {command:'npm run dev -- --port 5186 --strictPort',url:'http://127.0.0.1:5186',reuseExistingServer:false},
  {command:'npm run preview -- --port 4187 --strictPort',url:'http://127.0.0.1:4187',reuseExistingServer:false},
 ],
});
