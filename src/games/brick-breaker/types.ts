export type BrickColor='pink'|'yellow'|'mint'|'purple'|'blue'|'gold'
export type Brick={id:string;x:number;y:number;w:number;h:number;color:BrickColor;gold:boolean}
export type Stage={id:number;name:string;theme:'curve'|'heart'|'clover'|'wave'|'zigzag'|'final';difficulty:string;speed:number;paddleWidth:number;bricks:Brick[]}
export type Phase='ready'|'playing'|'paused'|'cleared'
export type Particle={x:number;y:number;vx:number;vy:number;life:number;color:string}
export type Ball={x:number;y:number;vx:number;vy:number;r:number;trail:{x:number;y:number}[]}
export type Engine={stage:number;width:number;height:number;phase:Phase;pausedFrom:'ready'|'playing';paddle:{x:number;y:number;w:number;h:number};balls:Ball[];bricks:Brick[];removed:string[];particles:Particle[];speed:number;playSeconds:number;split:boolean;misses:number;clearReason:'gold'|'all'|null;events:('brick'|'gold'|'paddle'|'miss')[]}
