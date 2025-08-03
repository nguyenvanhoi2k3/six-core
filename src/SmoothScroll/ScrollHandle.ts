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
      touchMultiplier: options.touchMultiplier ?? 1,
    }

    this.el.addEventListener('wheel', this.onWheel, { passive: false })
    this.el.addEventListener('touchstart', this.onTouchStart, { passive: true })
    this.el.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.el.addEventListener('touchend', this.onTouchEnd, { passive: true })
  }

  on(event: 'scroll', cb: ScrollCallback): void {
    if (event === 'scroll') this.callback = cb
  }

  private checkNestedScroll(node: HTMLElement, deltaX: number, deltaY: number): boolean {
    const style = window.getComputedStyle(node)
    const hasOverflowX = ['auto', 'scroll'].includes(style.overflowX)
    const hasOverflowY = ['auto', 'scroll'].includes(style.overflowY)
    if (!hasOverflowX && !hasOverflowY) return false

    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = node
    const isScrollableX = scrollWidth > clientWidth
    const isScrollableY = scrollHeight > clientHeight
    if (!isScrollableX && !isScrollableY) return false

    if (deltaY !== 0 && hasOverflowY && isScrollableY) {
      const scrollTop = node.scrollTop
      const maxScroll = scrollHeight - clientHeight
      return (deltaY > 0 && scrollTop < maxScroll) || (deltaY < 0 && scrollTop > 0)
    }

    if (deltaX !== 0 && hasOverflowX && isScrollableX) {
      const scrollLeft = node.scrollLeft
      const maxScroll = scrollWidth - clientWidth
      return (deltaX > 0 && scrollLeft < maxScroll) || (deltaX < 0 && scrollLeft > 0)
    }

    return false
  }

  private onWheel = (e: WheelEvent): void => {
    const composedPath = e.composedPath() as HTMLElement[]
    if (composedPath.some(node => node instanceof HTMLElement && this.checkNestedScroll(node, e.deltaX, e.deltaY))) {
      return
    }

    e.preventDefault()
    let deltaX = e.deltaX
    let deltaY = e.deltaY
    const deltaMode = e.deltaMode
    const multiplierX = deltaMode === 1 ? ScrollHandle.LINE_HEIGHT : deltaMode === 2 ? window.innerWidth : 1
    const multiplierY = deltaMode === 1 ? ScrollHandle.LINE_HEIGHT : deltaMode === 2 ? window.innerHeight : 1

    deltaX *= multiplierX * this.options.wheelMultiplier
    deltaY *= multiplierY * this.options.wheelMultiplier

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

    const composedPath = e.composedPath() as HTMLElement[]
    if (composedPath.some(node => node instanceof HTMLElement && this.checkNestedScroll(node, deltaX, deltaY))) {
      return
    }

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