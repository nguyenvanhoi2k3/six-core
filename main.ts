import { SmoothScroll } from './index';

const scroll = new SmoothScroll({lerp: 0.13});

scroll.start();

scroll.on('scroll', (data) =>
    console.log(scroll.isAtTop ? 'At top:' : 'Current scroll:', data.scroll)
);
