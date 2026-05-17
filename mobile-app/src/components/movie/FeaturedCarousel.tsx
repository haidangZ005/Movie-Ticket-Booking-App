import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Movie } from '../../services/movieService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 10;

// ============================================
// Props Interface
// ============================================

interface FeaturedCarouselProps {
  movies: Movie[];
  onMoviePress: (movieId: number) => void;
}

// ============================================
// FeaturedCarousel Component — Slider phim nổi bật
// ============================================

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ movies, onMoviePress }) => {
  const flatListRef = useRef<FlatList<Movie>>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Auto-scroll carousel mỗi 4 giây
  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % movies.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [movies.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onMoviePress(item.MovieID)}
    >
      <Image
        source={{ uri: item.PosterUrl || 'https://via.placeholder.com/400x600?text=No+Image' }}
        style={styles.poster}
        resizeMode="cover"
      />
      {/* Overlay thông tin */}
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>{item.MovieTitle}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={16} color={Colors.primary} />
          <Text style={styles.ratingText}>{item.Rating || 'N/A'}</Text>
          <Text style={styles.genreText}> • {item.MovieGenre}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!movies || movies.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => item.MovieID.toString()}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {/* Dot indicators */}
      <View style={styles.dotContainer}>
        {movies.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2 - CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  genreText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});

export default FeaturedCarousel;
