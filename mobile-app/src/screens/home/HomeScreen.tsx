import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import BottomNavBar from '../../components/common/BottomNavBar';
import movieService from '../../services/movieService';
import { API_ORIGIN } from '../../config/api';

const FALLBACK_MOVIE_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1350&fit=crop';

const resolveImageUrl = (image?: string) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
};

const getPosterImage = (movie: any) => resolveImageUrl(movie?.PosterUrl) || FALLBACK_MOVIE_IMAGE;

export default function HomeScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState<any[]>([])
  const [featuredMovies, setFeaturedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.FullName || user?.Email?.split('@')[0] || 'OTHERh hàng';

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const [movieRes, featuredRes] = await Promise.all([
        movieService.getMovies({ limit: 10, isActive: true }),
        movieService.getFeaturedMovies(),
      ]);

      setMovies(movieRes.data?.items || movieRes.data || []);
      setFeaturedMovies(featuredRes.data?.items || featuredRes.data || []);
    } catch (error) {
      console.log('Không thể tải danh s?ch phim:', error);
    } finally {
      setLoading(false);
    }
  };

  const heroMovie = featuredMovies[0] || movies[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào, {displayName}</Text>
            <Text style={styles.subtitle}>Đặt vé xem phim tiếp theo của bạn</Text>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" />
        ) : heroMovie ? (
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MovieDetail', { movieId: heroMovie.MovieID })}
          >
            <Image source={{ uri: getPosterImage(heroMovie) }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroKicker}>Đang chiếu</Text>
              <Text style={styles.heroTitle}>{heroMovie.MovieTitle}</Text>
              <Text style={styles.heroMeta}>{heroMovie.MovieGenre}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>Chưa có phim nào</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Movie')}>
            <Text style={styles.sectionLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.movieRow}>
          {movies.slice(0, 4).map((movie) => (
            <TouchableOpacity
              key={movie.MovieID}
              style={styles.movieCard}
              onPress={() => navigation.navigate('MovieDetail', { movieId: movie.MovieID })}
            >
              <Image source={{ uri: getPosterImage(movie) }} style={styles.poster} />
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie.MovieTitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  heroCard: { height: 280, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.card, marginBottom: 20 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  heroKicker: { color: COLORS.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  heroTitle: { color: COLORS.white, fontSize: 26, fontWeight: '900' },
  heroMeta: { color: COLORS.textSecondary, marginTop: 6 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  actionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 12 },
  actionText: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  sectionLink: { color: COLORS.primary, fontWeight: '700' },
  movieRow: { flexDirection: 'row', gap: 14 },
  movieCard: { flex: 1 },
  poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: 16, backgroundColor: COLORS.card },
  movieTitle: { color: COLORS.text, fontWeight: '700', marginTop: 10, lineHeight: 20 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 20, fontSize: 16 },
});
