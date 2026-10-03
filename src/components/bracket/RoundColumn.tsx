import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { tokens } from '@/theme/tokens';
import type { Match, Entrant } from '@/lib/bracket';
import { MatchBlock } from './MatchBlock';

interface RoundColumnProps {
  roundName: string;
  roundNumber: number; // 1-indexed (1, 2, 3...)
  matches: Match[];
  entrants: Entrant[];
  onMatchPress?: (match: Match) => void;
  baseItemHeight?: number; // Height of the MatchBlock + its base margin
}

export function RoundColumn({
  roundName,
  roundNumber,
  matches,
  entrants,
  onMatchPress,
  baseItemHeight = 100, // 80 block + 20 margin
}: RoundColumnProps) {
  // To keep matches aligned, each match in Round N needs a container 
  // that spans the height of 2^(N-1) base items.
  const multiplier = Math.pow(2, roundNumber - 1);
  const containerHeight = baseItemHeight * multiplier;

  return (
    <View style={styles.column}>
      <View style={styles.header}>
        <Text variant="subheadline" color="secondaryLabel" style={styles.headerText}>
          {roundName}
        </Text>
      </View>
      <View style={styles.matchesContainer}>
        {matches.map((match) => (
          <View
            key={match.id}
            style={[styles.matchWrapper, { height: containerHeight }]}
          >
            <MatchBlock match={match} entrants={entrants} onPress={onMatchPress} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 220, // 200 block + 20 margin
    alignItems: 'center',
  },
  header: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.separator,
    width: '100%',
    marginBottom: tokens.spacing.m,
  },
  headerText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchesContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  matchWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
