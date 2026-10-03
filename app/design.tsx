import React, { useRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  Screen,
  Text,
  Button,
  ListSection,
  ListRow,
  Card,
  Badge,
  Avatar,
  TextField,
  Sheet,
  EmptyState,
  Skeleton,
} from '../src/components/ui';
import { useTheme } from '../src/theme/tokens';
import BottomSheet from '@gorhom/bottom-sheet';

export default function DesignGallery() {
  const { spacing } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentContainerStyle={{ padding: spacing.m, gap: spacing.l }}>
        {/* Typography */}
        <View style={{ gap: spacing.s }}>
          <Text variant="largeTitle">Typography</Text>
          <Text variant="title">Title</Text>
          <Text variant="headline">Headline</Text>
          <Text variant="body">Body</Text>
          <Text variant="subheadline">Subheadline</Text>
          <Text variant="footnote">Footnote</Text>
          <Text variant="caption">Caption</Text>
        </View>

        {/* Buttons */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Buttons</Text>
          <Button label="Primary Button" />
          <Button label="Secondary Button" variant="secondary" />
          <Button label="Destructive Button" variant="destructive" />
          <Button label="Loading Button" loading />
          <Button label="Disabled Button" disabled />
        </View>

        {/* Inputs */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Inputs</Text>
          <TextField label="Standard Input" placeholder="Type something..." />
          <TextField
            label="Error Input"
            placeholder="Type something..."
            error="This field is required"
          />
        </View>

        {/* Lists */}
        <ListSection title="Settings" footer="This is a list section footer.">
          <ListRow label="Profile" value="John Doe" showChevron />
          <ListRow label="Notifications" value="On" showChevron />
          <ListRow label="Theme" value="System" showChevron isLast />
        </ListSection>

        {/* Cards & Avatars */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Cards & Avatars</Text>
          <Card onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
              <Avatar name="John Doe" />
              <View>
                <Text variant="headline">Event Name</Text>
                <Text variant="subheadline" color="secondaryLabel">
                  Oct 24 • Chicago, IL
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Badges */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Badges</Text>
          <View style={{ flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' }}>
            <Badge label="Default" />
            <Badge label="Success" status="success" />
            <Badge label="Warning" status="warning" />
            <Badge label="Destructive" status="destructive" />
          </View>
        </View>

        {/* Skeletons */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Skeletons</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ gap: spacing.s }}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={12} />
            </View>
          </View>
        </View>

        {/* Empty State */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Empty State</Text>
          <EmptyState
            icon="calendar"
            title="No Events"
            description="You don't have any upcoming events."
            actionLabel="Discover Events"
            onAction={() => {}}
          />
        </View>

        {/* Sheet Trigger */}
        <View style={{ gap: spacing.m }}>
          <Text variant="title">Sheet</Text>
          <Button label="Open Sheet" onPress={() => sheetRef.current?.expand()} />
        </View>
      </ScrollView>

      <Sheet ref={sheetRef} snapPoints={['25%', '50%']}>
        <View style={{ padding: spacing.m, alignItems: 'center' }}>
          <Text variant="title">Bottom Sheet Content</Text>
        </View>
      </Sheet>
    </Screen>
  );
}
