import type { Save } from './gardening.ts';
import { stage } from './gardening.ts';
import { plots } from '../content/garden.ts';
import { stories } from '../content/stories.ts';
export function forestAchievements(save: Save, now: number) {
  const plants=plots.filter(p=>save.plants[p.id]);
  return [
    {id:'plant-three',label:'Planta tres flores en el jardín',current:Math.min(3,plants.length),goal:3},
    {id:'first-bloom',label:'Consigue que una flor abra sus pétalos',current:plants.some(p=>stage(save.plants[p.id],now)===2)?1:0,goal:1},
    {id:'two-memories',label:'Guarda dos recuerdos',current:Math.min(2,stories.filter(s=>save.memoriesRead.includes(s.id)).length),goal:2},
  ];
}
export function canVisitForest(save: Save, now: number): boolean { return !!save.forestUnlocked || forestAchievements(save,now).every(a=>a.current===a.goal); }
