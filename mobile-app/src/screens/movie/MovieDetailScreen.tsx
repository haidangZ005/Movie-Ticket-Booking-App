import React, { useEffect, useState, useContext } from 'react';
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
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode, Video } from 'expo-av';
import movieService, { Movie } from '../../services/movieService';
import cinemaService, { Cinema } from '../../services/cinemaService';
import { API_ORIGIN } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;
const FALLBACK_MOVIE_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1350&fit=crop';

const resolveImageUrl = (image?: string) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
};

const getPosterImage = (movie?: Movie | null) => resolveImageUrl(movie?.PosterUrl) || FALLBACK_MOVIE_IMAGE;
const getTrailerUrl = (movie?: Movie | null) => resolveImageUrl(movie?.TrailerUrl);

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

const TrailerPlayerModal = ({
  visible,
  uri,
  title,
  onClose,
}: {
  visible: boolean;
  uri: string;
  title?: string;
  onClose: () => void;
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.trailerModal}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.trailerHeader}>
          <TouchableOpacity style={styles.trailerCloseBtn} onPress={onClose}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.trailerTitle} numberOfLines={1}>{title || 'Trailer'}</Text>
          <View style={styles.trailerHeaderSpacer} />
        </View>

        <View style={styles.trailerPlayerWrap}>
          <Video
            style={styles.trailerVideo}
            source={{ uri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
          />
        </View>
      </View>
    </Modal>
  );
};

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
  const [trailerUrl, setTrailerUrl] = useState('');

  const movieId = route.params?.movieId || route.params?.movie?.MovieID;

  // Review states
  const { isAuthenticated, user } = useContext(AuthContext);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tải danh sách cảm nhận/đánh giá
  const fetchReviews = async (page = 1, append = false) => {
    try {
      setReviewsLoading(true);
      const res = await apiClient.get(`/reviews/movie/${movieId}?page=${page}&limit=10`);
      if (res.data?.success || res.data?.data) {
        const payload = res.data.data || [];
        const items = Array.isArray(payload) ? payload : payload.items || [];
        setReviews(prev => append ? [...prev, ...items] : items);
        setReviewsPage(page);
        setReviewsTotalPages(payload.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.log('Không thể tải cảm nhận phim:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (movieId) {
      fetchReviews(1);
    }
  }, [movieId]);

  // Đăng / Cập nhật đánh giá
  const handlePostReview = async () => {
    if (!userComment.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập cảm nhận của bạn trước khi gửi!');
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await apiClient.post('/reviews', {
        movieId,
        rating: userRating,
        comment: userComment.trim(),
      });
      if (res.data?.success || res.data?.data) {
        Alert.alert('Thành công', 'Cảm nhận của bạn đã được đăng thành công!');
        setUserComment('');
        fetchReviews(1);
        
        // Cập nhật lại thông tin phim để làm mới điểm đánh giá trung bình
        const movieRes = await movieService.getMovieById(movieId);
        setMovie(movieRes.data || movieRes);
      }
    } catch (err: any) {
      console.log('Lỗi đăng cảm nhận:', err);
      Alert.alert('Thất bại', err.response?.data?.message || 'Đăng cảm nhận thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId: number) => {
    Alert.alert(
      'Xóa cảm nhận',
      'Bạn có chắc chắn muốn xóa cảm nhận này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/reviews/${reviewId}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa cảm nhận của bạn.');
                fetchReviews(1);
                
                // Cập nhật lại điểm trung bình của phim
                const movieRes = await movieService.getMovieById(movieId);
                setMovie(movieRes.data || movieRes);
              }
            } catch (err: any) {
              console.log('Lỗi xóa cảm nhận:', err);
              Alert.alert('Thất bại', err.response?.data?.message || 'Không thể xóa cảm nhận');
            }
          },
        },
      ]
    );
  };

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

  const openTrailer = () => {
    const nextTrailerUrl = getTrailerUrl(movie);
    if (!nextTrailerUrl) {
      Alert.alert('Thong bao', 'Phim nay chua co trailer.');
      return;
    }

    setTrailerUrl(nextTrailerUrl);
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
      {trailerUrl ? (
        <TrailerPlayerModal
          visible={!!trailerUrl}
          uri={trailerUrl}
          title={movie.MovieTitle}
          onClose={() => setTrailerUrl('')}
        />
      ) : null}

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
                <TouchableOpacity style={styles.trailerBtn} onPress={openTrailer}>
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

        {/* SECTION ĐÁNH GIÁ & CẢM NHẬN PHIM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá & Cảm nhận</Text>

          {/* Form đăng cảm nhận nếu người dùng đã đăng nhập */}
          {isAuthenticated ? (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>Ý kiến của bạn về bộ phim này:</Text>
              
              {/* Star selector */}
              <View style={styles.starSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setUserRating(star)}
                    style={styles.starPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={userRating >= star ? 'star' : 'star-outline'}
                      size={26}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.starText}>{userRating}/5 Sao</Text>
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Chia sẻ cảm nhận của bạn..."
                placeholderTextColor="#8A8A8A"
                value={userComment}
                onChangeText={setUserComment}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, submittingReview && styles.disabledBtn]}
                onPress={handlePostReview}
                disabled={submittingReview}
                activeOpacity={0.8}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Đăng Cảm Nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginRequiredCard}>
              <Text style={styles.loginRequiredText}>Bạn cần đăng nhập tài khoản để viết cảm nhận về phim.</Text>
              <TouchableOpacity
                style={styles.loginFormBtn}
                onPress={() => navigation.navigate('Welcome')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginFormBtnText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Danh sách cảm nhận */}
          <View style={styles.reviewsList}>
            {reviewsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyReviewsText}>Chưa có cảm nhận nào cho phim này. Hãy là người đầu tiên chia sẻ cảm nhận!</Text>
            ) : (
              reviews.map((rev) => {
                const isMyReview = user && rev.CustomerID === user.CustomerID;
                return (
                  <View key={rev.ReviewID} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.userInfoRow}>
                        <View style={styles.userAvatarIcon}>
                          {rev.AvatarUrl ? (
                            <Image source={{ uri: resolveImageUrl(rev.AvatarUrl) }} style={styles.userAvatarImg} />
                          ) : (
                            <Text style={styles.avatarInitials}>
                              {(rev.FullName || 'User').charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.userNameBlock}>
                          <Text style={styles.reviewUserName}>{rev.FullName || 'Khách hàng'}</Text>
                          <View style={styles.reviewStarsRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Ionicons
                                key={s}
                                name={rev.Rating >= s ? 'star' : 'star-outline'}
                                size={12}
                                color={Colors.primary}
                                style={{ marginRight: 2 }}
                              />
                            ))}
                            <Text style={styles.reviewCardRatingText}>{rev.Rating}/5</Text>
                          </View>
                        </View>
                      </View>

                      {isMyReview ? (
                        <TouchableOpacity
                          style={styles.deleteReviewBtn}
                          onPress={() => handleDeleteReview(rev.ReviewID)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.reviewCommentText}>{rev.Comment}</Text>
                    <Text style={styles.reviewTimeText}>
                      {new Date(rev.CreatedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                );
              })
            )}
            {!reviewsLoading && reviews.length > 0 && reviewsPage < reviewsTotalPages ? (
              <TouchableOpacity
                style={styles.loadMoreReviewsBtn}
                onPress={() => fetchReviews(reviewsPage + 1, true)}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreReviewsText}>Xem thêm cảm nhận</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

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
  trailerModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  trailerHeader: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  trailerCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
  },
  trailerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  trailerHeaderSpacer: {
    width: 42,
  },
  trailerPlayerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  trailerVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
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
  reviewForm: {
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
  },
  formLabel: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  starSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  starPress: {
    padding: 2,
  },
  starText: {
    color: '#A1A1AA',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '600',
  },
  reviewInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 80,
    marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  loginRequiredCard: {
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
  },
  loginRequiredText: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginFormBtn: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  loginFormBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsList: {
    marginTop: 10,
    gap: 12,
  },
  emptyReviewsText: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 10,
  },
  reviewCard: {
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  userNameBlock: {
    flex: 1,
  },
  reviewUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCardRatingText: {
    color: '#71717A',
    fontSize: 10,
    marginLeft: 6,
    fontWeight: '600',
  },
  deleteReviewBtn: {
    padding: 4,
  },
  reviewCommentText: {
    color: '#D4D4D8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewTimeText: {
    color: '#71717A',
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  loadMoreReviewsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#151515',
  },
  loadMoreReviewsText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
