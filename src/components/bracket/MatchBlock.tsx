import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { tokens } from '@/theme/tokens';
import type { Match, Entrant } from '@/lib/bracket';

interface MatchBlockProps {
  match: Match;
  entrants: Entrant[];
  onPress?: (match: Match) => void;
}

export function MatchBlock({ match, entrants, onPress }: MatchBlockProps) {
  const getEntrant = (id: string | null) =>
    id ? entrants.find((e) => e.id === id) : null;

  const entrantA = getEntrant(match.entrantA);
  const entrantB = getEntrant(match.entrantB);

  const isPending = match.status === 'pending';
  const isCompleted = match.status === 'completed';

  const renderPlayer = (
    entrant: Entrant | null | undefined,
    score: number | null,
    isWinner: boolean,
    isLoser: boolean,
    sourceKind: string
  ) => {
    const isTbd = !entrant;
    let displayName = entrant?.id ?? 'TBD';
    // If it's just the dummy ID, make it look a bit nicer for testing
    if (displayName.startsWith('p') && displayName.length <= 3) {
      displayName = `Player ${displayName.slice(1)}`;
    }

    return (
      <View style={[styles.playerRow, isLoser && styles.playerRowLoser]}>
        <View style={styles.playerInfo}>
          {entrant?.seed && (
            <Text style={styles.seedText}>{entrant.seed}</Text>
          )}
          <Text
            variant="body"
            weight={isWinner ? '600' : 'normal'}
            color={isTbd ? 'secondaryLabel' : 'label'}
            numberOfLines={1}
            style={styles.playerName}
          >
            {sourceKind === 'bye' ? 'BYE' : displayName}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          {score !== null && (
            <Text variant="body" weight={isWinner ? '600' : 'normal'} color={isLoser ? 'secondaryLabel' : 'label'}>
              {score}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => onPress?.(match)}
      disabled={isPending}
      style={({ pressed }) => [
        styles.container,
        isCompleted && styles.containerCompleted,
        match.status === 'ready' && styles.containerReady,
        pressed && styles.containerPressed,
        isPending && styles.containerPending,
      ]}
    >
      {renderPlayer(
        entrantA,
        match.scoreA,
        match.winnerId === match.entrantA && match.entrantA !== null,
        match.loserId === match.entrantA && match.entrantA !== null,
        match.sourceA.kind
      )}
      <View style={styles.divider} />
      {renderPlayer(
        entrantB,
        match.scoreB,
        match.winnerId === match.entrantB && match.entrantB !== null,
        match.loserId === match.entrantB && match.entrantB !== null,
        match.sourceB.kind
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.card,
    borderWidth: 1,
    borderColor: tokens.colors.separator,
    width: 200,
    overflow: 'hidden',
  },
  containerReady: {
    borderColor: tokens.colors.accent,
    shadowColor: tokens.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerCompleted: {
    opacity: 0.8,
  },
  containerPending: {
    opacity: 0.5,
    backgroundColor: tokens.colors.backgroundGrouped,
  },
  containerPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.s,
    paddingHorizontal: tokens.spacing.m,
    height: 40,
  },
  playerRowLoser: {
    opacity: 0.6,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: tokens.spacing.s,
  },
  seedText: {
    fontSize: 11,
    color: tokens.colors.secondaryLabel,
    fontWeight: '600',
    width: 16,
  },
  playerName: {
    flex: 1,
  },
  scoreContainer: {
    minWidth: 20,
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.separator,
  },
});
