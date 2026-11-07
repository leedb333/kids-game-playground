export type BrickColor='pink'|'yellow'|'mint'|'purple'|'blue'|'gold'
export type Brick={id:string;x:number;y:number;w:number;h:number;color:BrickColor;gold:boolean}
export type Stage={id:number;name:string;theme:'curve'|'heart'|'clover'|'wave'|'zigzag'|'final';difficulty:string;speed:number;paddleWidth:number;bricks:Brick[]}
export type Phase='ready'|'playing'|'paused'|'cleared'
export type Particle={x:number;y:number;vx:number;vy:number;life:number;color:string}
export type Engine={stage:number;width:number;height:number;phase:Phase;pausedFrom:'ready'|'playing';paddle:{x:number;y:number;w:number;h:number};ball:{x:number;y:number;vx:number;vy:number;r:number};bricks:Brick[];removed:string[];trail:{x:number;y:number}[];particles:Particle[];speed:number;misses:number;clearReason:'gold'|'all'|null;events:('brick'|'gold'|'paddle'|'miss')[]}
