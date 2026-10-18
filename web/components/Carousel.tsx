'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentCard from './TournamentCard';
import { useI18n } from '@/lib/i18n';

interface Props {
  title: string;
  tournaments: any[];
  viewAllHref?: string;
  kicker?: string;
}

export default function Carousel({ title, tournaments, viewAllHref, kicker }: Props) {
  const { t } = useI18n();
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
      const scrollAmount = 340 + 20; // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section style={{ marginBottom: 48 }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          {kicker && <div className="section-kicker">{kicker}</div>}
          <h2 className="text-title" style={{ fontSize: 26 }}>{title}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Circular Navigation Buttons */}
          <div style={{ display: 'flex', gap: 8 }} className="hide-mobile">
            <button 
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              title="Previous"
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: '#FFFFFF', 
                border: '1px solid var(--border)', 
                color: '#0F172A',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'default', 
                opacity: canScrollLeft ? 1 : 0.3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
                fontSize: 16
              }}
            >
              ‹
            </button>
            <button 
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              title="Next"
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: '#FFFFFF', 
                border: '1px solid var(--border)', 
                color: '#0F172A',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'default', 
                opacity: canScrollRight ? 1 : 0.3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
                fontSize: 16
              }}
            >
              ›
            </button>
          </div>

          <Link
            href={viewAllHref || '/search'}
            style={{ 
              fontSize: 12, 
              color: 'var(--text-secondary)', 
              fontWeight: 700, 
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {t('home.viewAll')}
          </Link>
        </div>
      </div>
      
      {/* Scrollable Container */}
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
