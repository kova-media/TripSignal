'use client';

import { useEffect, useRef } from 'react';

export default function AirplaneCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = cursorRef.current;
    if (!root) return;

    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!media.matches) return;

    let x = -100;
    let y = -100;
    let raf = 0;

    const move = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      root.style.opacity = '1';
    };

    const render = () => {
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const leave = () => {
      root.style.opacity = '0';
    };

    window.addEventListener('mousemove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cursorRef} className="airplane-cursor" aria-hidden="true">
      <img src="/airplane-cursor-v2.svg" alt="" width="32" height="32" />
    </div>
  );
}
