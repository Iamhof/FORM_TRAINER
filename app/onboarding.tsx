import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'See Your Progress',
    description: 'Watch your strength grow with detailed analytics and progress tracking',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  },
  {
    id: '2',
    title: 'Build Your Perfect Programme',
    description: 'Create custom training programmes tailored to your goals with our step-by-step builder',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  },
  {
    id: '3',
    title: 'Track Every Rep',
    description: 'Log your workouts with precision and let our smart rest timer keep you on track',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  },
  {
    id: '4',
    title: 'Fitness, Just the Way You Like It',
    description: 'Tailored routines, exciting moves, and the tools to crush your goals—every step of the way',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { accent } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);

  const handleSkip = () => {
    router.replace('/auth');
  };

  const handleContinue = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const SLIDE_THRESHOLD = SCREEN_WIDTH - 64 - 56;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsSliding(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(0, Math.min(gestureState.dx, SLIDE_THRESHOLD));
        slideX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SLIDE_THRESHOLD * 0.7) {
          Animated.spring(slideX, {
            toValue: SLIDE_THRESHOLD,
            useNativeDriver: true,
          }).start(() => {
            router.replace('/auth');
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start(() => {
            setIsSliding(false);
          });
        }
      },
    })
  ).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <View style={styles.imageOverlay} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.description, { color: COLORS.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: index === currentIndex ? accent : COLORS.textSecondary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };



  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: COLORS.textSecondary }]}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      {renderPagination()}

      {currentIndex === slides.length - 1 ? (
        <View style={[styles.slideContainer, { borderColor: accent }]}>
          <Text style={[styles.slideText, { color: accent }]}>Slide to Get Started</Text>
          <Animated.View
            style={[
              styles.slider,
              { backgroundColor: accent, transform: [{ translateX: slideX }] },
            ]}
            {...panResponder.panHandlers}
          >
            <ChevronRight size={24} color={COLORS.background} />
          </Animated.View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.continueButton, { borderColor: accent }]}
          onPress={handleContinue}
        >
          <View style={styles.continueButtonContent}>
            <Text style={[styles.continueButtonText, { color: accent }]}>Continue</Text>
            <ChevronRight size={18} color={accent} />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.poweredBy}>
        Powered by <Text style={{ color: accent }}>OJ Gyms</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    position: 'absolute',
    bottom: 280,
    left: 32,
    right: 32,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.md,
    lineHeight: 56,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  continueButton: {
    position: 'absolute',
    bottom: 120,
    left: 32,
    right: 32,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  slideContainer: {
    position: 'absolute',
    bottom: 120,
    left: 32,
    right: 32,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  slider: {
    position: 'absolute',
    left: 0,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  poweredBy: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
