/** World units/second at the reference height. Preserve the established 1.2x boost. */
export const ballSpeedConfig={firstStage:222,stageIncrement:7,boost:1.2,referenceHeight:620} as const
export const stageBaseSpeed=(stage:number)=>ballSpeedConfig.firstStage+(stage-1)*ballSpeedConfig.stageIncrement
/** Scale by field height, never by the shape/remaining count of a brick pattern. */
export const targetBallSpeed=(base:number,height:number)=>base*height/ballSpeedConfig.referenceHeight*ballSpeedConfig.boost
