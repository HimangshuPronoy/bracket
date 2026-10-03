import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetProps, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';

export interface SheetProps extends Omit<BottomSheetProps, 'snapPoints'> {
  snapPoints?: (string | number)[];
  children: React.ReactNode;
}

export const Sheet = forwardRef<BottomSheet, SheetProps>(
  ({ snapPoints = ['50%', '90%'], children, ...rest }, ref) => {
    const { colors, radii } = useTheme();

    const renderBackdrop = React.useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.backgroundGrouped,
          borderRadius: radii.sheet,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.separator,
        }}
        {...rest}
      >
        <View style={styles.contentContainer}>{children}</View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
