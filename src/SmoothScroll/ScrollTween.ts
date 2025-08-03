import { ease, clamp } from './Math'

export class ScrollTween {
  private isActive = false
  private value = 0
  private from = 0
  private to = 0
  private lerp = 0.1
  private duration?: number
  private easing?: (t: number) => number
  private currentTime = 0
  private onUpdate?: (value: number, done: boolean) => void
  private onStart?: () => void

  advance(deltaTime: number): void {
    if (!this.isActive) return

    let completed = false

    if (this.duration && this.easing) {
      this.currentTime += deltaTime
      const linearProgress = clamp(0, this.currentTime / this.duration, 1)
      completed = linearProgress >= 1
      const easedProgress = completed ? 1 : this.easing(linearProgress)
      this.value = this.from + (this.to - this.from) * easedProgress
    } else {
      this.value = ease(this.value, this.to, this.lerp * 60, deltaTime)
      completed = Math.abs(this.value - this.to) < 0.01 || Math.round(this.value) === this.to
    }

    if (completed) {
      this.value = this.to
      this.isActive = false
    }

    this.onUpdate?.(this.value, completed)
  }

  cancel(): void {
    this.isActive = false
    this.currentTime = 0
  }

  fromTo(
    from: number,
    to: number,
    {
      lerp = 0.1,
      duration,
      easing,
      onStart,
      onUpdate,
    }: {
      lerp?: number
      duration?: number
      easing?: (t: number) => number
      onStart?: () => void
      onUpdate?: (value: number, done: boolean) => void
    }
  ): void {
    if (typeof easing === 'function' && typeof duration !== 'number') {
      duration = 1
    }
    this.from = this.value = from
    this.to = to
    this.lerp = lerp
    this.duration = duration
    this.easing = easing
    this.currentTime = 0
    this.onStart = onStart
    this.onUpdate = onUpdate
    this.isActive = true
    this.onStart?.()
  }
}