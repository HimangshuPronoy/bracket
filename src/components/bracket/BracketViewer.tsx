import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { tokens } from '@/theme/tokens';
import type { StageState, Match, Standing } from '@/lib/bracket';
import { computeStandings } from '@/lib/bracket';
import { RoundColumn } from './RoundColumn';

interface BracketViewerProps {
  stage: StageState;
  onMatchPress?: (match: Match) => void;
}

type TabKey = 'winners' | 'losers' | 'grand_final' | 'standings';

export function BracketViewer({ stage, onMatchPress }: BracketViewerProps) {
  const isDoubleElim = stage.format === 'double_elim';
  const isRoundRobin = stage.format === 'round_robin';

  const defaultTab: TabKey = 'winners';
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  // Build tabs based on format
  const tabs: { key: TabKey; label: string }[] = isDoubleElim
    ? [
        { key: 'winners', label: 'Winners' },
        { key: 'losers', label: 'Losers' },
        { key: 'grand_final', label: 'GF' },
      ]
    : isRoundRobin
    ? [
        { key: 'winners', label: 'Matches' },
        { key: 'standings', label: 'Standings' },
      ]
    : [{ key: 'winners', label: 'Bracket' }];

  // Filter matches by selected tab
  const getMatchesForTab = (tab: TabKey): Match[] => {
    if (tab === 'standings') return [];
    if (tab === 'winners' && !isDoubleElim) {
      // Single elim or RR: show all non-losers matches
      return stage.matches.filter(m => m.side === 'winners' || m.side === null);
    }
    return stage.matches.filter(m => m.side === tab);
  };

  const matches = getMatchesForTab(activeTab);

  // Group matches by round
  const roundsMap: Record<number, Match[]> = {};
  for (const m of matches) {
    if (!roundsMap[m.round]) roundsMap[m.round] = [];
    roundsMap[m.round].push(m);
  }
  const sortedRounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);

  const allRounds = Array.from(new Set(stage.matches.map(m => m.round)));
  const maxWinnersRound = Math.max(...allRounds.filter(r => r > 0), 1);

  const getRoundName = (roundNum: number) => {
    if (roundNum === 0) return 'Grand Final';
    if (roundNum < 0) return `Losers R${Math.abs(roundNum)}`;
    if (roundNum === maxWinnersRound) return 'Finals';
    if (roundNum === maxWinnersRound - 1) return 'Semis';
    if (roundNum === maxWinnersRound - 2) return 'Quarters';
    return `Round ${roundNum}`;
  };

  // Standings view for Round Robin
  const renderStandings = () => {
    const standings = computeStandings(stage);
    return (
      <ScrollView contentContainerStyle={{ padding: tokens.spacing.m }}>
        <View style={styles.standingsHeader}>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, { width: 36 }]}>#</Text>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, { flex: 1 }]}>Player</Text>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>W</Text>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>L</Text>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>GW</Text>
          <Text variant="caption" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>GL</Text>
        </View>
        {standings.map((s: Standing, i: number) => (
          <View key={s.entrantId} style={[styles.standingsRow, i === 0 && styles.topRow]}>
            <Text variant="body" weight="700" style={[styles.cell, { width: 36, color: i === 0 ? tokens.colors.accent : tokens.colors.secondaryLabel }]}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
            </Text>
            <Text variant="body" weight="600" style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{s.entrantId}</Text>
            <Text variant="body" style={[styles.cell, styles.centerCell, { color: tokens.colors.success }]}>{s.wins}</Text>
            <Text variant="body" style={[styles.cell, styles.centerCell, { color: tokens.colors.destructive }]}>{s.losses}</Text>
            <Text variant="body" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>{s.gameWins}</Text>
            <Text variant="body" color="secondaryLabel" style={[styles.cell, styles.centerCell]}>{s.gameLosses}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      {tabs.length > 1 && (
        <View style={[styles.tabBar, { borderBottomColor: tokens.colors.separator }]}>
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                activeTab === tab.key && [styles.activeTab, { borderBottomColor: tokens.colors.accent }],
              ]}
            >
              <Text
                variant="subheadline"
                weight={activeTab === tab.key ? '700' : undefined}
                color={activeTab === tab.key ? 'label' : 'secondaryLabel'}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Content */}
      {activeTab === 'standings' ? (
        renderStandings()
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.bracketContainer}>
            {sortedRounds.map((roundNumber, rIdx) => {
              const roundMatches = roundsMap[roundNumber].sort((a, b) => a.position - b.position);
              return (
                <RoundColumn
                  key={`round-${roundNumber}`}
                  roundNumber={Math.max(rIdx + 1, 1)}
                  roundName={getRoundName(roundNumber)}
                  matches={roundMatches}
                  entrants={stage.entrants}
                  onMatchPress={onMatchPress}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: tokens.spacing.m,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: tokens.spacing.m,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {},
  scrollContainer: {
    padding: tokens.spacing.m,
  },
  bracketContainer: {
    flexDirection: 'row',
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.separator,
    marginBottom: 4,
  },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.separator,
    alignItems: 'center',
  },
  topRow: {
    backgroundColor: 'rgba(0,200,150,0.06)',
  },
  cell: {
    paddingHorizontal: 4,
  },
  centerCell: {
    width: 36,
    textAlign: 'center',
  },
});
