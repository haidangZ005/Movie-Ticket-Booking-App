import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import movieService, { Movie } from '../../services/movieService';
import cinemaService, { Cinema } from '../../services/cinemaService';
import { API_ORIGIN } from '../../config/api';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;
const FALLBACK_MOVIE_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1350&fit=crop';

const resolveImageUrl = (image?: string) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
};

const getPosterImage = (movie?: Movie | null) => resolveImageUrl(movie?.PosterUrl) || FALLBACK_MOVIE_IMAGE;

const formatReleaseDate = (date?: string) => {
  if (!date) return 'Sắp chiếu';
  return new Date(date).toLocaleDateString('vi-VN');
};

const formatRuntime = (minutes?: number) => {
  if (!minutes) return 'Đang cập nhật';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ''}` : `${minutes}m`;
};

const splitPeople = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || [];

export default function MovieDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [movie, setMovie] = useState<Movie | null>(route.params?.movie || null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [cinemaError, setCinemaError] = useState('');
  const [loading, setLoading] = useState(!route.params?.movie);
  const [error, setError] = useState('');

  const movieId = route.params?.movieId || route.params?.movie?.MovieID;

  useEffect(() => {
    if (!movieId || route.params?.movie) return;

    const loadMovieDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await movieService.getMovieById(movieId);
        setMovie(response.data || response);
      } catch (err) {
        console.log('Không thể tải chi tiết phim:', err);
        setError('Không tải được chi tiết phim');
      } finally {
        setLoading(false);
      }
    };

    loadMovieDetail();
  }, [movieId, route.params?.movie]);

  useEffect(() => {
    if (!movieId) return;

    const loadMovieCinemas = async () => {
      try {
        setCinemasLoading(true);
        setCinemaError('');
        const response = await cinemaService.getAll({ limit: 100, movieId });
        const cinemaItems = response.data?.items || response.data || [];
        setCinemas(cinemaItems);
        setSelectedCinema(cinemaItems[0] || null);
      } catch (err) {
        console.log('Không thể tải rạp chiếu phim:', err);
        setCinemaError('Không tải được danh sách rạp chiếu phim này');
        setCinemas([]);
        setSelectedCinema(null);
      } finally {
        setCinemasLoading(false);
      }
    };

    loadMovieCinemas();
  }, [movieId]);

  const directors = splitPeople(movie?.MovieDirector);
  const actors = splitPeople(movie?.MovieActor);

  const goToShowtime = () => {
    if (!movieId || !selectedCinema) {
      setCinemaError('Vui lòng chọn rạp trước khi tiếp tục');
      return;
    }

    navigation.navigate('Showtime', {
      movieId,
      movieTitle: movie?.MovieTitle,
      cinemaId: selectedCinema.CinemaID,
      cinemaName: selectedCinema.CinemaName,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!movie || error) {
    return (
      <View style={styles.centerState}>
        <TouchableOpacity style={styles.backButtonInline} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.emptyTitle}>{error || 'Không tìm thấy phim'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: getPosterImage(movie) }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']} style={styles.heroGradient} />

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCardContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.movieTitle}>{movie.MovieTitle}</Text>
            <Text style={styles.movieMeta}>
              {formatRuntime(movie.MovieRuntime)} - {formatReleaseDate(movie.MovieReleaseDate)}
            </Text>

            <View style={styles.ratingRow}>
              <View style={styles.ratingLeft}>
                <Text style={styles.reviewLabel}>Đánh giá</Text>
                <Ionicons name="star" size={16} color={Colors.primary} style={{ marginHorizontal: 6 }} />
                <Text style={styles.ratingText}>{movie.Rating || 0}</Text>
              </View>

              {movie.TrailerUrl ? (
                <TouchableOpacity style={styles.trailerBtn}>
                  <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.trailerBtnText}>Xem trailer</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thể loại:</Text>
            <Text style={styles.detailValue}>{movie.MovieGenre || 'Đang cập nhật'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngôn ngữ:</Text>
            <Text style={styles.detailValue}>{movie.MovieLanguage || 'Đang cập nhật'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội dung phim</Text>
          <Text style={styles.storylineText}>{movie.MovieDescription || 'Nội dung phim đang được cập nhật.'}</Text>
        </View>

        {directors.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đạo diễn</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {directors.map((director) => (
                <View key={director} style={styles.personCardSmall}>
                  <View style={styles.personAvatar}>
                    <Ionicons name="person" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.personName}>{director}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {actors.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diễn viên</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {actors.map((actor) => (
                <View key={actor} style={styles.personCardLarge}>
                  <View style={styles.personAvatarLarge}>
                    <Ionicons name="person" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.personName}>{actor}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rạp chiếu</Text>
          {cinemasLoading ? (
            <View style={styles.cinemaLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.cinemaLoadingText}>Đang tải rạp chiếu...</Text>
            </View>
          ) : cinemas.length === 0 ? (
            <View style={styles.cinemaEmpty}>
              <Text style={styles.cinemaAddress}>
                {cinemaError || 'Chưa có rạp nào có lịch chiếu phim này'}
              </Text>
            </View>
          ) : (
            cinemas.map((cinema) => {
              const active = selectedCinema?.CinemaID === cinema.CinemaID;
              return (
                <TouchableOpacity
                  key={cinema.CinemaID}
                  style={[styles.cinemaCard, active && styles.cinemaCardActive]}
                  onPress={() => {
                    setSelectedCinema(cinema);
                    setCinemaError('');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.cinemaInfo}>
                    <Text style={styles.cinemaTitle}>{cinema.CinemaName}</Text>
                    <Text style={styles.cinemaAddress} numberOfLines={2}>
                      {[cinema.Address || cinema.CinemaAddress, cinema.District, cinema.CityName]
                        .filter(Boolean)
                        .join(' | ') || 'Địa chỉ đang cập nhật'}
                    </Text>
                  </View>
                  <View style={[styles.cinemaCheck, active && styles.cinemaCheckActive]}>
                    {active ? <Feather name="check" size={14} color="#000000" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {cinemaError && cinemas.length > 0 ? <Text style={styles.cinemaError}>{cinemaError}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedCinema && styles.continueButtonDisabled]}
          onPress={goToShowtime}
        >
          <Text style={styles.continueButtonText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerState: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButtonInline: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContainer: {
    paddingHorizontal: 20,
    marginTop: -80,
  },
  infoCard: {
    backgroundColor: '#1C1B1B',
    borderRadius: 20,
    padding: 20,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  movieMeta: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trailerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    width: 110,
    fontSize: 14,
    color: '#A1A1AA',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  storylineText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  horizontalList: {
    gap: 12,
  },
  personCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 12,
    padding: 8,
    paddingRight: 16,
    minWidth: 140,
  },
  personCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 12,
    padding: 8,
    paddingRight: 16,
    minWidth: 160,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 100,
  },
  cinemaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cinemaCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#251F0F',
  },
  cinemaInfo: {
    flex: 1,
  },
  cinemaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cinemaAddress: {
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 18,
  },
  cinemaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 16,
  },
  cinemaLoadingText: {
    color: '#A1A1AA',
    fontSize: 13,
    marginLeft: 10,
  },
  cinemaEmpty: {
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 16,
  },
  cinemaError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 2,
  },
  cinemaCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  cinemaCheckActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#000000',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
