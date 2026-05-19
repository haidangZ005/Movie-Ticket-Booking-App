import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/common/BottomNavBar';
import { useNavigation } from '@react-navigation/native';
import movieService, { Movie } from '../../services/movieService';
import { API_ORIGIN } from '../../config/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;
const FALLBACK_POSTER = 'https://via.placeholder.com/400x600?text=No+Image';

const resolvePosterUrl = (posterUrl?: string) => {
  if (!posterUrl) return FALLBACK_POSTER;
  if (/^https?:\/\//i.test(posterUrl)) return posterUrl;
  return `${API_ORIGIN}${posterUrl.startsWith('/') ? posterUrl : `/${posterUrl}`}`;
};

const formatRuntime = (minutes?: number) => {
  if (!minutes) return 'Đang cập nhật';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${minutes} phút`;
  return `${hours} giờ${remainingMinutes ? ` ${remainingMinutes} phút` : ''}`;
};

const isComingSoon = (releaseDate?: string) => {
  if (!releaseDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  return release > today;
};

export default function MovieScreen() {
  const [activeTab, setActiveTab] = useState<'NowPlaying' | 'ComingSoon'>('NowPlaying');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<any>();

  const loadMovies = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const result = await movieService.getMovies({ limit: 100, isActive: true });
      const movieItems = result?.data?.items || result?.data || result?.items || [];
      setMovies(Array.isArray(movieItems) ? movieItems : []);
    } catch (err: any) {
      console.log('Không thể tải danh sách phim:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách phim');
      setMovies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const displayedMovies = useMemo(() => {
    return movies.filter((movie) => {
      const comingSoon = isComingSoon(movie.MovieReleaseDate);
      return activeTab === 'ComingSoon' ? comingSoon : !comingSoon;
    });
  }, [movies, activeTab]);

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.MovieID, movie: item })}
    >
      <Image source={{ uri: resolvePosterUrl(item.PosterUrl) }} style={styles.poster} resizeMode="cover" />
      <Text style={styles.movieTitle} numberOfLines={2}>{item.MovieTitle}</Text>

      <View style={styles.metaRow}>
        <Ionicons name="star" size={14} color={Colors.primary} />
        <Text style={styles.metaText}>{Number(item.Rating || 0).toFixed(1)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText}>{formatRuntime(item.MovieRuntime)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.metaText} numberOfLines={1}>{item.MovieGenre || 'Đang cập nhật'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Đang tải phim...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.textMuted} />
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMovies()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={displayedMovies}
        renderItem={renderMovie}
        keyExtractor={(item) => String(item.MovieID)}
        numColumns={2}
        contentContainerStyle={[styles.gridContainer, displayedMovies.length === 0 && styles.emptyGridContainer]}
        columnWrapperStyle={displayedMovies.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMovies(true)} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            <Ionicons name="film-outline" size={42} color={Colors.textMuted} />
            <Text style={styles.stateText}>
              {activeTab === 'ComingSoon' ? 'Chưa có phim sắp chiếu' : 'Chưa có phim đang chiếu'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'NowPlaying' && styles.tabBtnActive]}
            onPress={() => setActiveTab('NowPlaying')}
          >
            <Text style={[styles.tabText, activeTab === 'NowPlaying' && styles.tabTextActive]}>Đang chiếu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ComingSoon' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ComingSoon')}
          >
            <Text style={[styles.tabText, activeTab === 'ComingSoon' && styles.tabTextActive]}>Sắp chiếu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderContent()}

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
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
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyGridContainer: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  movieCard: {
    width: COLUMN_WIDTH,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
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
    minHeight: 44,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: '#E5E5E5',
    marginLeft: 6,
    fontWeight: '400',
  },
  stateContainer: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
