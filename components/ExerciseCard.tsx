import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '@/types/exercises';
import { COLORS, SPACING } from '@/constants/theme';

interface ExerciseCardProps {
  exercise: Exercise;
}

export const ExerciseCard = React.memo(({ exercise }: ExerciseCardProps) => {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    router.push(`/(tabs)/exercises/${exercise.id}` as any);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`exercise-card-${exercise.id}`}
      >
        <ImageBackground
          source={{ uri: exercise.thumbnail }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',
              'rgba(0, 0, 0, 0.3)',
              'rgba(0, 0, 0, 0.85)'
            ]}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
          >
            <View style={styles.contentContainer}>
              <Text style={styles.exerciseTitle} numberOfLines={2}>
                {exercise.name}
              </Text>
              
              <View style={styles.bottomRow}>
                <View style={styles.tagsContainer}>
                  {exercise.categories.slice(0, 2).map((category, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{category}</Text>
                    </View>
                  ))}
                </View>
                
                <ArrowRight 
                  size={20} 
                  color="white" 
                  style={styles.arrow}
                />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: SPACING.xs,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  contentContainer: {
    gap: SPACING.sm,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: 'rgba(255, 107, 85, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 85, 0.5)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.accents.orange,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  arrow: {
    opacity: 0.9,
  },
});
