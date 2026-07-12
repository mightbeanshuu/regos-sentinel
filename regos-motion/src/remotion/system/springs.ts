import {spring} from 'remotion';

export const SPRING_SNAPPY = {damping: 20, stiffness: 200} as const;
export const SPRING_SMOOTH = {damping: 200, stiffness: 100} as const;
export const SPRING_BOUNCY = {damping: 10, stiffness: 120} as const;
export const SPRING_UI = {damping: 22, stiffness: 180} as const;
export const SPRING_POP = {damping: 14, stiffness: 260, mass: 0.7} as const;
export const SPRING_SOFT = {damping: 28, stiffness: 120} as const;
export const SPRING_SOFT_DRIFT = {damping: 32, stiffness: 80} as const;
export const SPRING_ELASTIC = {damping: 8, stiffness: 160} as const;
export const SPRING_DRAW = {damping: 200, stiffness: 100} as const;

export const springSnappy = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_SNAPPY});

export const springSmooth = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_SMOOTH});

export const springBouncy = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_BOUNCY});

export const springUI = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_UI});

export const springPop = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_POP});

export const springSoft = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_SOFT});

export const springSoftDrift = (frame: number, fps: number) =>
  spring({frame, fps, config: SPRING_SOFT_DRIFT});
