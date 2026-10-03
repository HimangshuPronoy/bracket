'use client';

import { useRef, useState, useEffect } from 'react';
import TournamentCard from './TournamentCard';
interface Props {
  title: string;
  tournaments: any[];
}

export default function Carousel({ title, tournaments }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tournaments]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340 + 16; // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="text-title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              style={{ 
                width: 32, height: 32, borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'default', opacity: canScrollLeft ? 1 : 0.3
              }}
            >
              ←
            </button>
            <button 
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              style={{ 
                width: 32, height: 32, borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'default', opacity: canScrollRight ? 1 : 0.3
              }}
            >
              →
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
            View all
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="carousel-row"
      >
        {tournaments.map((t, i) => (
          <div key={`${t.id}-${i}`} className="carousel-item">
            <TournamentCard tournament={t} />
          </div>
        ))}
      </div>
    </section>
  );
}
