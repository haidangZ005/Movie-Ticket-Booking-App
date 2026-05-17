import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/common/BottomNavBar';

const MOCK_TICKETS = [
  {
    id: '1',
    title: 'Avengers: Infinity War',
    time: '14h15\' • 16.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: 'https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_.jpg',
  },
  {
    id: '2',
    title: 'Batman v Superman: Dawn of Justice',
    time: '2h15m • 22.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: 'https://m.media-amazon.com/images/M/MV5BYThjYzE4NDctZTViZC00MDM0LWEwMTAtYjc0MjI5ZTBkNTQ1XkEyXkFqcGc@._V1_.jpg',
  },
  {
    id: '3',
    title: 'Guardians Of The Galaxy',
    time: '14h15\' • 29.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: 'https://m.media-amazon.com/images/M/MV5BMTAwMjU5OTgxNjZeQTJeQWpwZ15BbWU4MDIzMDg0Njcx._V1_.jpg',
  },
];

export default function TicketScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My ticket</Text>
      </View>

      {/* Ticket List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {MOCK_TICKETS.map((ticket) => (
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
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
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
    paddingBottom: 120, // Space for Bottom Nav
    paddingTop: 10,
  },
  
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1B1B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    height: 120,
  },
  poster: {
    width: 80,
    height: '100%',
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
  },
});
