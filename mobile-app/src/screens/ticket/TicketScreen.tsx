import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import ticketService, { ElectronicTicket } from '../../services/ticketService';
import { API_ORIGIN } from '../../config/api';

const resolvePosterUrl = (posterUrl?: string) => {
  if (!posterUrl) return '';
  if (/^https?:\/\//i.test(posterUrl)) return posterUrl;
  return `${API_ORIGIN}${posterUrl.startsWith('/') ? posterUrl : `/${posterUrl}`}`;
};

const formatDateTime = (date?: string, time?: string) => {
  if (!date && !time) return 'Dang cap nhat';
  const dateText = date ? new Date(date).toLocaleDateString('vi-VN') : '';
  return [time, dateText].filter(Boolean).join(' - ');
};

const formatVND = (value?: number) => {
  if (value === undefined || value === null) return '';
  return `${Number(value).toLocaleString('vi-VN')}d`;
};

const getStatusStyle = (status?: string) => {
  const normalized = String(status || '').toUpperCase();

  if (normalized.includes('CONFIRMED') || normalized.includes('SUCCESS')) {
    return styles.statusConfirmed;
  }

  if (normalized.includes('PENDING') || normalized.includes('HOLDING')) {
    return styles.statusPending;
  }

  if (normalized.includes('CANCEL') || normalized.includes('FAILED') || normalized.includes('EXPIRED')) {
    return styles.statusCancelled;
  }

  return styles.statusPending;
};

export default function TicketScreen() {
  const [tickets, setTickets] = useState<ElectronicTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (err) {
      setError('Khong the tai danh sach ve. Vui long thu lai.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const renderTicket = (ticket: ElectronicTicket) => (
      <View key={ticket._uid} style={styles.ticketCard}>
      {resolvePosterUrl(ticket.PosterUrl) ? (
        <Image source={{ uri: resolvePosterUrl(ticket.PosterUrl) }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Ionicons name="ticket-outline" size={28} color={Colors.textMuted} />
        </View>
      )}

      <View style={styles.ticketInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.movieTitle} numberOfLines={1}>{ticket.MovieTitle}</Text>
          <Text style={[styles.status, getStatusStyle(ticket.BookingStatus)]}>{ticket.BookingStatus}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>{formatDateTime(ticket.ShowDate, ticket.ShowTime)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{ticket.CinemaName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="film-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {ticket.HallName} - Ghe {ticket.Seats || 'dang cap nhat'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.ticketCode}>#{ticket.TicketCode}</Text>
          <Text style={styles.amount}>{formatVND(ticket.TotalAmount)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Ve cua toi</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateText}>Dang tai ve...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTickets(true)} tintColor={Colors.primary} />}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!error && tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.stateText}>Ban chua co ve nao</Text>
            </View>
          ) : (
            tickets.map(renderTicket)
          )}
        </ScrollView>
      )}

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  headerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },

  ticketCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    minHeight: 142,
  },
  poster: {
    width: 82,
    height: 118,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#2A2929',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  movieTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusConfirmed: {
    color: '#062E16',
    backgroundColor: '#35D07F',
  },
  statusPending: {
    color: '#3A2600',
    backgroundColor: '#F5C84C',
  },
  statusCancelled: {
    color: '#FFFFFF',
    backgroundColor: '#E5484D',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#E5E5E5',
    marginLeft: 6,
    fontWeight: '400',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  ticketCode: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#E5E5E5',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
