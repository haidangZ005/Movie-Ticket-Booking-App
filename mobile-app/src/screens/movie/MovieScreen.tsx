import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/common/BottomNavBar';
import { useNavigation } from '@react-navigation/native';
import { Movie, movieService } from '../../services/movieService';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; // 20px padding left, 20px padding right, 20px gap between columns = 60

export default function MovieScreen() {
  const [activeTab, setActiveTab] = useState('NowPlaying');
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<any>();

  const splitMoviesByReleaseDate = (items: Movie[], tab: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.filter((movie) => {
      if (!movie.releaseDate) return tab === 'NowPlaying';

      const releaseDate = new Date(movie.releaseDate);
      if (Number.isNaN(releaseDate.getTime())) return tab === 'NowPlaying';
      releaseDate.setHours(0, 0, 0, 0);

      return tab === 'ComingSoon' ? releaseDate > today : releaseDate <= today;
    });
  };

  const loadMovies = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const response = await movieService.getMovies({ page: 1, limit: 60 });
      const items = response.data || [];

      setAllMovies(items);
      setMovies(splitMoviesByReleaseDate(items, activeTab));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load movies from API.');
      setAllMovies([]);
      setMovies([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  useEffect(() => {
    setMovies(splitMoviesByReleaseDate(allMovies, activeTab));
  }, [activeTab, allMovies]);

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.movieCard} onPress={() => navigation.navigate('MovieDetail', { movie: item })}>
      <Image source={{ uri: item.image }} style={styles.poster} />
      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.metaRow}>
        <Ionicons name="star" size={14} color={Colors.primary} />
        <Text style={styles.metaText}>{item.rating}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText}>{item.duration}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText}>{item.genre}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'NowPlaying' && styles.tabBtnActive]}
            onPress={() => setActiveTab('NowPlaying')}
          >
            <Text style={[styles.tabText, activeTab === 'NowPlaying' && styles.tabTextActive]}>Now playing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'ComingSoon' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ComingSoon')}
          >
            <Text style={[styles.tabText, activeTab === 'ComingSoon' && styles.tabTextActive]}>Coming soon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovie}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={movies.length > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={() => loadMovies(true)}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {error || (activeTab === 'ComingSoon' ? 'No upcoming movies yet' : 'No now playing movies found')}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadMovies()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bottom Nav */}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  // Tab Switcher
  tabContainerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1B1B',
    borderRadius: 30,
    padding: 4,
    height: 60,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#000000',
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120, // space for bottom nav
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  emptyState: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
  
  // Movie Card
  movieCard: {
    width: COLUMN_WIDTH,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#1C1B1B',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    lineHeight: 22,
    minHeight: 44, // roughly 2 lines to align items
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#E5E5E5',
    marginLeft: 6,
    fontWeight: '400',
  },
});
