export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  game: string;
  imageUrl: any; // require() image
  tags: string[];
  isOnline: boolean;
  prizePool: string | null;   // null if no prize
  registrationFee: number;    // 0 = free, >0 = paid (USD)
  organizerName: string;
  descriptionMarkdown?: string;
  videoUrl?: string; // e.g. Youtube embed URL
}

export interface Event {
  id: string;
  tournamentId: string;
  name: string;
  entrantsCount: number;
}

export interface Registration {
  userId: string;
  tournamentId: string;
  eventIds: string[];
}

export interface UserRanking {
  userId: string;
  tournamentId: string;
  eventId: string;
  rank: number;
}

export const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Neo City Clash 2026',
    date: 'Oct 15 - 17, 2026',
    location: 'Neo City Convention Center, Tokyo',
    game: 'Super Fighter V',
    imageUrl: require('../../assets/images/tournaments/neo_city_clash.jpg'),
    tags: ['Featured', 'Upcoming'],
    isOnline: false,
    prizePool: '$5,000',
    registrationFee: 15,
    organizerName: 'Neo City Esports',
    descriptionMarkdown: `
# Welcome to Neo City Clash!
The ultimate futuristic fighting game tournament is back! Get ready for the biggest showdown in **Neo City**. 

## What to expect
- **High-stakes Competition**: Compete against top players from around the globe.
- **Next-Gen Setup**: All setups run on the latest cyber-consoles.
- **Cosplay Contest**: Show off your best cyberpunk outfits and win exclusive merch!

Join the discord community [here](#) and stay updated on latest announcements.
    `,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // generic video for demo
  },
  {
    id: 't2',
    name: 'Weekly Online Smash #42',
    date: 'Oct 10, 2026',
    location: 'Online',
    game: 'Bros. Ultimate',
    imageUrl: require('../../assets/images/tournaments/weekly_online_smash.jpg'),
    tags: ['Online', 'League'],
    isOnline: true,
    prizePool: null,
    registrationFee: 0,
    organizerName: 'SmashWeekly Community',
    descriptionMarkdown: `
# Weekly Online Smash
Welcome to our 42nd weekly online tournament! Grab your controller and join from the comfort of your home.

### Rules
1. **Connection**: Must use a wired LAN connection.
2. **Region**: Locked to NA region for latency reasons.
3. **Check-in**: Check-in starts 30 minutes before bracket.

May the best player win!
    `
  },
  {
    id: 't3',
    name: 'Local Legends: Monthly',
    date: 'Oct 24, 2026',
    location: 'The Arcade Bar, 42 Main St, Downtown',
    game: 'Fighter Z',
    imageUrl: require('../../assets/images/tournaments/local_legends.jpg'),
    tags: ['Upcoming'],
    isOnline: false,
    prizePool: '$250',
    registrationFee: 5,
    organizerName: 'FGC Downtown',
    descriptionMarkdown: `
# Local Legends Monthly
Support your local FGC! 

Join us at **The Arcade Bar** for our monthly meetup and tournament.
Enjoy craft drinks, great food, and intense competition.

> "The best local tournament series in the state!" - Local Legends Champion
    `
  },
  {
    id: 't4',
    name: 'Pro Circuit - Fall Split',
    date: 'Nov 1 - Nov 30, 2026',
    location: 'Online',
    game: 'Super Fighter V',
    imageUrl: require('../../assets/images/tournaments/pro_circuit.jpg'),
    tags: ['Featured', 'League', 'Online'],
    isOnline: true,
    prizePool: '$20,000',
    registrationFee: 25,
    organizerName: 'Global Esports Federation',
    descriptionMarkdown: `
# Pro Circuit - Fall Split
The professional league continues! The top players will battle it out over the month of November to qualify for the Global Finals.

## Format
- Online qualifier rounds
- Top 16 move to playoffs
- Grand finals broadcasted live

**Are you ready to claim the top spot?**
    `
  },
];

export const mockEvents: Event[] = [
  { id: 'e1', tournamentId: 't1', name: 'Singles', entrantsCount: 128 },
  { id: 'e2', tournamentId: 't1', name: 'Doubles', entrantsCount: 32 },
  { id: 'e3', tournamentId: 't2', name: 'Singles', entrantsCount: 256 },
  { id: 'e4', tournamentId: 't3', name: 'Singles', entrantsCount: 64 },
  { id: 'e5', tournamentId: 't4', name: 'Singles', entrantsCount: 512 },
];

export let myRegistrations: Registration[] = [
  { userId: 'me', tournamentId: 't2', eventIds: ['e3'] },
];

export const mockRankings: UserRanking[] = [
  { userId: 'me', tournamentId: 't1', eventId: 'e1', rank: 3 },
  { userId: 'me', tournamentId: 't1', eventId: 'e2', rank: 1 },
  { userId: 'me', tournamentId: 't2', eventId: 'e3', rank: 17 },
  { userId: 'me', tournamentId: 't3', eventId: 'e4', rank: 5 },
];

export function registerForTournament(tournamentId: string, eventIds: string[]) {
  const index = myRegistrations.findIndex(r => r.tournamentId === tournamentId);
  if (index >= 0) {
    myRegistrations[index] = { userId: 'me', tournamentId, eventIds };
  } else {
    myRegistrations.push({ userId: 'me', tournamentId, eventIds });
  }
}
