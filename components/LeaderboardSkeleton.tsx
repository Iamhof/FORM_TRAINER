import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';
import Card from '@/components/Card';

export default function LeaderboardSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLeft}>
              <View style={styles.skeletonBadge} />
              <View style={styles.skeletonTextContainer}>
                <View style={[styles.skeletonText, styles.skeletonName]} />
                <View style={[styles.skeletonText, styles.skeletonSubtext]} />
              </View>
            </View>
            <View style={[styles.skeletonText, styles.skeletonValue]} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  skeletonCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  skeletonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  skeletonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBorder,
  },
  skeletonTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
  },
  skeletonName: {
    width: '60%',
  },
  skeletonSubtext: {
    width: '40%',
    height: 12,
  },
  skeletonValue: {
    width: 80,
  },
});


