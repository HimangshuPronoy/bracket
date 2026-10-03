'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TournamentCard from '@/components/TournamentCard';
import { supabase, mapTournament, type MappedTournament } from '@/lib/supabase';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<MappedTournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    supabase
      .from('tournaments')
      .select('*')
      .or(`name.ilike.%${query}%,game.ilike.%${query}%`)
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        setResults((data || []).map(mapTournament));
        setLoading(false);
      });
  }, [query]);

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      
      <div className="page-hero" style={{ paddingBottom: 32 }}>
        <h1 className="text-display">Search Results</h1>
        <p className="text-body text-secondary mt-2">
          {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for &ldquo;${query}&rdquo;`}
        </p>
      </div>

      {!loading && results.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">No tournaments found</h2>
          <p className="empty-desc">Try adjusting your search query or exploring the Discover page.</p>
        </div>
      ) : (
        <div className="grid-3">
          {results.map(t => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

    </main>
  );
}
