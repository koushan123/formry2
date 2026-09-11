import {DIFFICULTIES} from './config.js';
export const THEMES=['rose','mauve','dark'];
export const DEFAULT_SETTINGS={sensitivity:.002,volume:.6,reducedMotion:false,difficulty:'normal',tutorialSeen:false,theme:'rose'};
export function normalizeSettings(value){
 const v=value&&typeof value==='object'?value:{};
 return {sensitivity:Number.isFinite(v.sensitivity)?Math.max(.0005,Math.min(.005,v.sensitivity)):.002,
  volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.6,
  reducedMotion:v.reducedMotion===true,difficulty:DIFFICULTIES[v.difficulty]?v.difficulty:'normal',tutorialSeen:v.tutorialSeen===true,
  theme:THEMES.includes(v.theme)?v.theme:'rose'};
}
export function loadSettings(){try{return normalizeSettings(JSON.parse(localStorage.getItem('ar-settings')||'{}'));}catch{return {...DEFAULT_SETTINGS};}}
export function saveSettings(settings){try{localStorage.setItem('ar-settings',JSON.stringify(settings));}catch{}}
