import {test,expect} from '@playwright/test'
import {makeDeck,pictures,stages} from '../src/games/memory-card/data'
import {choose,hint,newGame,restore,snapshot,tick} from '../src/games/memory-card/model'

test('15 stages, exact layouts and forty distinct themed pictures',()=>{
 expect(pictures).toHaveLength(40);expect(new Set(pictures.map(p=>p.id)).size).toBe(40);expect(stages).toHaveLength(15)
 for(const theme of ['animals','fruits','vehicles','dinosaurs'])expect(pictures.filter(p=>p.theme===theme)).toHaveLength(10)
 for(const stage of stages){const group=Math.floor((stage.id-1)/3);expect(stage.pairs).toBe([3,4,6,8,10][group]);expect(stage.columns).toBe([3,4,4,4,5][group]);const deck=makeDeck(stage);expect(deck).toHaveLength(stage.pairs*2);expect(new Set(deck.map(c=>c.uid)).size).toBe(deck.length);for(const id of new Set(deck.map(c=>c.picture)))expect(deck.filter(c=>c.picture===id)).toHaveLength(2)}
})
test('every stage has exactly a 3 second locked preview',()=>{
 for(const stage of stages){let s=newGame(stage.id);expect(choose(s,s.deck[0].uid)).toBe(s);expect(hint(s)).toBe(s);s=tick(s,2999);expect(s.phase).toBe('preview');s=tick(s,1);expect(s.phase).toBe('play')}
})
test('same physical card cannot match itself, comparing locks input and correct pairs remain',()=>{
 let s=tick(newGame(),3000);const first=s.deck[0],pair=s.deck.find(c=>c.picture===first.picture&&c.uid!==first.uid)!
 s=choose(s,first.uid);expect(choose(s,first.uid)).toBe(s);s=choose(s,pair.uid);expect(s.phase).toBe('compare');expect(choose(s,s.deck.find(c=>c.picture!==first.picture)!.uid)).toBe(s);expect(hint(s)).toBe(s);s=tick(s,450);expect(s.matched).toEqual([first.picture]);expect(choose(s,first.uid)).toBe(s)
})
test('mismatched pair stays for one second and then closes',()=>{
 let s=tick(newGame(),3000);const a=s.deck[0],b=s.deck.find(c=>c.picture!==a.picture)!
 s=choose(choose(s,a.uid),b.uid);s=tick(s,999);expect(s.phase).toBe('compare');expect(s.selected).toHaveLength(2);s=tick(s,1);expect(s.phase).toBe('play');expect(s.selected).toEqual([]);expect(s.matched).toEqual([])
})
test('hint replaces a single flip with one unmatched pair for 2 seconds; pause freezes all timers',()=>{
 let s=tick(newGame(8),3000);const pair=s.deck.filter(c=>c.picture===s.deck[0].picture);s=tick(choose(choose(s,pair[0].uid),pair[1].uid),450)
 s=choose(s,s.deck.find(c=>c.picture!==pair[0].picture)!.uid);s=hint(s);expect(s.phase).toBe('hint');expect(s.selected).toHaveLength(2);expect(s.deck.filter(c=>s.selected.includes(c.uid)).every(c=>c.picture!==pair[0].picture)).toBe(true)
 s=tick(s,700);const paused={...s,paused:true};expect(tick(paused,10000)).toBe(paused);s=tick({...paused,paused:false},1299);expect(s.phase).toBe('hint');s=tick(s,1);expect(s.phase).toBe('play');expect(s.selected).toEqual([]);expect(s.matched).toHaveLength(1)
 for(const phase of ['preview','compare','hint'] as const){const frozen={...newGame(),phase,paused:true};expect(tick(frozen,30000)).toBe(frozen)}
})
test('all 15 stages complete and completion records remain unique',()=>{
 let completed:number[]=[]
 for(const stage of stages){let s=tick(newGame(stage.id,completed),3000);for(const picture of new Set(s.deck.map(c=>c.picture))){const pair=s.deck.filter(c=>c.picture===picture);s=tick(choose(choose(s,pair[0].uid),pair[1].uid),450)}expect(s.phase).toBe('complete');expect(s.matched).toHaveLength(stage.pairs);completed=s.completed;expect(choose(s,s.deck[0].uid)).toBe(s);const saved=restore(snapshot(s));expect(tick(saved,3000).phase).toBe('complete')}
 expect(completed).toEqual(stages.map(s=>s.id))
})
test('replay always changes picture positions, even with deterministic random input',()=>{
 for(const stage of stages){const first=makeDeck(stage,()=>.5),second=makeDeck(stage,()=>.5,first);expect(second.map(c=>c.picture)).not.toEqual(first.map(c=>c.picture))}
})
test('saved board and completed stages validate independently of transient flips',()=>{
 let s=tick(newGame(8,[1,2]),3000);const pair=s.deck.filter(c=>c.picture===s.deck[0].picture);s=tick(choose(choose(s,pair[0].uid),pair[1].uid),450);s=hint(s);const saved=snapshot(s),restored=restore(saved);expect(restored.phase).toBe('preview');expect(restored.remaining).toBe(3000);expect(restored.deck).toEqual(s.deck);expect(restored.matched).toEqual(s.matched);expect(restored.completed).toEqual([1,2]);expect(restored.selected).toEqual([])
 for(const bad of [null,{}, {...saved,stage:99},{...saved,deck:[]},{...saved,completed:[1,1]},{...saved,matched:['wrong']},{...saved,deck:saved.deck.map((c,i)=>i?c:saved.deck[1])}])expect(restore(bad).stage).toBe(1)
})
