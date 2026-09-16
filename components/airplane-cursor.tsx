'use client';

import { useEffect, useRef } from 'react';

export default function AirplaneCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastTrailRef = useRef(0);

  useEffect(() => {
    const root = cursorRef.current;
    if (!root) return;

    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!media.matches) return;

    let x = -100;
    let y = -100;
    let raf = 0;
    let visible = false;

    const move = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      visible = true;
      root.style.opacity = '1';
    };

    const render = () => {
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const trail = (event: MouseEvent) => {
      const now = performance.now();
      if (!visible || now - lastTrailRef.current < 32) return;
      lastTrailRef.current = now;

      const dot = document.createElement('span');
      dot.className = 'airplane-cursor-trail';
      dot.style.left = `${event.clientX}px`;
      dot.style.top = `${event.clientY}px`;
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 620);
    };

    const leave = () => {
      visible = false;
      root.style.opacity = '0';
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mousemove', trail, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousemove', trail);
      document.documentElement.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cursorRef} className="airplane-cursor" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M31.7 2.8c2.2-.7 4.1.8 4.2 3.1l.7 18.1 18.2 9.2c1.8.9 2.5 3.1 1.5 4.8-.7 1.4-2.4 2.2-4 1.8l-16.1-3.8.5 10.5 7.3 6.7c1.4 1.3.5 3.7-1.4 3.7h-7.2l-4.2 4.4c-.9.9-2.4.3-2.4-1v-3.4l-5.6-1.1c-1.9-.4-2.2-2.9-.5-4l7.2-4.6.5-10.5-16.1 3.8c-1.6.4-3.3-.4-4-1.8-1-1.7-.3-3.9 1.5-4.8l18.2-9.2.7-18.1c.1-1.9 1.1-3.3 2.9-3.8Z" fill="#ffffff" stroke="#0b1420" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M29.3 26.7 20.7 22.3M34.7 26.7l8.6-4.4" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
