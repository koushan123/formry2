export const CONFIG = Object.freeze({
 playerHealth:100, moveSpeed:3.8, punchDamage:10, punchRange:2.65, punchCooldown:.38,
 punchContact:.075, punchAnimation:.3, ragePunchCooldown:.25, ragePunchContact:.055,
 hitStop:.035, strongHitStop:.065, knockoutHitStop:.12, recoilDuration:.3,
 powerMultiplier:1.5, vulnerabilityMultiplier:1.25, staggerDuration:.75, staggerImmunity:2.2,
 enemyDamage:5, enemySpeed:1.6, enemyRange:2.15, windup:.85, recovery:1.35, attackInterval:1.1,
 combatDistance:2.05, strafeSpeed:.32, attackArc:.72,
 comboTimeout:2.6, releasePerHit:5, rageDuration:6, rageMultiplier:1.65,
 dodgeDuration:.3, dodgeCooldown:1, dodgeSpeed:7.5, blockMultiplier:.08,
 arenaLimit:5.35, bodyRadius:.7,
});
export const DIFFICULTIES = Object.freeze({
 easy:Object.freeze({label:'Easy',damage:3,windup:1.1,recovery:1.6,interval:1.35,speed:1.6,health:1}),
 normal:Object.freeze({label:'Normal',damage:CONFIG.enemyDamage,windup:CONFIG.windup,recovery:CONFIG.recovery,interval:CONFIG.attackInterval,speed:CONFIG.enemySpeed,health:1}),
 hard:Object.freeze({label:'Hard',damage:5,windup:.65,recovery:1.05,interval:.65,speed:2,health:1.2}),
});
export const SCENARIOS = [{id:'boxing',name:'The Boxing Room',description:'Meet Static. Big gloves. Bigger attitude.',environment:'industrial-ring',opponent:{name:'Static',health:2300},objective:'Defeat Static',difficulty:2,isComplete:game=>game.enemy.health.dead}];
export class ScenarioManager {
 constructor(scenarios=SCENARIOS){this.scenarios=scenarios;this.current=scenarios[0];}
 select(id){const scenario=this.scenarios.find(s=>s.id===id);if(!scenario)throw new Error('Unknown scenario');this.current=scenario;return scenario;}
}
