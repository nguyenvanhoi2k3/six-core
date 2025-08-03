import { SmoothScroll } from './index';

const scroll = new SmoothScroll({});

scroll.start();

scroll.on('scroll', (data) =>
    console.log(scroll.isAtTop ? 'At top:' : 'Current scroll:', data.scroll)
);
