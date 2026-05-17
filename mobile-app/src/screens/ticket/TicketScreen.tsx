import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import BottomNavBar from '../../components/common/BottomNavBar';
import { Ticket, ticketService } from '../../services/ticketService';

export default function TicketScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const response = await ticketService.getMyTickets();
      setTickets(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load tickets from API.');
      setTickets([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My ticket</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTickets(true)} tintColor={Colors.primary} />
          }
        >
          {tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{error || 'You do not have any tickets yet.'}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadTickets()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <Image source={{ uri: ticket.image }} style={styles.poster} />
              <View style={styles.ticketInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>{ticket.title}</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{ticket.time}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{ticket.location}</Text>
                </View>

                {ticket.seats ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="albums-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText}>Seats {ticket.seats}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
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
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    minHeight: 120,
  },
  poster: {
    width: 80,
    height: 104,
    borderRadius: 8,
    marginRight: 16,
  },
  ticketInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#E5E5E5',
    marginLeft: 6,
    fontWeight: '400',
    flex: 1,
  },
});
