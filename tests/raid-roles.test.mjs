import test from 'node:test';
import assert from 'node:assert/strict';
import { raidRole, raidRoleOrder } from '../dist/raid-roles.js';

test('hybrid specs and the Forever Survival build use distinct raid groups', () => {
  for (const [class_name, spec, expected] of [
    ['Druid','Feral (Bear)','Tank'], ['Druid','Feral (Cat)','Melee DPS'], ['Druid','Balance','Ranged DPS'], ['Druid','Restoration','Healer'],
    ['Shaman','Enhancement','Melee DPS'], ['Shaman','Elemental','Ranged DPS'], ['Shaman','Restoration','Healer'],
    ['Hunter','Survival','Melee DPS'], ['Hunter','Beast Mastery','Ranged DPS'], ['Hunter','Marksmanship','Ranged DPS'],
    ['Priest','Shadow','Ranged DPS'], ['Priest','Holy','Healer'], ['Priest','Discipline','Healer'],
    ['Paladin','Retribution','Melee DPS'], ['Paladin','Protection','Tank'], ['Paladin','Holy','Healer'],
    ['Warrior','Arms','Melee DPS'], ['Warrior','Fury','Melee DPS'], ['Warrior','Protection','Tank'],
    ...['Assassination','Combat','Subtlety'].map(s => ['Rogue',s,'Melee DPS']),
    ...['Arcane','Fire','Frost'].map(s => ['Mage',s,'Ranged DPS']),
    ...['Affliction','Demonology','Destruction'].map(s => ['Warlock',s,'Ranged DPS']),
  ]) assert.equal(raidRole({class_name,spec,role:'Damage'}),expected,`${class_name}/${spec}`);
});

test('old Damage records classify without mutation and unknown specs stay Flexible', () => {
  const rows = [
    {class_name:'Priest',spec:'Shadow',role:'Damage'},
    {class_name:'Warrior',spec:'Fury',role:'Damage'},
    {class_name:'Mage',spec:'Not sure yet',role:'Damage'},
    {class_name:'Unknown',spec:'Shadow',role:'Damage'},
    {class_name:'Druid',spec:'Feral',role:'Damage'},
    {class_name:'toString',spec:'constructor',role:'Damage'},
  ];
  const original=structuredClone(rows);
  const counts=raidRoleOrder.map(role => rows.filter(row => raidRole(row) === role).length);
  assert.deepEqual(counts,[0,0,1,1,4]);
  assert.deepEqual(rows,original);
});
