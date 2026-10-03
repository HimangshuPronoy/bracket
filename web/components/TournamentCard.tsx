import Link from 'next/link';
interface Props {
  tournament: any;
}

export default function TournamentCard({ tournament }: Props) {
  return (
    <Link href={`/tournament/${tournament.id}`} className="card card-interactive" style={{ display: 'block', padding: 0, textDecoration: 'none' }}>
      {/* Thumbnail Container */}
      <div style={{ position: 'relative', width: '100%', height: 160 }}>
        <img
          src={tournament.imageUrl}
          alt={tournament.name}
          className="card-thumbnail"
        />
        {/* Floating Registration Badge */}
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
          {tournament.registrationOpen ? (
            <span style={{ background: 'var(--success)', color: '#000', padding: '4px 8px', fontSize: 12, fontWeight: 700, borderRadius: 4 }}>
              Registration Open
            </span>
          ) : (
            <span style={{ background: 'var(--danger)', color: '#fff', padding: '4px 8px', fontSize: 12, fontWeight: 700, borderRadius: 4 }}>
              Registration Closed
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
          {tournament.thumbnailUrl && !tournament.thumbnailUrl.includes('images.unsplash.com') && (
            <img 
              src={tournament.thumbnailUrl} 
              alt="Thumbnail"
              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, backgroundColor: 'var(--border)' }}
            />
          )}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 4 }}>
              {tournament.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              {tournament.game}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <span style={{ opacity: 0.7 }}>📅</span> {tournament.date}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            <span style={{ opacity: 0.7 }}>{tournament.isOnline ? '🌐' : '📍'}</span> {tournament.location}
          </div>
          {tournament.registrationFee === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
              ✅ Free Entry
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              💳 ${tournament.registrationFee} USD
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
