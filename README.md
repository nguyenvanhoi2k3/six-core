# sixjs

## Installation

```bash
npm install six-core
```

## Module

```javascript
// Init
import { SmoothScroll } from "six-core";
const smoothScroll = new SmoothScroll({});

// Start smooth scrolling
smoothScroll.start();

// Listen to scroll events
smoothScroll.on("scroll", (data) =>
  console.log(smoothScroll.isAtTop ? "At top:" : "Current scroll:", data.scroll)
);
```

## CDN

```javascript
// Init
<script src="https://cdn.jsdelivr.net/gh/nguyenvanhoi2k3/six-core@version/dist/six-core.iife.min.js" defer></script>
<script>
const scroll = new six.SmoothScroll({});

// Start smooth scrolling
smoothScroll.start();

// Listen to scroll events
smoothScroll.on("scroll", (data) =>
  console.log(smoothScroll.isAtTop ? "At top:" : "Current scroll:", data.scroll)
);
</script>
```

## Options

```javascript
const scroll = new SmoothScroll({
  lerp: 0.1, // Độ mạnh quán tính (0->1) (default: 0.13)
  mouseScrollScale: 0.8, // Độ mạnh cuộn bằng chuột (default: 1)
  touchScrollScale: 2, // Độ mạnh cuộn bằng cảm ứng (default: 3)
  disableOnMobile: true, // Tắt trên mobile (default: true)
  loop: true, // (default: false)
});
```
