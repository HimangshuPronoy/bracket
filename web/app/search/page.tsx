'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TournamentCard from '@/components/TournamentCard';
import { supabase, mapTournament, type MappedTournament } from '@/lib/supabase';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<MappedTournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);

    async function performSearch() {
      try {
        // 1. Try full-text search on the indexed 'fts' column first
        const { data: ftsData, error: ftsErr } = await supabase
          .from('tournaments')
          .select('*')
          .textSearch('fts', trimmed, { type: 'websearch' })
          .order('starts_at', { ascending: true });

        if (!ftsErr && ftsData && ftsData.length > 0) {
          setResults(ftsData.map(mapTournament));
          setLoading(false);
          return;
        }

        // 2. Fallback to sanitized substring match (clean out PostgREST delimiter tokens like commas and parentheses)
        const cleanQuery = trimmed.replace(/[(),]/g, ' ').trim();
        if (cleanQuery) {
          const { data: fallbackData } = await supabase
            .from('tournaments')
            .select('*')
            .or(`name.ilike.%${cleanQuery}%,game.ilike.%${cleanQuery}%`)
            .order('starts_at', { ascending: true });

          setResults((fallbackData || []).map(mapTournament));
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="page-hero" style={{ paddingBottom: 32 }}>
        <h1 className="text-display">Search Results</h1>
        <p className="text-body text-secondary mt-2">
          {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
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

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}><div className="page-hero"><h1 className="text-display">Search Results</h1><p className="text-body text-secondary mt-2">Loading...</p></div></main>}>
      <SearchContent />
    </Suspense>
  );
}
