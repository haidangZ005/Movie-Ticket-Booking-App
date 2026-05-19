import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import cinemaService from '../../services/cinemaService';

interface Showtime {
  ShowID: number;
  CinemaID?: number;
  CinemaName?: string;
  HallID?: number;
  HallName?: string;
  Format?: string;
  ShowDate: string;
  ShowTime: string;
  EndTime?: string;
  BasePrice?: number;
  AvailableSeats?: number;
  TotalSeats?: number;
  MovieID?: number;
  MovieTitle?: string;
}

type RouteParams = {
  Showtime: {
    cinemaId: number;
    cinemaName?: string;
    movieId?: number;
    movieTitle?: string;
  };
};

const TIME_FILTERS = [
  { label: 'Tất cả', min: 0, max: 24 },
  { label: '9:00 - 12:00', min: 9, max: 12 },
  { label: '12:00 - 15:00', min: 12, max: 15 },
  { label: '15:00 - 18:00', min: 15, max: 18 },
  { label: '18:00 - 24:00', min: 18, max: 24 },
];

const ShowtimeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Showtime'>>();
  const { cinemaId, cinemaName, movieId, movieTitle } = route.params || {};
  const [dates, setDates] = useState(generateNext7Days());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(TIME_FILTERS[0]);
  const [shows, setShows] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  useEffect(() => {
    const nextDates = generateNext7Days();
    setDates(nextDates);
    setSelectedDate(nextDates[0].value);
  }, []);

  useEffect(() => {
    if (selectedDate && cinemaId) loadShowtimes(selectedDate);
  }, [selectedDate, cinemaId, movieId]);

  const loadShowtimes = async (date: string) => {
    setLoading(true);
    setSelectedShowId(null);
    try {
      const result = await cinemaService.getShows(Number(cinemaId), date, movieId);
      const apiShows = Array.isArray(result?.data) ? result.data : [];
      setShows(apiShows);
    } catch (error) {
      console.log('Không thể tải suất chiếu:', error);
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredShows = useMemo(() => {
    return shows
      .filter((show) => {
        if (!show.ShowTime) return false;
        if (movieId && show.MovieID && Number(show.MovieID) !== Number(movieId)) return false;
        if (cinemaId && show.CinemaID && Number(show.CinemaID) !== Number(cinemaId)) return false;
        const showHour = parseInt(formatTime(show.ShowTime).split(':')[0], 10);
        return showHour >= selectedTimeFilter.min && showHour < selectedTimeFilter.max;
      })
      .sort((a, b) => formatTime(a.ShowTime).localeCompare(formatTime(b.ShowTime)));
  }, [shows, selectedTimeFilter, movieId, cinemaId]);

  const groupedShows = useMemo(() => {
    const groups: Record<string, Record<string, Showtime[]>> = {};
    filteredShows.forEach((show) => {
      const groupCinemaName = show.CinemaName || cinemaName || 'Rạp đang cập nhật';
      const format = show.Format || '2D';
      if (!groups[groupCinemaName]) groups[groupCinemaName] = {};
      if (!groups[groupCinemaName][format]) groups[groupCinemaName][format] = [];
      groups[groupCinemaName][format].push(show);
    });
    return groups;
  }, [filteredShows, cinemaName]);

  const displayTitle = formatShortTitle(movieTitle || cinemaName || 'Lịch chiếu');

  const openSeatSelection = (show: Showtime) => {
    setSelectedShowId(show.ShowID);
    navigation.navigate('SeatSelection', {
      showId: show.ShowID,
      movieId: show.MovieID || movieId,
      movieTitle: show.MovieTitle || movieTitle,
      cinemaId: show.CinemaID || cinemaId,
      cinemaName: show.CinemaName || cinemaName,
      hallId: show.HallID,
      hallName: show.HallName,
      showDate: show.ShowDate,
      showTime: show.ShowTime,
      endTime: show.EndTime,
      format: show.Format,
      basePrice: show.BasePrice,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayTitle}</Text>
        <Ionicons name="headset-outline" size={24} color={Colors.white} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateListContainer} contentContainerStyle={styles.dateList}>
        {dates.map((date) => {
          const active = selectedDate === date.value;
          return (
            <TouchableOpacity key={date.value} style={[styles.dateChip, active && styles.dateChipActive]} onPress={() => setSelectedDate(date.value)}>
              <Text style={[styles.dateFull, active ? styles.textDateActive : styles.textDateNormal]}>{date.fullDate}</Text>
              <Text style={[styles.dateDayName, active ? styles.textDateActive : styles.textDateNormal]}>{date.dayName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeFilterListContainer} contentContainerStyle={styles.timeFilterList}>
        {TIME_FILTERS.map((filter) => {
          const active = selectedTimeFilter.label === filter.label;
          return (
            <TouchableOpacity key={filter.label} style={[styles.timeFilterChip, active && styles.timeFilterChipActive]} onPress={() => setSelectedTimeFilter(filter)}>
              <Text style={[styles.timeFilterText, active ? styles.textDateActive : styles.textDateNormal]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : Object.keys(groupedShows).length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Không có suất chiếu phù hợp</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {Object.entries(groupedShows).map(([groupCinemaName, formats]) => (
            <View key={groupCinemaName} style={styles.cinemaSection}>
              <View style={styles.cinemaHeader}>
                <Ionicons name="film-outline" size={24} color={Colors.primary} style={styles.cinemaIcon} />
                <Text style={styles.cinemaName}>{groupCinemaName}</Text>
              </View>
              {Object.entries(formats).map(([format, showtimes]) => (
                <View key={format} style={styles.formatGroup}>
                  <Text style={styles.formatTitle}>{format}</Text>
                  <View style={styles.showtimeGrid}>
                    {showtimes.map((show) => {
                      const active = selectedShowId === show.ShowID;
                      return (
                        <TouchableOpacity key={show.ShowID} style={[styles.showtimeCard, active && styles.showtimeCardActive]} onPress={() => openSeatSelection(show)}>
                          <Text style={[styles.showtimeHours, active && styles.textShowtimeActive]}>
                            {formatTime(show.ShowTime)}
                            {show.EndTime ? <Text style={styles.showtimeEnd}>~{formatTime(show.EndTime)}</Text> : null}
                          </Text>
                          <Text style={[styles.showtimeSeats, active && styles.textShowtimeActiveMuted]}>
                            Còn {show.AvailableSeats ?? '-'}/{show.TotalSeats ?? '-'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

function generateNext7Days() {
  const days = [];
  const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    days.push({
      value: date.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hôm nay' : dayNames[date.getDay()],
      day,
      fullDate: `${day}/${month}`,
    });
  }
  return days;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return timeStr.substring(0, 5);
}

function formatShortTitle(title: string) {
  return title.length > 30 ? `${title.substring(0, 30)}...` : title;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { paddingRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, flex: 1, textAlign: 'center' },
  dateListContainer: { flexGrow: 0 },
  dateList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  dateChip: { width: 65, height: 70, borderRadius: 12, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateFull: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  dateDayName: { fontSize: 14, fontWeight: '700' },
  textDateNormal: { color: Colors.textMuted },
  textDateActive: { color: '#000000', fontWeight: 'bold' },
  timeFilterListContainer: { flexGrow: 0 },
  timeFilterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, alignItems: 'center' },
  timeFilterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: 'transparent' },
  timeFilterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeFilterText: { fontSize: 14, fontWeight: '500' },
  content: { flex: 1 },
  cinemaSection: { backgroundColor: Colors.background, marginBottom: 16 },
  cinemaHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  cinemaIcon: { marginRight: 8 },
  cinemaName: { fontSize: 16, fontWeight: '700', color: Colors.white },
  formatGroup: { padding: 16, paddingBottom: 0 },
  formatTitle: { fontSize: 15, fontWeight: '600', color: Colors.white, marginBottom: 12 },
  showtimeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  showtimeCard: { backgroundColor: Colors.card, borderRadius: 8, paddingVertical: 10, width: '31.3%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  showtimeCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(252, 196, 52, 0.1)' },
  showtimeHours: { fontSize: 14, fontWeight: '700', color: Colors.white },
  showtimeEnd: { fontSize: 10, fontWeight: '400', color: Colors.textMuted },
  showtimeSeats: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  textShowtimeActive: { color: Colors.primary },
  textShowtimeActiveMuted: { color: Colors.primary, opacity: 0.8 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textMuted, marginTop: 12, fontSize: 14 },
});

export default ShowtimeScreen;
