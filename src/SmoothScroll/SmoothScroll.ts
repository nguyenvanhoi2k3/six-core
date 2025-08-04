import { ScrollTween } from './ScrollTween'
import { ScrollHandle } from './ScrollHandle'
import { HookSystem } from './HookSystem'
import { clamp } from './math'

export interface SmoothScrollOptions {
  lerp?: number
  mouseScrollScale?: number
  touchScrollScale?: number
  disableOnMobile?: boolean
}

function isMobileDevice() {
  return typeof window !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
}

export class SmoothScroll {
  private isEnabled = true
  private isScrolling: 'smooth' | 'native' | false = false
  private targetScroll = 0
  private animatedScroll = 0
  private velocity = 0
  private lastVelocity = 0
  private direction: 1 | -1 | 0 = 0
  private scrollTween = new ScrollTween()
  private hookSystem = new HookSystem()
  private scrollHandle: ScrollHandle | null = null
  private time = 0
  private preventNextNativeScroll = false
  private rafId: number | null = null
  private resetVelocityTimeout: ReturnType<typeof setTimeout> | null = null
  private options: Required<SmoothScrollOptions>

  constructor({
    mouseScrollScale: wheelMultiplier = 0.9,
    touchScrollScale: touchMultiplier = 3,
    lerp = 0.11,
    disableOnMobile = true,
  }: SmoothScrollOptions = {}) {
    this.options = {
      mouseScrollScale: wheelMultiplier,
      touchScrollScale: touchMultiplier, 
      lerp,
      disableOnMobile
    }


    if (disableOnMobile && isMobileDevice()) {
      this.isEnabled = false
      return
    }

    this.animatedScroll = this.targetScroll = this.getActualScroll()

    this.scrollHandle = new ScrollHandle(document.documentElement, {
      wheelMultiplier,
      touchMultiplier,
    })

    window.addEventListener('scroll', this.onNativeScroll, { passive: true })

    this.scrollHandle.on('scroll', ({ deltaY, event }) => {
      if (event.type.includes('touch')) this.isScrolling = 'smooth'
      event.preventDefault()
      this.scrollTo(this.targetScroll + deltaY, { programmatic: false })
    })
  }

  get scroll() {
    return this.animatedScroll
  }

  get isAtTop() {
    return Math.abs(this.scroll) < 0.01
  }

  get limit() {
    return document.documentElement.scrollHeight - window.innerHeight
  }

  private getActualScroll() {
    return window.scrollY
  }

  private setScroll(value: number) {
    window.scrollTo({ top: value, behavior: 'auto' })
  }

  private reset() {
    if (this.resetVelocityTimeout) clearTimeout(this.resetVelocityTimeout)
    this.resetVelocityTimeout = null
    this.isScrolling = false
    this.animatedScroll = this.targetScroll = this.getActualScroll()
    this.lastVelocity = this.velocity = 0
    this.direction = 0
    this.scrollTween.cancel()
    this.hookSystem.emit('scroll', this.emitData())
    requestAnimationFrame(() => this.hookSystem.emit('scrollend', this.emitData()))
  }

  private onNativeScroll = () => {
    if (this.preventNextNativeScroll) {
      this.preventNextNativeScroll = false
      return
    }

    if (!this.isScrolling || this.isScrolling === 'native') {
      const lastScroll = this.animatedScroll
      this.animatedScroll = this.targetScroll = this.getActualScroll()
      this.lastVelocity = this.velocity
      this.velocity = this.animatedScroll - lastScroll
      this.direction = Math.sign(this.velocity) as 1 | -1 | 0
      this.isScrolling = 'native'
      this.hookSystem.emit('scroll', this.emitData())

      if (this.velocity !== 0) {
        this.resetVelocityTimeout = setTimeout(() => {
          this.lastVelocity = this.velocity
          this.velocity = 0
          this.isScrolling = false
          this.hookSystem.emit('scroll', this.emitData())
        }, 400)
      }
    }
  }

  private preventNextNativeScrollEvent() {
    this.preventNextNativeScroll = true
    requestAnimationFrame(() => (this.preventNextNativeScroll = false))
  }

  scrollTo(
    target: number | string | HTMLElement,
    {
      offset = 0,
      immediate = false,
      programmatic = true,
      lerp = this.options.lerp,
    }: {
      offset?: number
      immediate?: boolean
      programmatic?: boolean
      lerp?: number
    } = {}
  ) {
    if (!this.isEnabled) return

    if (typeof target === 'string') {
      if (target === 'top') target = 0
      else if (target === 'bottom') target = this.limit
      else {
        const node = document.querySelector(target)
        if (!node) return
        target = (node as HTMLElement).getBoundingClientRect().top + this.scroll
      }
    } else if (target instanceof HTMLElement) {
      target = target.getBoundingClientRect().top + this.scroll
    }

    if (typeof target !== 'number') return

    target = clamp(0, Math.round(target + offset), this.limit)
    if (target === this.targetScroll) return

    if (immediate) {
      this.animatedScroll = this.targetScroll = target
      this.setScroll(this.scroll)
      this.scrollTween.cancel()
      this.hookSystem.emit('scroll', this.emitData())
      this.preventNextNativeScrollEvent()
      requestAnimationFrame(() => this.hookSystem.emit('scrollend', this.emitData()))
      return
    }

    if (!programmatic) this.targetScroll = target

    this.scrollTween.fromTo(this.animatedScroll, this.targetScroll, {
      lerp,
      onStart: () => (this.isScrolling = 'smooth'),
      onUpdate: (value, done) => {
        this.lastVelocity = this.velocity
        this.velocity = value - this.animatedScroll
        this.direction = Math.sign(this.velocity) as 1 | -1 | 0
        this.animatedScroll = value
        this.setScroll(this.scroll)
        this.hookSystem.emit('scroll', this.emitData())

        if (done) {
          this.isScrolling = false
          this.animatedScroll = this.targetScroll
          this.setScroll(this.scroll)
          this.scrollTween.cancel()
          this.hookSystem.emit('scroll', this.emitData())
          requestAnimationFrame(() => this.hookSystem.emit('scrollend', this.emitData()))
          this.preventNextNativeScrollEvent()
        }
      },
    })
  }

  private loop = (time: number) => {
    this.raf(time)
    this.rafId = requestAnimationFrame(this.loop)
  }

  start() {
    if (!this.isEnabled) return
    this.reset()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.reset()
  }

  destroy() {
    this.stop()
    this.scrollHandle?.destroy()
    this.scrollHandle = null
    window.removeEventListener('scroll', this.onNativeScroll)
    this.hookSystem.destroy()
  }

  raf(time: number) {
    const delta = Math.min((time - this.time) * 0.001, 0.1)
    this.time = time
    this.scrollTween.advance(delta)
  }

  on(event: 'scroll' | 'scrollend', callback: (data: {
    scroll: number
    velocity: number
    lastVelocity: number
    direction: 1 | -1 | 0
  }) => void) {
    return this.isEnabled ? this.hookSystem.on(event, callback) : () => { }
  }

  private emitData() {
    return {
      scroll: this.scroll,
      velocity: this.velocity,
      lastVelocity: this.lastVelocity,
      direction: this.direction,
    }
  }
}
