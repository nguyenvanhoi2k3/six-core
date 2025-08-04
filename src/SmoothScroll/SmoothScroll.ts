import { ScrollTween } from './ScrollTween'
import { ScrollHandle } from './ScrollHandle'
import { HookSystem } from './HookSystem'
import { clamp, safeIndex } from './Math'

export interface SmoothScrollOptions {
  lerp?: number
  mouseScrollScale?: number
  touchScrollScale?: number
  disableOnMobile?: boolean
  loop?: boolean
}

function isMobileDevice() {
  return typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
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
  private options: Required<SmoothScrollOptions>
  private rafId: number | null = null
  private resetVelocityTimeout: ReturnType<typeof setTimeout> | null = null

  constructor({
    mouseScrollScale: wheelMultiplier = 1,
    touchScrollScale: touchMultiplier = 3,
    lerp = 0.13,
    disableOnMobile = true,
    loop = false,
  }: SmoothScrollOptions = {}) {
    this.options = {
      mouseScrollScale: wheelMultiplier,
      touchScrollScale: touchMultiplier,
      lerp,
      disableOnMobile,
      loop,
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
      if (event.type.includes('touch')) {
        this.isScrolling = 'smooth'
      }
      event.preventDefault()
      if (!this.options.loop && this.targetScroll <= 0 && deltaY < 0) {
        return
      }
      this.scrollTo(this.targetScroll + deltaY, { programmatic: false })
    })
  }

  get scroll(): number {
    return this.options.loop
      ? safeIndex(this.animatedScroll, this.limit)
      : this.animatedScroll
  }

  get isAtTop(): boolean {
    return Math.abs(this.scroll) < 0.01
  }

  get limit(): number {
    return document.documentElement.scrollHeight - window.innerHeight
  }

  private getActualScroll(): number {
    return window.scrollY
  }

  private setScroll(value: number): void {
    window.scrollTo({ top: value, behavior: 'instant' })
  }

  private reset(): void {
    if (this.resetVelocityTimeout) {
      clearTimeout(this.resetVelocityTimeout)
      this.resetVelocityTimeout = null
    }
    this.isScrolling = false
    this.animatedScroll = this.targetScroll = this.getActualScroll()
    this.lastVelocity = this.velocity
    this.velocity = 0
    this.direction = 0
    this.scrollTween.cancel()
    this.hookSystem.emit('scroll', {
      scroll: this.scroll,
      velocity: this.velocity,
      lastVelocity: this.lastVelocity,
      direction: this.direction,
    })
    requestAnimationFrame(() => {
      this.hookSystem.emit('scrollend', {
        scroll: this.scroll,
        velocity: this.velocity,
        lastVelocity: this.lastVelocity,
        direction: this.direction,
      })
    })
  }

  private onNativeScroll = (): void => {
    if (this.preventNextNativeScroll) {
      this.preventNextNativeScroll = false
      return
    }

    if (this.isScrolling === false || this.isScrolling === 'native') {
      const lastScroll = this.animatedScroll
      this.animatedScroll = this.targetScroll = this.getActualScroll()
      this.lastVelocity = this.velocity
      this.velocity = this.animatedScroll - lastScroll
      this.direction = Math.sign(this.velocity) as 1 | -1 | 0
      this.isScrolling = 'native'
      this.hookSystem.emit('scroll', {
        scroll: this.scroll,
        velocity: this.velocity,
        lastVelocity: this.lastVelocity,
        direction: this.direction,
      })

      if (this.velocity !== 0) {
        this.resetVelocityTimeout = setTimeout(() => {
          this.lastVelocity = this.velocity
          this.velocity = 0
          this.isScrolling = false
          this.hookSystem.emit('scroll', {
            scroll: this.scroll,
            velocity: this.velocity,
            lastVelocity: this.lastVelocity,
            direction: this.direction,
          })
        }, 400)
      }
    }
  }

  private preventNextNativeScrollEvent(): void {
    this.preventNextNativeScroll = true
    requestAnimationFrame(() => {
      this.preventNextNativeScroll = false
    })
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
  ): void {
    if (!this.isEnabled) return

    if (typeof target === 'string' && target === 'top') {
      target = 0
    } else if (typeof target === 'string' && target === 'bottom') {
      target = this.limit
    } else if (typeof target === 'string') {
      const node = document.querySelector(target)
      if (node instanceof HTMLElement) {
        target = node.getBoundingClientRect().top + this.scroll
      } else {
        return
      }
    } else if (target instanceof HTMLElement) {
      target = target.getBoundingClientRect().top + this.scroll
    }

    if (typeof target !== 'number') return

    target = Math.round(target + offset)

    if (this.options.loop) {
      if (programmatic) {
        this.targetScroll = this.animatedScroll = this.scroll
        const maxScroll = this.limit
        const distance = target - this.animatedScroll
        if (distance > maxScroll / 2) {
          target -= maxScroll
        } else if (distance < -maxScroll / 2) {
          target += maxScroll
        }
      }
    } else {
      target = clamp(0, target, this.limit)
    }

    if (target === this.targetScroll) {
      return
    }

    if (immediate) {
      this.animatedScroll = this.targetScroll = target
      this.setScroll(this.scroll)
      this.scrollTween.cancel()
      this.hookSystem.emit('scroll', {
        scroll: this.scroll,
        velocity: this.velocity,
        lastVelocity: this.lastVelocity,
        direction: this.direction,
      })
      this.preventNextNativeScrollEvent()
      requestAnimationFrame(() => {
        this.hookSystem.emit('scrollend', {
          scroll: this.scroll,
          velocity: this.velocity,
          lastVelocity: this.lastVelocity,
          direction: this.direction,
        })
      })
      return
    }

    if (!programmatic) {
      this.targetScroll = target
    }

    this.scrollTween.fromTo(this.animatedScroll, this.targetScroll, {
      lerp,
      onStart: () => {
        this.isScrolling = 'smooth'
      },
      onUpdate: (value, done) => {
        this.lastVelocity = this.velocity
        this.velocity = value - this.animatedScroll
        this.direction = Math.sign(this.velocity) as 1 | -1 | 0
        this.animatedScroll = value
        this.setScroll(this.scroll)
        this.hookSystem.emit('scroll', {
          scroll: this.scroll,
          velocity: this.velocity,
          lastVelocity: this.lastVelocity,
          direction: this.direction,
        })

        if (done) {
          this.isScrolling = false
          this.animatedScroll = this.targetScroll
          this.setScroll(this.scroll)
          this.scrollTween.cancel()
          this.hookSystem.emit('scroll', {
            scroll: this.scroll,
            velocity: this.velocity,
            lastVelocity: this.lastVelocity,
            direction: this.direction,
          })
          requestAnimationFrame(() => {
            this.hookSystem.emit('scrollend', {
              scroll: this.scroll,
              velocity: this.velocity,
              lastVelocity: this.lastVelocity,
              direction: this.direction,
            })
          })
          this.preventNextNativeScrollEvent()
        }
      },
    })
  }

  private loop = (time: number): void => {
    this.raf(time)
    this.rafId = requestAnimationFrame(this.loop)
  }

  start(): void {
    if (!this.isEnabled) return
    this.reset()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.reset()
  }

  destroy(): void {
    this.stop()
    if (this.scrollHandle) {
      this.scrollHandle.destroy()
      this.scrollHandle = null
    }
    window.removeEventListener('scroll', this.onNativeScroll)
    this.hookSystem.destroy()
  }

  raf(time: number): void {
    const deltaTime = Math.min((time - this.time) * 0.001, 0.1)
    this.time = time
    this.scrollTween.advance(deltaTime)
  }

  on(event: 'scroll' | 'scrollend', callback: (data: {
    scroll: number
    velocity: number
    lastVelocity: number
    direction: 1 | -1 | 0
  }) => void): () => void {
    if (!this.isEnabled) return () => { }
    return this.hookSystem.on(event, callback)
  }
}