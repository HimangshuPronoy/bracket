'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useRouter } from 'next/navigation';

export function ClientTournamentLoader({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchTournament() {
      const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single();
      
      if (error || !data) {
        notFound();
      } else {
        setLoading(false);
      }
    }
    
    fetchTournament();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading tournament data...
      </div>
    );
  }

  return (
    <div style={{ padding: 100, textAlign: 'center' }}>
      <h2 className="text-display">Draft Tournament</h2>
      <p className="text-secondary mt-4" style={{ maxWidth: 600, margin: '16px auto' }}>
        This tournament is currently in <strong>Draft</strong> mode. Because you are the organizer and logged in, you can access it, but our servers cannot render the public page yet.
      </p>
      <p className="text-secondary mt-2">
        To view the full interactive tournament page, please go to your <strong>Organizer</strong> dashboard and click <strong>Publish 🚀</strong>.
      </p>
      <button 
        onClick={() => router.push('/organizer')} 
        className="btn btn-primary mt-6"
      >
        Go to Organizer Dashboard
      </button>
    </div>
  );
}
