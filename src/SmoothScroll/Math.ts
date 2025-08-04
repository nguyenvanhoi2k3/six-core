export const clamp = (min: number, input: number, max: number): number =>
  Math.max(min, Math.min(input, max))

export const lerp = (x: number, y: number, t: number): number =>
  (1 - t) * x + t * y

export const ease = (current: number, target: number, smoothRate: number, timeStep: number): number =>
  lerp(current, target, 1 - Math.exp(-smoothRate * timeStep))

export const safeIndex = (n: number, d: number): number =>
  ((n % d) + d) % d