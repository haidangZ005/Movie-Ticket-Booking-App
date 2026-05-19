import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import showService, { Seat, ShowInfo } from '../../services/showService';

type RouteParams = {
  SeatSelection: {
    showId: number;
    movieId?: number;
    movieTitle?: string;
    cinemaId?: number;
    cinemaName?: string;
    hallId?: number;
    hallName?: string;
    showDate?: string;
    showTime?: string;
    endTime?: string;
    format?: string;
    basePrice?: number;
  };
};

const SeatSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'SeatSelection'>>();
  const { showId } = route.params || { showId: 1 };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  useEffect(() => {
    loadSeats();
  }, [showId]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await showService.getSeats(showId);
      if (res && res.data) {
        setShowInfo(res.data.showInfo);
        setSeats(res.data.seats || []);
      }
    } catch (err: any) {
      console.log('Không thể tải sơ đồ ghế', err);
      // Fallback or error state
      setError('Rất tiếc! Không thể tải sơ đồ ghế lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const groupedSeats = useMemo(() => {
    if (!seats.length) return [];
    
    // Tìm max RowIndex và ColIndex để tạo grid
    let maxRow = 0;
    let maxCol = 0;
    seats.forEach(s => {
      if (s.RowIndex > maxRow) maxRow = s.RowIndex;
      if (s.ColIndex > maxCol) maxCol = s.ColIndex;
    });

    const grid: (Seat | null)[][] = [];
    for (let r = 1; r <= maxRow; r++) {
      const rowArr: (Seat | null)[] = [];
      for (let c = 1; c <= maxCol; c++) {
        const found = seats.find(s => s.RowIndex === r && s.ColIndex === c);
        rowArr.push(found || null);
      }
      // Chỉ push vào grid những row có ít nhất 1 ghế ko phải space
      if (rowArr.some(s => s !== null)) {
        grid.push(rowArr);
      }
    }
    return grid;
  }, [seats]);

  const toggleSeat = (seat: Seat) => {
    if (seat.IsAisle || seat.Status === 'BOOKED' || seat.Status === 'HOLDING' || seat.SeatType === 'EMPTY') {
      return; // Không cho click
    }

    const isSelected = selectedSeats.some(s => s.SeatID === seat.SeatID);
    
    // Handle Couple seats
    if (seat.SeatType === 'COUPLE' && seat.PairID) {
      const pairSeat = seats.find(s => s.PairID === seat.PairID && s.SeatID !== seat.SeatID);
      
      if (pairSeat && (pairSeat.Status === 'BOOKED' || pairSeat.Status === 'HOLDING')) {
        Alert.alert('Không thể chọn', 'Cặp ghế này đã có người chọn một nửa.');
        return;
      }

      if (isSelected) {
        // Deselect both
        setSelectedSeats(prev => prev.filter(s => s.SeatID !== seat.SeatID && s.SeatID !== pairSeat?.SeatID));
      } else {
        // Select both
        const newSelection = [...selectedSeats, seat];
        if (pairSeat) newSelection.push(pairSeat);
        if (newSelection.length > 8) {
          Alert.alert('Giới hạn', 'Bạn chỉ có thể chọn tối đa 8 ghế.');
          return;
        }
        setSelectedSeats(newSelection);
      }
      return;
    }

    // Normal seats
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.SeatID !== seat.SeatID));
    } else {
      if (selectedSeats.length >= 8) {
        Alert.alert('Giới hạn', 'Bạn chỉ có thể chọn tối đa 8 ghế.');
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const getRowLabel = (rowIndex: number) => {
    return String.fromCharCode(64 + rowIndex); // 1->A, 2->B...
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const totalPrice = useMemo(() => {
    if (!showInfo) return 0;
    return selectedSeats.reduce((sum, seat) => sum + showInfo.BasePrice + (seat.SeatPrice || 0), 0);
  }, [selectedSeats, showInfo]);

  const handleContinue = () => {
    if (selectedSeats.length === 0 || !showInfo) return;
    // Đi tiếp màn thanh toán / bắp nước
    navigation.navigate('ComboScreen', {
      showInfo,
      selectedSeats,
      totalPrice
    });
  };

  const getSeatStyle = (seat: Seat, isSelected: boolean) => {
    if (isSelected) {
      return [styles.seat, styles.seatSelected];
    }
    if (seat.Status === 'BOOKED') {
      return [styles.seat, styles.seatBooked];
    }
    if (seat.Status === 'HOLDING') {
      return [styles.seat, styles.seatHolding];
    }
    if (seat.SeatType === 'VIP') {
      return [styles.seat, styles.seatVIP];
    }
    if (seat.SeatType === 'COUPLE') {
      return [styles.seat, styles.seatCouple]; // Might span wider logic later
    }
    return [styles.seat, styles.seatStandard];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !showInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin suất chiếu.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSeats}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{showInfo.MovieTitle}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {showInfo.CinemaName} - {showInfo.HallName} - {showInfo.ShowTime.substring(0, 5)}
          </Text>
        </View>
      </View>

      {/* Screen area */}
      <View style={styles.screenArea}>
        <View style={styles.screenCurve} />
        <Text style={styles.screenText}>MÀN HÌNH</Text>
      </View>

      {/* Seat layout */}
      <ScrollView style={styles.mapContainer} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapInner}>
          <View style={styles.grid}>
            {groupedSeats.map((row, rIdx) => {
              const actualRowIndex = row.find(s => s !== null)?.RowIndex || (rIdx + 1);
              return (
                <View key={`row-${rIdx}`} style={styles.row}>
                  <Text style={styles.rowLabel}>{getRowLabel(actualRowIndex)}</Text>
                  <View style={styles.seatsContainer}>
                    {row.map((seat, cIdx) => {
                      if (!seat || seat.IsAisle || seat.SeatType === 'EMPTY') {
                        return <View key={`empty-${rIdx}-${cIdx}`} style={styles.seatEmpty} />;
                      }

                      const isSelected = selectedSeats.some(s => s.SeatID === seat.SeatID);
                      const isBooked = seat.Status === 'BOOKED';
                      const isHolding = seat.Status === 'HOLDING';

                      return (
                        <TouchableOpacity
                          key={seat.SeatID}
                          activeOpacity={0.7}
                          style={getSeatStyle(seat, isSelected)}
                          onPress={() => toggleSeat(seat)}
                        >
                          <Text style={[
                            styles.seatText,
                            isSelected && styles.seatTextSelected,
                            (isBooked || isHolding) && styles.seatTextDisabled
                          ]}>
                            {seat.SeatNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, styles.seatStandard]} />
          <Text style={styles.legendText}>Ghế thường</Text>
          
          <View style={[styles.legendBox, styles.seatVIP]} />
          <Text style={styles.legendText}>Ghế VIP</Text>
          
          <View style={[styles.legendBox, styles.seatCouple]} />
          <Text style={styles.legendText}>Ghế đôi</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, styles.seatSelected]} />
          <Text style={styles.legendText}>Đang chọn</Text>
          
          <View style={[styles.legendBox, styles.seatBooked]} />
          <Text style={styles.legendText}>Đã đặt</Text>

          <View style={[styles.legendBox, styles.seatHolding]} />
          <Text style={styles.legendText}>Đang giữ</Text>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.selectedCountText}>
            {selectedSeats.length > 0 
              ? `${selectedSeats.length} Ghế`
              : 'Chưa chọn ghế nào'}
          </Text>
          {selectedSeats.length > 0 && (
            <Text style={styles.selectedListText} numberOfLines={1}>
              {selectedSeats.map(s => s.SeatNumber).join(', ')}
            </Text>
          )}
        </View>
        <View style={styles.bottomRight}>
          {selectedSeats.length > 0 && (
            <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>
          )}
          <TouchableOpacity 
            style={[styles.continueBtn, selectedSeats.length === 0 && styles.continueBtnDisabled]}
            disabled={selectedSeats.length === 0}
            onPress={handleContinue}
          >
            <Text style={[styles.continueBtnText, selectedSeats.length === 0 && styles.continueBtnTextDisabled]}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SeatSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  backBtn: {
    paddingRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.textMuted,
    marginTop: 16,
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  screenArea: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  screenCurve: {
    width: '80%',
    height: 40,
    borderTopWidth: 4,
    borderColor: Colors.primary,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    opacity: 0.8,
  },
  screenText: {
    position: 'absolute',
    top: 35,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  mapContainer: {
    flex: 1,
  },
  mapInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minWidth: '100%',
  },
  grid: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    width: 24,
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 10,
  },
  seatsContainer: {
    flexDirection: 'row',
  },
  seat: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  seatEmpty: {
    width: 34,
    height: 34,
    marginHorizontal: 5,
  },
  seatStandard: {
    backgroundColor: '#2A2A3E',
    borderColor: '#3A3A4E',
  },
  seatVIP: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: Colors.primary,
  },
  seatCouple: {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    borderColor: '#e91e63', // specific color for couple easily distinguishable
  },
  seatSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  seatBooked: {
    backgroundColor: '#1E1E2C',
    borderColor: '#1E1E2C',
    opacity: 0.6,
  },
  seatHolding: {
    backgroundColor: 'transparent',
    borderColor: '#555',
    borderStyle: 'dashed',
  },
  seatText: {
    fontSize: 10,
    color: '#CCC',
    fontWeight: '600',
  },
  seatTextSelected: {
    color: '#000',
  },
  seatTextDisabled: {
    color: '#555',
  },
  legendContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomInfo: {
    flex: 1,
  },
  selectedCountText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  selectedListText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  bottomRight: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.card,
  },
  continueBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  continueBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
