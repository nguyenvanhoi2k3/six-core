import { ease } from './math'

export class ScrollTween {
  private isActive = false
  private value = 0
  private to = 0
  private lerp = 0.1
  private onUpdate?: (value: number, done: boolean) => void
  private onStart?: () => void

  advance(dt: number): void {
    if (!this.isActive) return

    this.value = ease(this.value, this.to, this.lerp * 60, dt)
    const done = Math.abs(this.value - this.to) < 0.01 || Math.round(this.value) === this.to

    if (done) this.value = this.to, this.isActive = false
    this.onUpdate?.(this.value, done)
  }

  cancel(): void {
    this.isActive = false
  }

  fromTo(
    from: number,
    to: number,
    opt: {
      lerp?: number
      onStart?: () => void
      onUpdate?: (v: number, done: boolean) => void
    }
  ): void {
    Object.assign(this, {
      from,
      to,
      value: from,
      lerp: opt.lerp ?? 0.1,
      onStart: opt.onStart,
      onUpdate: opt.onUpdate,
      isActive: true
    })
    this.onStart?.()
  }
}
