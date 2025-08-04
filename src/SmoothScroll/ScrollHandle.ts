type ScrollCallback = (data: { deltaX: number; deltaY: number; event: Event }) => void

interface ScrollHandleOptions {
  wheelMultiplier?: number
  touchMultiplier?: number
}

export class ScrollHandle {
  private el: HTMLElement
  private options: Required<ScrollHandleOptions>
  private callback?: ScrollCallback
  private touch = { x: 0, y: 0 }
  private lastDelta = { x: 0, y: 0 }
  private static LINE_HEIGHT = 16.66

  constructor(el: HTMLElement, options: ScrollHandleOptions = {}) {
    this.el = el
    this.options = {
      wheelMultiplier: options.wheelMultiplier ?? 1,
      touchMultiplier: options.touchMultiplier ?? 1
    }

    el.addEventListener('wheel', this.onWheel, { passive: false })
    el.addEventListener('touchstart', this.onTouchStart, { passive: true })
    el.addEventListener('touchmove', this.onTouchMove, { passive: false })
    el.addEventListener('touchend', this.onTouchEnd, { passive: true })
  }

  on(event: 'scroll', cb: ScrollCallback): void {
    if (event === 'scroll') this.callback = cb
  }

  private checkNestedScroll(node: HTMLElement, dx: number, dy: number): boolean {
    const style = getComputedStyle(node)
    const ox = ['auto', 'scroll'].includes(style.overflowX)
    const oy = ['auto', 'scroll'].includes(style.overflowY)
    if (!ox && !oy) return false

    const { scrollWidth, scrollHeight, clientWidth, clientHeight, scrollTop, scrollLeft } = node
    const mx = scrollWidth > clientWidth
    const my = scrollHeight > clientHeight
    if (!mx && !my) return false

    const sx = dx && ox && mx && ((dx > 0 && scrollLeft < scrollWidth - clientWidth) || (dx < 0 && scrollLeft > 0))
    const sy = dy && oy && my && ((dy > 0 && scrollTop < scrollHeight - clientHeight) || (dy < 0 && scrollTop > 0))
    return !!(sx || sy)
  }

  private onWheel = (e: WheelEvent): void => {
    const path = e.composedPath() as HTMLElement[]
    if (path.some(n => n instanceof HTMLElement && this.checkNestedScroll(n, e.deltaX, e.deltaY))) return

    e.preventDefault()
    const m = e.deltaMode === 1 ? ScrollHandle.LINE_HEIGHT : e.deltaMode === 2 ? window.innerHeight : 1
    const deltaX = e.deltaX * m * this.options.wheelMultiplier
    const deltaY = e.deltaY * m * this.options.wheelMultiplier
    this.callback?.({ deltaX, deltaY, event: e })
  }

  private onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0]
    this.touch.x = t.clientX
    this.touch.y = t.clientY
    this.lastDelta = { x: 0, y: 0 }
    this.callback?.({ deltaX: 0, deltaY: 0, event: e })
  }

  private onTouchMove = (e: TouchEvent): void => {
    const t = e.touches[0]
    const deltaX = -(t.clientX - this.touch.x) * this.options.touchMultiplier
    const deltaY = -(t.clientY - this.touch.y) * this.options.touchMultiplier

    if ((e.composedPath() as HTMLElement[]).some(n => n instanceof HTMLElement && this.checkNestedScroll(n, deltaX, deltaY))) return

    this.touch.x = t.clientX
    this.touch.y = t.clientY
    this.lastDelta = { x: deltaX, y: deltaY }

    e.preventDefault()
    this.callback?.({ deltaX, deltaY, event: e })
  }

  private onTouchEnd = (e: TouchEvent): void => {
    this.callback?.({ deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event: e })
  }

  destroy(): void {
    this.el.removeEventListener('wheel', this.onWheel)
    this.el.removeEventListener('touchstart', this.onTouchStart)
    this.el.removeEventListener('touchmove', this.onTouchMove)
    this.el.removeEventListener('touchend', this.onTouchEnd)
    this.callback = undefined
  }
}
