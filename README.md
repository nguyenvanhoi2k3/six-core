# sixjs

## Installation

```bash
npm install six-js
```

## Usage

```javascript
// Init
import { SmoothScroll } from 'six-js';
const scroll = new SmoothScroll({});

// Start smooth scrolling
scroll.start();

// Listen to scroll events
scroll.on('scroll', (data) =>
    console.log(scroll.isAtTop ? 'At top:' : 'Current scroll:', data.scroll)
);

```

## Options

```javascript
const scroll = new SmoothScroll({
  lerp: 0.1,              // Độ mạnh quán tính (0->1) (default: 0.13)
  mouseScrollScale: 1,     // Độ mạnh cuộn bằng chuột (default: 0.8)
  touchScrollScale: 2,     // Độ mạnh cuộn bằng cảm ứng (default: 3)
  disableOnMobile: true   // Tắt trên mobile (default: true)
  loop: true // (default: false)
});
```
