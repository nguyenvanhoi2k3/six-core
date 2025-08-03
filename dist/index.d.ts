interface SmoothScrollOptions {
    lerp?: number;
    mouseScrollScale?: number;
    touchScrollScale?: number;
    disableOnMobile?: boolean;
    loop?: boolean;
}
declare class SmoothScroll {
    private isEnabled;
    private isScrolling;
    private targetScroll;
    private animatedScroll;
    private velocity;
    private lastVelocity;
    private direction;
    private scrollTween;
    private hookSystem;
    private scrollHandle;
    private time;
    private preventNextNativeScroll;
    private options;
    private rafId;
    private resetVelocityTimeout;
    constructor({ mouseScrollScale: wheelMultiplier, touchScrollScale: touchMultiplier, lerp, disableOnMobile, loop, }?: SmoothScrollOptions);
    get scroll(): number;
    get isAtTop(): boolean;
    get limit(): number;
    private getActualScroll;
    private setScroll;
    private reset;
    private onNativeScroll;
    private preventNextNativeScrollEvent;
    scrollTo(target: number | string | HTMLElement, { offset, immediate, programmatic, lerp, }?: {
        offset?: number;
        immediate?: boolean;
        programmatic?: boolean;
        lerp?: number;
    }): void;
    private loop;
    start(): void;
    stop(): void;
    destroy(): void;
    raf(time: number): void;
    on(event: 'scroll' | 'scrollend', callback: (data: {
        scroll: number;
        velocity: number;
        lastVelocity: number;
        direction: 1 | -1 | 0;
    }) => void): () => void;
}

export { SmoothScroll };
