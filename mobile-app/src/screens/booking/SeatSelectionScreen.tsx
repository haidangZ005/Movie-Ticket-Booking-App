import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import showService, { Seat, ShowInfo } from '../../services/showService';
import bookingService from '../../services/bookingService';
import { getSocket } from '../../services/socketService';
import { AuthContext } from '../../context/AuthContext';

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
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCustomerId = Number(user?.CustomerID || user?.customerId || user?.CustomerId || 0);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    loadSeats();
  }, [showId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_show', { showId });

    const handleSeatUpdate = (payload: any) => {
      if (Number(payload.showId) !== Number(showId)) return;

      setSeats((prevSeats) => prevSeats.map((seat) => {
        if (Number(seat.SeatID) !== Number(payload.seatId)) return seat;

        return {
          ...seat,
          Status: payload.status,
          HoldBy: payload.holdBy ?? null,
          HoldUntil: payload.holdUntil ?? null,
        };
      }));

      if (payload.status === 'BOOKED' || (payload.status === 'HOLDING' && Number(payload.holdBy) !== currentCustomerId)) {
        setSelectedSeats((prevSelected) => prevSelected.filter((seat) => Number(seat.SeatID) !== Number(payload.seatId)));
      }
    };

    socket.on('seat_update', handleSeatUpdate);

    return () => {
      socket.emit('leave_show', { showId });
      socket.off('seat_update', handleSeatUpdate);
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, [showId, currentCustomerId]);

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

  const getBookableRows = (seatList: Seat[]) => {
    const rowMap = new Map<number, Seat[]>();

    seatList.forEach((seat) => {
      if (seat.IsAisle || seat.SeatType === 'EMPTY' || seat.SeatType === 'DISABLED') return;
      const rowSeats = rowMap.get(seat.RowIndex) || [];
      rowSeats.push(seat);
      rowMap.set(seat.RowIndex, rowSeats);
    });

    return Array.from(rowMap.entries()).map(([rowIndex, rowSeats]) => ({
      rowIndex,
      seats: rowSeats.sort((a, b) => a.ColIndex - b.ColIndex),
    }));
  };

  const findSingleSeatGaps = (selectedSeatIds: Set<number>) => {
    const gaps: { rowIndex: number; seatNumber: string; seatId: number }[] = [];

    getBookableRows(seats).forEach(({ rowIndex, seats: rowSeats }) => {
      let availableRun: Seat[] = [];

      const flushRun = () => {
        if (availableRun.length === 1 && rowSeats.length > 1) {
          const [gapSeat] = availableRun;
          gaps.push({
            rowIndex,
            seatNumber: gapSeat.SeatNumber,
            seatId: gapSeat.SeatID,
          });
        }
        availableRun = [];
      };

      rowSeats.forEach((seat, index) => {
        const previousSeat = rowSeats[index - 1];
        const isSeparatedFromPrevious = previousSeat && seat.ColIndex - previousSeat.ColIndex > 1;

        if (isSeparatedFromPrevious) {
          flushRun();
        }

        const isOccupied =
          selectedSeatIds.has(seat.SeatID) ||
          seat.Status === 'BOOKED' ||
          seat.Status === 'HOLDING';

        if (isOccupied) {
          flushRun();
        } else {
          availableRun.push(seat);
        }
      });

      flushRun();
    });

    return gaps;
  };

  const getSingleSeatGapMessage = (nextSelectedSeats: Seat[]) => {
    const originalGaps = new Set(findSingleSeatGaps(new Set()).map((gap) => gap.seatId));
    const nextSelectedSeatIds = new Set(nextSelectedSeats.map((seat) => seat.SeatID));
    const newGaps = findSingleSeatGaps(nextSelectedSeatIds)
      .filter((gap) => !originalGaps.has(gap.seatId));

    if (newGaps.length === 0) return '';

    return `Không được để trống lẻ ghế ${newGaps.map((gap) => gap.seatNumber).join(', ')}. Vui lòng chọn thêm ghế liền kề hoặc đổi vị trí.`;

  };

  const updateSelectedSeats = (nextSelectedSeats: Seat[]) => {
    setSelectedSeats(nextSelectedSeats);
  };

  const singleSeatGapMessage = useMemo(
    () => getSingleSeatGapMessage(selectedSeats),
    [selectedSeats, seats]
  );

  const getCoupleSeats = (seat: Seat, seatList: Seat[]) => {
    if (seat.SeatType !== 'COUPLE' || !seat.PairID) return [seat];
    return seatList.filter(item => item.PairID === seat.PairID);
  };

  const isSeatSelected = (seatId: number) => {
    return selectedSeats.some(item => item.SeatID === seatId);
  };

  const isCoupleSelected = (seat: Seat) => {
    const coupleSeats = getCoupleSeats(seat, seats);
    return coupleSeats.length > 0 && coupleSeats.every(item => isSeatSelected(item.SeatID));
  };

  const isSeatUnavailable = (seat: Seat) => {
    const heldByAnotherCustomer = seat.Status === 'HOLDING' && Number(seat.HoldBy || 0) !== currentCustomerId;
    return seat.Status === 'BOOKED' || heldByAnotherCustomer || seat.SeatType === 'EMPTY' || seat.SeatType === 'DISABLED' || seat.IsAisle;
  };

  const isCoupleUnavailable = (seat: Seat) => {
    const coupleSeats = getCoupleSeats(seat, seats);
    return coupleSeats.some(isSeatUnavailable);
  };

  const handleCoupleSeatPress = (seat: Seat) => {
    const coupleSeats = getCoupleSeats(seat, seats);

    if (coupleSeats.length !== 2) {
      showNotice('Cấu hình ghế đôi chưa hợp lệ.');
      return;
    }

    if (coupleSeats.some(isSeatUnavailable)) {
      showNotice('Một ghế trong cặp đã được đặt hoặc đang được giữ.');
      return;
    }

    const selected = coupleSeats.every(item => isSeatSelected(item.SeatID));

    if (selected) {
      updateSelectedSeats(selectedSeats.filter(item => !coupleSeats.some(coupleSeat => coupleSeat.SeatID === item.SeatID)));
      return;
    }

    const newSelectedCount = selectedSeats.length + coupleSeats.length;

    if (newSelectedCount > 8) {
      showNotice('Bạn chỉ có thể chọn tối đa 8 ghế.');
      return;
    }

    updateSelectedSeats([...selectedSeats, ...coupleSeats]);
  };

  const handleSingleSeatPress = (seat: Seat) => {
    const isSelected = isSeatSelected(seat.SeatID);
    if (isSelected) {
      updateSelectedSeats(selectedSeats.filter(s => s.SeatID !== seat.SeatID));
    } else {
      if (selectedSeats.length >= 8) {
        showNotice('Bạn chỉ có thể chọn tối đa 8 ghế.');
        return;
      }
      updateSelectedSeats([...selectedSeats, seat]);
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (isSeatUnavailable(seat)) return;

    if (seat.SeatType === 'COUPLE' && seat.PairID) {
      handleCoupleSeatPress(seat);
      return;
    }

    handleSingleSeatPress(seat);
  };

  const getSelectedSeatLabel = () => {
    const grouped = new Map<number, string[]>();
    const singles: string[] = [];

    selectedSeats.forEach((seat) => {
      if (seat.SeatType === 'COUPLE' && seat.PairID) {
        if (!grouped.has(seat.PairID)) {
          grouped.set(seat.PairID, []);
        }
        grouped.get(seat.PairID)!.push(seat.SeatNumber);
      } else {
        singles.push(seat.SeatNumber);
      }
    });

    const coupleLabels = Array.from(grouped.values()).map(arr => arr.join('-'));
    return [...singles, ...coupleLabels].join(', ');
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

  const handleContinue = async () => {
    if (selectedSeats.length === 0 || !showInfo) return;
    if (singleSeatGapMessage) {
      showNotice(singleSeatGapMessage);
      return;
    }

    setIsHolding(true);
    try {
      const seatIds = selectedSeats.map((seat) => seat.SeatID);
      const result = await bookingService.holdSeats(showId, seatIds);

      if (!result?.success || !result?.data?.success) {
        showNotice(result?.message || result?.data?.message || 'Ghế đang được người khác giữ.');
        await loadSeats();
        return;
      }

      navigation.navigate('ComboScreen', {
        showInfo,
        selectedSeats,
        totalPrice,
        holdUntil: result.data.holdUntil,
      });
    } catch (err: any) {
      showNotice(err.response?.data?.message || 'Không thể giữ ghế. Vui lòng thử lại.');
      await loadSeats();
    } finally {
      setIsHolding(false);
    }
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

      {!!notice && (
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

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
                      if (!seat || seat.IsAisle || seat.SeatType === 'EMPTY' || seat.SeatType === 'DISABLED') {
                        return <View key={`empty-${rIdx}-${cIdx}`} style={styles.seatEmpty} />;
                      }

                      const selected = seat.SeatType === 'COUPLE' 
                        ? isCoupleSelected(seat) 
                        : isSeatSelected(seat.SeatID);
                        
                      const unavailable = seat.SeatType === 'COUPLE'
                        ? isCoupleUnavailable(seat)
                        : isSeatUnavailable(seat);

                      const isCouple = seat.SeatType === 'COUPLE' && seat.PairID;
                      
                      const styleArr: any[] = [styles.seat];
                      if (isCouple) {
                         const coupleSeats = getCoupleSeats(seat, seats);
                         const sibling = coupleSeats.find(s => s.SeatID !== seat.SeatID);
                         styleArr.push(styles.seatCouple);
                         if (sibling) {
                            if (seat.ColIndex < sibling.ColIndex) {
                              styleArr.push(styles.coupleLeft);
                            } else {
                              styleArr.push(styles.coupleRight);
                            }
                         }
                      } else if (seat.SeatType === 'VIP') {
                         styleArr.push(styles.seatVIP);
                      } else {
                         styleArr.push(styles.seatStandard);
                      }

                      if (selected) {
                        styleArr.push(styles.seatSelected);
                      }
                      
                      if (unavailable) {
                        styleArr.push(seat.Status === 'BOOKED' ? styles.seatBooked : styles.seatHolding);
                      }

                      return (
                        <TouchableOpacity
                          key={seat.SeatID}
                          activeOpacity={0.7}
                          style={styleArr}
                          onPress={() => toggleSeat(seat)}
                          disabled={unavailable}
                        >
                          <Text style={[
                            styles.seatText,
                            selected && styles.seatTextSelected,
                            unavailable && styles.seatTextDisabled
                          ]}>
                            {seat.SeatNumber}
                          </Text>
                          {isCouple && (
                            <Text style={[
                              styles.seatText, 
                              { fontSize: 7, opacity: 0.7, marginTop: -1 }, 
                              selected && styles.seatTextSelected, 
                              unavailable && styles.seatTextDisabled
                            ]}>
                              CPL
                            </Text>
                          )}
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
              {getSelectedSeatLabel()}
            </Text>
          )}
          {!!singleSeatGapMessage && (
            <Text style={styles.constraintText} numberOfLines={2}>
              {singleSeatGapMessage}
            </Text>
          )}
        </View>
        <View style={styles.bottomRight}>
          {selectedSeats.length > 0 && (
            <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>
          )}
          <TouchableOpacity 
            style={[styles.continueBtn, (selectedSeats.length === 0 || !!singleSeatGapMessage || isHolding) && styles.continueBtnDisabled]}
            disabled={selectedSeats.length === 0 || !!singleSeatGapMessage || isHolding}
            onPress={handleContinue}
          >
            <Text style={[styles.continueBtnText, (selectedSeats.length === 0 || !!singleSeatGapMessage || isHolding) && styles.continueBtnTextDisabled]}>
              {isHolding ? 'Đang giữ...' : 'Tiếp tục'}
            </Text>
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.35)',
  },
  noticeText: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 8,
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
  coupleLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    marginRight: 0,
  },
  coupleRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(233, 30, 99, 0.2)',
    marginLeft: 0,
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
  constraintText: {
    fontSize: 11,
    color: '#ff6b6b',
    marginTop: 6,
    lineHeight: 15,
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
