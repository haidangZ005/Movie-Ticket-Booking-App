import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const MOVIE_POSTERS = [
  'https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGc@._V1_.jpg',
  'https://m.media-amazon.com/images/M/MV5BMTM0MDgwNjMyMl5BMl5BanBnXkFtZTcwNTg3NzAzMw@@._V1_.jpg',
];

export default function WelcomeCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 60));
    setCurrentSlide(slide);
  };

  return (
    <>
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContent}
        >
          {MOVIE_POSTERS.map((uri, index) => (
            <View key={index} style={styles.posterWrapper}>
              <Image source={{ uri }} style={styles.posterImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.welcomeTextContainer}>
        <Text style={styles.welcomeTitle}>MBooking hello!</Text>
        <Text style={styles.welcomeSubtitle}>Enjoy your favorite movies</Text>
        <View style={styles.dotsRow}>
          {MOVIE_POSTERS.map((_, i) => (
            <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  carouselContainer: { marginTop: 20, height: height * 0.38 },
  carouselContent: { paddingHorizontal: 30 },
  posterWrapper: {
    width: width - 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 0,
  },
  posterImage: { width: '100%', height: '100%', borderRadius: 16 },
  welcomeTextContainer: { alignItems: 'center', marginTop: 16 },
  welcomeTitle: { fontSize: 26, fontWeight: '700', color: Colors.white },
  welcomeSubtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  dotsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },
  dotActive: { width: 24, backgroundColor: Colors.primary },
});
