import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import BottomNavBar from '../../components/common/BottomNavBar';
import { Movie, movieService } from '../../services/movieService';
import { Cinema, cinemaService } from '../../services/cinemaService';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName = user?.FullName || (user?.Email ? user.Email.split('@')[0] : 'Movie lover');
  const heroMovie = movies[0];

  const loadHomeData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [movieRes, cinemaRes] = await Promise.all([
        movieService.getFeaturedMovies(),
        cinemaService.getCinemas({ page: 1, limit: 3 }),
      ]);
      setMovies(movieRes.data?.length ? movieRes.data : []);
      setCinemas(cinemaRes.data || []);
    } catch (error) {
      if (__DEV__) console.log('[Home] Could not load home data', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const goToHero = () => {
    if (heroMovie) navigation.navigate('MovieDetail', { movie: heroMovie });
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadHomeData(true)} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Welcome back</Text>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={goToHero} style={styles.heroCard}>
            <ImageBackground
              source={{ uri: heroMovie?.image || 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg' }}
              style={styles.heroImage}
              imageStyle={styles.heroImageRadius}
            >
              <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.86)']} style={styles.heroOverlay}>
                <View style={styles.heroPill}>
                  <Ionicons name="sparkles-outline" size={14} color="#000000" />
                  <Text style={styles.heroPillText}>Featured</Text>
                </View>
                <View>
                  <Text style={styles.heroTitle} numberOfLines={2}>{heroMovie?.title || 'Find your next movie'}</Text>
                  <Text style={styles.heroMeta} numberOfLines={1}>
                    {heroMovie ? `${heroMovie.genre} | ${heroMovie.duration}` : 'New releases, tickets, and cinemas'}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Movie')}>
              <Ionicons name="film-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionText}>Movies</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Ticket')}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={23} color="#7DD3FC" />
              <Text style={styles.actionText}>Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="wallet-outline" size={22} color="#FCA5A5" />
              <Text style={styles.actionText}>Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Now playing</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Movie')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieRow}>
            {movies.slice(0, 6).map((movie) => (
              <TouchableOpacity
                key={movie.id}
                style={styles.movieCard}
                activeOpacity={0.86}
                onPress={() => navigation.navigate('MovieDetail', { movie })}
              >
                <Image source={{ uri: movie.image }} style={styles.poster} />
                <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color={COLORS.primary} />
                  <Text style={styles.ratingText}>{movie.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cinemas</Text>
          </View>

          <View style={styles.cinemaList}>
            {cinemas.map((cinema) => (
              <View key={cinema.id} style={styles.cinemaItem}>
                <View style={styles.cinemaIcon}>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.cinemaInfo}>
                  <Text style={styles.cinemaName} numberOfLines={1}>{cinema.name}</Text>
                  <Text style={styles.cinemaAddress} numberOfLines={1}>
                    {[cinema.district, cinema.city].filter(Boolean).join(', ') || cinema.address}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 118 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  userName: { color: COLORS.text, fontSize: 26, fontWeight: '800', maxWidth: 260, marginTop: 4 },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    marginBottom: 18,
  },
  heroImage: { flex: 1 },
  heroImageRadius: { borderRadius: 22 },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: { color: '#000000', fontSize: 12, fontWeight: '800', marginLeft: 5 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', lineHeight: 36 },
  heroMeta: { color: '#E5E5E5', fontSize: 14, fontWeight: '600', marginTop: 8 },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 82,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  sectionLink: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  movieRow: { paddingRight: 20, gap: 14, paddingBottom: 24 },
  movieCard: { width: 138 },
  poster: { width: 138, height: 198, borderRadius: 14, backgroundColor: COLORS.card },
  movieTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', lineHeight: 19, marginTop: 10, minHeight: 38 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginLeft: 5 },
  cinemaList: { gap: 10 },
  cinemaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  cinemaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2414',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cinemaInfo: { flex: 1 },
  cinemaName: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  cinemaAddress: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
});
