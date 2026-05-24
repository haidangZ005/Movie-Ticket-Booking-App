import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, FlatList, Dimensions, Animated, TextInput,
  NativeSyntheticEvent, NativeScrollEvent, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { AuthContext } from '../../context/AuthContext';
import BottomNavBar from '../../components/common/BottomNavBar';
import movieService from '../../services/movieService';
import { API_ORIGIN } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;

// Now Playing carousel dimensions
const NOW_PLAYING_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const NOW_PLAYING_CARD_MARGIN = 8;
const NOW_PLAYING_SNAP = NOW_PLAYING_CARD_WIDTH + NOW_PLAYING_CARD_MARGIN * 2;
const NOW_PLAYING_SIDE = (SCREEN_WIDTH - NOW_PLAYING_CARD_WIDTH) / 2 - NOW_PLAYING_CARD_MARGIN;

// Coming soon card dimensions
const COMING_SOON_CARD_WIDTH = 170;

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop';

const resolveImageUrl = (image?: string) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
};
const getPosterImage = (movie: any) => resolveImageUrl(movie?.PosterUrl) || FALLBACK_POSTER;

const formatRuntime = (minutes?: number) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}m`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

// ─── Static data for sections without backend API ───
const PROMO_BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800&h=400&fit=crop',
    title: 'Giảm 30% vé xem phim',
    subtitle: 'Áp dụng cho thành viên mới',
    color: '#E53935',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=400&fit=crop',
    title: 'Combo bắp nước 49K',
    subtitle: 'Mua vé kèm combo siêu tiết kiệm',
    color: '#1565C0',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=400&fit=crop',
    title: 'Thứ 3 vui vẻ - Giá 45K',
    subtitle: 'Mỗi thứ 3 hàng tuần',
    color: '#2E7D32',
  },
];

const SERVICE_ITEMS = [
  { id: 1, label: 'Rental', icon: 'film-outline' as const },
  { id: 2, label: 'IMAX', icon: 'tv-outline' as const },
  { id: 3, label: '4DX', icon: 'cube-outline' as const },
  { id: 4, label: 'Sweetbox', icon: 'heart-outline' as const },
];

// ─── Section Header component ───
const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
        <Text style={styles.seeAllText}>Xem tất cả</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
);

export default function HomeScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState<any[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const displayName = user?.FullName || user?.Email?.split('@')[0] || 'Khách hàng';

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
      console.log('Không thể tải danh sách phim:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, []);

  const nowPlayingData = featuredMovies.length > 0 ? featuredMovies : movies.slice(0, 5);
  const comingSoonData = movies.slice(0, 6); // all movies as coming soon for demo

  const onNowPlayingScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / NOW_PLAYING_SNAP);
    setActiveSlide(idx);
  };

  // ─── Now Playing Card ───
  const renderNowPlayingCard = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * NOW_PLAYING_SNAP,
      index * NOW_PLAYING_SNAP,
      (index + 1) * NOW_PLAYING_SNAP,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.88, 1, 0.88],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.nowPlayingCard, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MovieDetail', { movieId: item.MovieID })}
        >
          <Image source={{ uri: getPosterImage(item) }} style={styles.nowPlayingPoster} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Coming Soon Card ───
  const renderComingSoonCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.comingSoonCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.MovieID })}
    >
      <Image source={{ uri: getPosterImage(item) }} style={styles.comingSoonPoster} />
      <View style={styles.comingSoonInfo}>
        <Text style={styles.comingSoonTitle} numberOfLines={2}>{item.MovieTitle}</Text>
        <View style={styles.comingSoonMeta}>
          <Ionicons name="videocam-outline" size={13} color={COLORS.muted} />
          <Text style={styles.comingSoonMetaText} numberOfLines={1}>{item.MovieGenre || 'Phim'}</Text>
        </View>
        <View style={styles.comingSoonMeta}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.muted} />
          <Text style={styles.comingSoonMetaText}>{formatDate(item.MovieReleaseDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Promo Card ───
  const renderPromoCard = ({ item }: { item: typeof PROMO_BANNERS[0] }) => (
    <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.promoBg} />
      <View style={[styles.promoOverlay, { backgroundColor: item.color + 'CC' }]}>
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>{item.title}</Text>
          <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeMovie = nowPlayingData[activeSlide];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ═══ HEADER ═══ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Chào, {displayName} 👋</Text>
            <Text style={styles.headerWelcome}>Chào mừng trở lại</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notification')}
          >
            <Ionicons name="notifications" size={22} color={COLORS.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* ═══ SEARCH BAR ═══ */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Movie')}
        >
          <Ionicons name="search-outline" size={20} color="#8C8C8C" />
          <Text style={styles.searchPlaceholder}>Tìm kiếm</Text>
        </TouchableOpacity>

        {/* ═══ NOW PLAYING ═══ */}
        <SectionHeader title="Đang chiếu" onSeeAll={() => navigation.navigate('Movie')} />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : nowPlayingData.length > 0 ? (
          <View>
            <Animated.FlatList
              data={nowPlayingData}
              keyExtractor={(item: any) => `np-${item.MovieID}`}
              renderItem={renderNowPlayingCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={NOW_PLAYING_SNAP}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: NOW_PLAYING_SIDE }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true, listener: onNowPlayingScroll }
              )}
              scrollEventThrottle={16}
            />

            {/* Movie info below poster */}
            {activeMovie && (
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle}>{activeMovie.MovieTitle}</Text>
                <Text style={styles.nowPlayingMeta}>
                  {formatRuntime(activeMovie.MovieRuntime)}
                  {activeMovie.MovieGenre ? ` • ${activeMovie.MovieGenre}` : ''}
                </Text>
                {activeMovie.Rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={COLORS.primary} />
                    <Text style={styles.ratingText}>
                      {Number(activeMovie.Rating).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
              <View style={styles.dotsTrack}>
                {nowPlayingData.map((_: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeSlide === i ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Chưa có phim nào</Text>
        )}

        {/* ═══ COMING SOON ═══ */}
        <SectionHeader title="Sắp chiếu" onSeeAll={() => navigation.navigate('Movie')} />
        {comingSoonData.length > 0 ? (
          <FlatList
            data={comingSoonData}
            keyExtractor={(item: any) => `cs-${item.MovieID}`}
            renderItem={renderComingSoonCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
            ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          />
        ) : (
          <Text style={styles.emptyText}>Chưa có phim sắp chiếu</Text>
        )}

        {/* ═══ PROMO & DISCOUNT ═══ */}
        <SectionHeader title="Ưu đãi & Giảm giá" onSeeAll={() => {}} />
        <FlatList
          data={PROMO_BANNERS}
          keyExtractor={(item) => `promo-${item.id}`}
          renderItem={renderPromoCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
        />

        {/* ═══ SERVICE ═══ */}
        <SectionHeader title="Dịch vụ" onSeeAll={() => {}} />
        <View style={styles.serviceRow}>
          {SERVICE_ITEMS.map((svc) => (
            <TouchableOpacity key={svc.id} style={styles.serviceItem} activeOpacity={0.7}>
              <View style={styles.serviceCircle}>
                <Ionicons name={svc.icon} size={30} color={COLORS.text} />
              </View>
              <Text style={styles.serviceLabel}>{svc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacer for nav bar */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomNavBar />
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  headerWelcome: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2EF536',
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 28,
    gap: 12,
  },
  searchPlaceholder: {
    color: '#8C8C8C',
    fontSize: 16,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 18,
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '400',
  },

  // ── Now Playing Carousel ──
  nowPlayingCard: {
    width: NOW_PLAYING_CARD_WIDTH,
    marginHorizontal: NOW_PLAYING_CARD_MARGIN,
  },
  nowPlayingPoster: {
    width: '100%',
    height: NOW_PLAYING_CARD_WIDTH * 1.42,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  nowPlayingInfo: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  nowPlayingTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  nowPlayingMeta: {
    color: '#BFBFBF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Dots ──
  dotsContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  dotsTrack: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#2E2E2E',
    borderRadius: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#555',
  },

  // ── Coming Soon ──
  comingSoonCard: {
    width: COMING_SOON_CARD_WIDTH,
  },
  comingSoonPoster: {
    width: COMING_SOON_CARD_WIDTH,
    height: COMING_SOON_CARD_WIDTH * 1.42,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginBottom: 12,
  },
  comingSoonInfo: {
    gap: 6,
  },
  comingSoonTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  comingSoonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comingSoonMetaText: {
    color: '#DEDEDE',
    fontSize: 12,
    flex: 1,
  },

  // ── Promo & Discount ──
  promoCard: {
    width: SCREEN_WIDTH * 0.82,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  promoBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  promoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  promoContent: {},
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },

  // ── Service ──
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 8,
  },
  serviceItem: {
    alignItems: 'center',
    gap: 12,
  },
  serviceCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  serviceLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Misc ──
  loadingBox: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 15,
  },
});
