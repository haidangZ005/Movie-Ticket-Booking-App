import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import cinemaService from '../../services/cinemaService';

// ============================================
// Interfaces
// ============================================

interface Showtime {
  ShowtimeID: number;
  ShowDate: string;
  ShowTime: string;
  MovieID: number;
  MovieTitle: string;
  MovieGenre?: string;
  MovieRuntime?: number;
  Rating?: number;
  HallID: number;
  HallName?: string;
  BasePrice?: number;
}

type RouteParams = {
  Showtime: {
    cinemaId: number;
    cinemaName?: string;
  };
};

// ============================================
// ShowtimeScreen — Lịch chiếu theo ngày của rạp
// ============================================

const ShowtimeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Showtime'>>();
  const { cinemaId, cinemaName } = route.params;

  const [shows, setShows] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  // Tạo danh sách 7 ngày từ hôm nay
  const dates = generateNext7Days();

  useEffect(() => {
    loadShowtimes();
  }, [selectedDate]);

  const loadShowtimes = async () => {
    setLoading(true);
    try {
      const result = await cinemaService.getShows(cinemaId, selectedDate);
      setShows(result.data || []);
    } catch (error) {
      console.error('Lỗi tải lịch chiếu:', error);
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  // Nhóm suất chiếu theo phim
  const groupedShows = shows.reduce<Record<string, Showtime[]>>((acc, show) => {
    const key = show.MovieTitle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(show);
    return acc;
  }, {});

  const renderShowtimeItem = ({ item }: { item: Showtime }) => (
    <TouchableOpacity style={styles.timeChip}>
      <Text style={styles.timeText}>{formatTime(item.ShowTime)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{cinemaName || 'Lịch chiếu'}</Text>
          <Text style={styles.headerSubtitle}>Chọn ngày và suất chiếu</Text>
        </View>
      </View>

      {/* Date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      >
        {dates.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
            onPress={() => setSelectedDate(d.value)}
          >
            <Text style={[styles.dateDayName, selectedDate === d.value && styles.dateTextActive]}>
              {d.dayName}
            </Text>
            <Text style={[styles.dateDay, selectedDate === d.value && styles.dateTextActive]}>
              {d.day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Showtimes content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : Object.keys(groupedShows).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Không có suất chiếu nào trong ngày này</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {Object.entries(groupedShows).map(([movieTitle, showtimes]) => (
            <View key={movieTitle} style={styles.movieGroup}>
              <View style={styles.movieHeader}>
                <Text style={styles.movieTitle}>{movieTitle}</Text>
                {showtimes[0]?.MovieGenre && (
                  <Text style={styles.movieGenre}>{showtimes[0].MovieGenre}</Text>
                )}
                {showtimes[0]?.MovieRuntime && (
                  <Text style={styles.movieRuntime}>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    {' '}{showtimes[0].MovieRuntime} phút
                  </Text>
                )}
              </View>
              <FlatList
                data={showtimes}
                renderItem={renderShowtimeItem}
                keyExtractor={(item) => item.ShowtimeID.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeList}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ============================================
// Helper Functions
// ============================================

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function generateNext7Days() {
  const days: { value: string; dayName: string; day: string }[] = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      value: date.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hôm nay' : dayNames[date.getDay()],
      day: date.getDate().toString(),
    });
  }
  return days;
}

function formatTime(time: string): string {
  if (!time) return '';
  // Trả về HH:mm từ chuỗi time
  return time.substring(0, 5);
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dateList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  dateChip: {
    width: 60,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: Colors.primary,
  },
  dateDayName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  dateTextActive: {
    color: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  movieGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  movieHeader: {
    marginBottom: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  movieGenre: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  movieRuntime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timeList: {
    gap: 10,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
});

export default ShowtimeScreen;
