import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../services/api';

const modes = ['STANDARD', 'VIP', 'COUPLE', 'DISABLED', 'AISLE'];

const modeClass = {
  STANDARD: 'border-border-default bg-surface-variant text-text-primary',
  VIP: 'border-warning/60 bg-warning/20 text-warning',
  COUPLE: 'border-primary/60 bg-primary-soft text-primary',
  DISABLED: 'border-border-default bg-surface-container-low text-text-muted opacity-60',
  AISLE: 'border-dashed border-border-default bg-transparent text-text-muted',
};

const activeModeClass = {
  STANDARD: 'border-text-primary bg-text-primary text-page-bg shadow-[0_0_18px_rgba(226,232,240,0.28)]',
  VIP: 'border-warning bg-warning text-page-bg shadow-[0_0_18px_rgba(246,195,67,0.35)]',
  COUPLE: 'border-primary bg-primary text-inverse-on-surface shadow-[0_0_18px_rgba(99,102,241,0.35)]',
  DISABLED: 'border-text-muted bg-text-muted text-page-bg',
  AISLE: 'border-dashed border-text-muted bg-surface text-text-primary',
};

const getRowLabel = (rowIndex) => {
  let label = '';
  let value = rowIndex;
  while (value > 0) {
    const mod = (value - 1) % 26;
    label = String.fromCharCode(65 + mod) + label;
    value = Math.floor((value - mod) / 26);
  }
  return label;
};

const isNumberedSeat = (seat) => {
  return !seat.IsAisle && !['AISLE', 'DISABLED', 'EMPTY'].includes(seat.SeatType);
};

const renumberSeats = (seatList, direction) => {
  const rowGroups = new Map();
  seatList.forEach((seat) => {
    const row = Number(seat.RowIndex);
    if (!rowGroups.has(row)) rowGroups.set(row, []);
    rowGroups.get(row).push(seat);
  });

  const updatedSeatsMap = new Map();

  for (const [row, seatsInRow] of rowGroups.entries()) {
    const sortedSeats = [...seatsInRow].sort((a, b) => a.ColIndex - b.ColIndex);
    const numberedSeats = sortedSeats.filter(isNumberedSeat);
    const totalNumbered = numberedSeats.length;
    let numberIndex = 1;

    for (const seat of sortedSeats) {
      const key = `${seat.RowIndex}-${seat.ColIndex}`;
      if (!isNumberedSeat(seat)) {
        updatedSeatsMap.set(key, { ...seat, SeatNumber: '' });
      } else {
        const rowLabel = getRowLabel(seat.RowIndex);
        let seatNum = numberIndex;
        if (direction === 'RIGHT_TO_LEFT') {
          seatNum = totalNumbered - numberIndex + 1;
        }
        updatedSeatsMap.set(key, { ...seat, SeatNumber: `${rowLabel}${seatNum}` });
        numberIndex++;
      }
    }
  }

  return seatList.map((seat) => updatedSeatsMap.get(`${seat.RowIndex}-${seat.ColIndex}`) || seat);
};

const createSeat = (row, col) => ({
  SeatNumber: `${getRowLabel(row)}${col}`,
  SeatType: 'STANDARD',
  SeatPrice: 0,
  PairID: null,
  RowIndex: row,
  ColIndex: col,
  IsAisle: false,
});

const SeatLayoutBuilder = () => {
  const location = useLocation();
  const [cinemas, setCinemas] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState(location.state?.cinemaId || '');
  const [selectedHallId, setSelectedHallId] = useState(location.state?.hallId || '');
  const [inputRows, setInputRows] = useState('');
  const [inputCols, setInputCols] = useState('');
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [seats, setSeats] = useState([]);
  const [currentMode, setCurrentMode] = useState('STANDARD');
  const [seatNumberDirection, setSeatNumberDirection] = useState('LEFT_TO_RIGHT');
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState('');

  const selectedSeat = selectedSeatIndex !== null ? seats[selectedSeatIndex] : null;

  const counts = useMemo(() => {
    return seats.reduce(
      (acc, seat) => {
        if (seat.IsAisle || seat.SeatType === 'AISLE') acc.aisle += 1;
        else {
          acc[seat.SeatType.toLowerCase()] = (acc[seat.SeatType.toLowerCase()] || 0) + 1;
          if (seat.SeatType !== 'DISABLED') acc.total += 1;
        }
        return acc;
      },
      { total: 0, standard: 0, vip: 0, couple: 0, disabled: 0, aisle: 0 }
    );
  }, [seats]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const fetchCinemas = async () => {
    try {
      const res = await apiClient.get('/cinemas?limit=100');
      setCinemas(res.data?.items || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHalls = async (cinemaId) => {
    try {
      const res = await apiClient.get(`/cinemas/${cinemaId}`);
      setHalls(res.data?.halls || []);
    } catch (err) {
      console.error(err);
      setHalls([]);
    }
  };

  const fetchLayout = async (hallId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/admin/halls/${hallId}/seats`);
      const hall = res.data?.hall;
      const fetchedSeats = res.data?.seats || [];
      const totalRows = Number(hall?.TotalRows || 0);
      const totalCols = Number(hall?.TotalCols || 0);

      setRows(totalRows);
      setCols(totalCols);
      setInputRows(totalRows || '');
      setInputCols(totalCols || '');
      setSeats(fetchedSeats);
      setSelectedSeatIndex(null);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      showToast('Không tải được sơ đồ ghế.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    setSelectedHallId('');
    setHalls([]);
    setSeats([]);
    setRows(0);
    setCols(0);
    setInputRows('');
    setInputCols('');
    setSelectedSeatIndex(null);
    setHasUnsavedChanges(false);
    if (selectedCinemaId) fetchHalls(selectedCinemaId);
  }, [selectedCinemaId]);

  useEffect(() => {
    if (selectedHallId) fetchLayout(selectedHallId);
  }, [selectedHallId]);

  const generateGrid = () => {
    const nextRows = parseInt(inputRows, 10);
    const nextCols = parseInt(inputCols, 10);
    if (!Number.isInteger(nextRows) || !Number.isInteger(nextCols) || nextRows < 1 || nextCols < 1) {
      showToast('Số hàng và số cột phải lớn hơn 0.');
      return;
    }
    if (seats.length > 0 && !window.confirm('Tạo sơ đồ mới sẽ thay thế layout hiện tại. Tiếp tục?')) return;

    const nextSeats = [];
    for (let row = 1; row <= nextRows; row += 1) {
      for (let col = 1; col <= nextCols; col += 1) {
        nextSeats.push(createSeat(row, col));
      }
    }
    const finalSeats = renumberSeats(nextSeats, seatNumberDirection);
    setRows(nextRows);
    setCols(nextCols);
    setSeats(finalSeats);
    setSelectedSeatIndex(null);
    setHasUnsavedChanges(true);
  };

  const handleSeatNumberDirectionChange = (direction) => {
    setSeatNumberDirection(direction);
    setSeats((prev) => renumberSeats(prev, direction));
    setHasUnsavedChanges(true);
  };

  const handleSeatClick = (index) => {
    setSelectedSeatIndex(index);
    const seat = seats[index];
    if (!seat) return;

    if (currentMode === 'COUPLE') {
      showToast('Ghế đôi sẽ làm sau theo logic convert hàng cuối.');
      return;
    }

    const nextSeats = [...seats];
    const nextSeat = { ...seat };
    if (currentMode === 'AISLE') {
      nextSeat.SeatNumber = '';
      nextSeat.SeatType = 'AISLE';
      nextSeat.SeatPrice = 0;
      nextSeat.PairID = null;
      nextSeat.IsAisle = true;
    } else {
      nextSeat.SeatType = currentMode;
      nextSeat.SeatPrice = currentMode === 'VIP' ? 20000 : 0;
      nextSeat.PairID = null;
      nextSeat.IsAisle = false;
      nextSeat.SeatNumber = nextSeat.SeatNumber || `${getRowLabel(nextSeat.RowIndex)}${nextSeat.ColIndex}`;
    }
    nextSeats[index] = nextSeat;
    const finalSeats = renumberSeats(nextSeats, seatNumberDirection);
    setSeats(finalSeats);
    setHasUnsavedChanges(true);
  };

  const updateSelectedSeat = (field, value) => {
    if (selectedSeatIndex === null) return;
    const nextSeats = [...seats];
    nextSeats[selectedSeatIndex] = { ...nextSeats[selectedSeatIndex], [field]: value };
    setSeats(nextSeats);
    setHasUnsavedChanges(true);
  };

  const validateBeforeSave = () => {
    const positions = new Set();
    const seatNumbers = new Set();

    for (const seat of seats) {
      const row = Number(seat.RowIndex);
      const col = Number(seat.ColIndex);
      const isAisle = Boolean(seat.IsAisle) || seat.SeatType === 'AISLE';
      if (!Number.isInteger(row) || !Number.isInteger(col) || row < 1 || row > rows || col < 1 || col > cols) {
        return 'Vị trí ghế nằm ngoài kích thước layout.';
      }
      const positionKey = `${row}:${col}`;
      if (positions.has(positionKey)) return 'Bị trùng vị trí ghế.';
      positions.add(positionKey);

      if (!isAisle) {
        const seatNumber = String(seat.SeatNumber || '').trim();
        if (!seatNumber) return 'Ghế không phải lối đi phải có mã ghế.';
        if (seatNumbers.has(seatNumber)) return `Bị trùng mã ghế: ${seatNumber}`;
        seatNumbers.add(seatNumber);
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedHallId || saving) return;
    const validationError = validateBeforeSave();
    if (validationError) {
      showToast(validationError);
      return;
    }

    try {
      setSaving(true);
      const payloadSeats = seats.map((seat) => {
        const isAisle = Boolean(seat.IsAisle) || seat.SeatType === 'AISLE';
        const seatType = isAisle ? 'AISLE' : seat.SeatType;
        return {
          SeatNumber: isAisle ? '' : String(seat.SeatNumber || '').trim(),
          SeatType: seatType,
          SeatPrice: isAisle || seatType === 'DISABLED' ? 0 : Number(seat.SeatPrice) || 0,
          PairID: seatType === 'COUPLE' ? seat.PairID || null : null,
          RowIndex: Number(seat.RowIndex),
          ColIndex: Number(seat.ColIndex),
          IsAisle: isAisle,
        };
      });

      await apiClient.put(`/admin/halls/${selectedHallId}/seats`, {
        totalRows: rows,
        totalCols: cols,
        seats: payloadSeats,
      });
      setHasUnsavedChanges(false);
      showToast('Đã lưu sơ đồ ghế.');
    } catch (err) {
      alert(err.message || 'Không lưu được sơ đồ ghế.');
    } finally {
      setSaving(false);
    }
  };

  const renderSeatGrid = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-text-muted">Đang tải sơ đồ...</div>;
    if (seats.length === 0 || rows === 0 || cols === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-text-muted">
          <span className="material-symbols-outlined mb-3 text-5xl opacity-50">chair</span>
          <p>Chọn phòng và tạo sơ đồ để bắt đầu.</p>
        </div>
      );
    }

    const rowGroups = new Map();
    seats.forEach((seat, index) => {
      const row = Number(seat.RowIndex);
      if (!rowGroups.has(row)) rowGroups.set(row, []);
      rowGroups.get(row).push({ ...seat, originalIndex: index });
    });

    const sortedRows = Array.from(rowGroups.keys()).sort((a, b) => a - b);
    const density = Math.max(rows, cols);
    const seatSize = density <= 7 ? 62 : density <= 8 ? 54 : density <= 10 ? 46 : density <= 12 ? 40 : 34;
    const seatGap = density <= 7 ? 18 : density <= 8 ? 14 : density <= 10 ? 11 : density <= 12 ? 9 : 7;
    const rowGap = density <= 7 ? 18 : density <= 8 ? 13 : density <= 10 ? 10 : 8;
    const gridWidth = cols * seatSize + Math.max(cols - 1, 0) * seatGap;
    const screenWidth = Math.min(Math.max(gridWidth * 1.05, 420), 760);

    return (
      <div className="flex min-h-full w-full justify-center overflow-auto p-10">
        <div className="w-max">
          <div className="mx-auto mb-12 rounded-b-[48px] border-b-[7px] border-border-default text-center" style={{ width: screenWidth }}>
            <span className="relative top-5 text-[11px] font-bold tracking-[0.22em] text-text-muted">MÀN HÌNH</span>
          </div>
          <div className="flex flex-col" style={{ gap: rowGap }}>
            {sortedRows.map((rowIndex) => {
              const rowSeats = rowGroups.get(rowIndex).sort((a, b) => a.ColIndex - b.ColIndex);
              return (
                <div key={rowIndex} className="flex items-center justify-center gap-4">
                  <div className="w-8 text-right text-lg font-medium text-text-secondary">{getRowLabel(rowIndex)}</div>
                  <div className="flex" style={{ gap: seatGap }}>
                    {rowSeats.map((seat) => {
                      const isAisle = seat.IsAisle || seat.SeatType === 'AISLE';
                      const selected = selectedSeatIndex === seat.originalIndex;
                      const cls = isAisle ? modeClass.AISLE : modeClass[seat.SeatType] || modeClass.STANDARD;
                      return (
                        <button
                          key={`${seat.RowIndex}-${seat.ColIndex}`}
                          type="button"
                          onClick={() => handleSeatClick(seat.originalIndex)}
                          className={`flex items-center justify-center rounded-lg border font-extrabold transition-all hover:-translate-y-0.5 ${cls} ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                          style={{ width: seatSize, height: seatSize, fontSize: Math.max(12, Math.round(seatSize * 0.32)) }}
                        >
                          {!isAisle && seat.SeatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px-24px)] flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Trình tạo sơ đồ ghế</h2>
          <p className="mt-1 text-sm text-text-muted">Cấu hình sơ đồ ghế phòng chiếu.</p>
        </div>
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && <span className="text-sm font-semibold text-warning">Chưa lưu thay đổi</span>}
          <button onClick={handleSave} disabled={!selectedHallId || saving || seats.length === 0} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-inverse-on-surface transition-colors hover:bg-accent-hover disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Đang lưu...' : 'Lưu sơ đồ'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border-default bg-surface p-3 shadow-sm">
        <label className="block w-48">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Chọn rạp</span>
          <select value={selectedCinemaId} onChange={(event) => setSelectedCinemaId(event.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">-- Chọn rạp --</option>
            {cinemas.map((cinema) => <option key={cinema.CinemaID} value={cinema.CinemaID}>{cinema.CinemaName}</option>)}
          </select>
        </label>
        <label className="block w-48">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Chọn phòng</span>
          <select value={selectedHallId} onChange={(event) => setSelectedHallId(event.target.value)} disabled={!selectedCinemaId} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50">
            <option value="">-- Chọn phòng --</option>
            {halls.map((hall) => <option key={hall.HallID} value={hall.HallID}>{hall.HallName}</option>)}
          </select>
        </label>
        <div className="mx-2 h-8 w-px self-center bg-border-default" />
        <label className="block w-24">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Rows</span>
          <input type="number" min="1" value={inputRows} onChange={(event) => setInputRows(event.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <label className="block w-24">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Cols</span>
          <input type="number" min="1" value={inputCols} onChange={(event) => setInputCols(event.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <label className="block w-36">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Hướng đánh số</span>
          <select value={seatNumberDirection} onChange={(event) => handleSeatNumberDirectionChange(event.target.value)} className="w-full rounded-lg border border-border-default bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="LEFT_TO_RIGHT">Trái sang phải</option>
            <option value="RIGHT_TO_LEFT">Phải sang trái</option>
          </select>
        </label>
        <button onClick={generateGrid} disabled={saving} className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-container-low px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-variant disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">grid_on</span>
          Tạo sơ đồ
        </button>
        <button onClick={() => selectedHallId && fetchLayout(selectedHallId)} disabled={!selectedHallId || saving} className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-container-low px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-variant disabled:opacity-50">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Đặt lại
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-border-default bg-surface-container-low p-3">
            <span className="mr-2 text-sm font-semibold text-text-secondary">Brush Mode:</span>
            {modes.map((mode) => (
              <button key={mode} onClick={() => setCurrentMode(mode)} className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${currentMode === mode ? activeModeClass[mode] : `opacity-70 hover:opacity-100 ${modeClass[mode]}`}`}>
                {mode}
              </button>
            ))}
          </div>
          <div className="relative flex-1 overflow-auto bg-page-bg">{renderSeatGrid()}</div>
          <div className="flex flex-wrap items-center gap-4 border-t border-border-default bg-surface-container-low p-3 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Tổng ghế: {counts.total}</span>
            <span>Standard: {counts.standard}</span>
            <span>VIP: {counts.vip}</span>
            <span>Couple: {counts.couple}</span>
            <span>Disabled: {counts.disabled}</span>
            <span>Aisle: {counts.aisle}</span>
          </div>
        </div>

        <div className="hidden w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border-default bg-surface shadow-sm lg:flex">
          <div className="border-b border-border-default bg-surface-container-low px-4 py-3">
            <h3 className="font-bold text-text-primary">Chi tiết ghế</h3>
          </div>
          <div className="space-y-4 p-4">
            {!selectedSeat ? (
              <div className="py-4 text-center text-sm italic text-text-muted">Chọn ghế để xem chi tiết</div>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-text-secondary">Mã ghế</span>
                  <input value={selectedSeat.SeatNumber || ''} onChange={(event) => updateSelectedSeat('SeatNumber', event.target.value)} disabled={selectedSeat.IsAisle} className="w-full rounded-md border border-border-default bg-surface-container-low px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50" />
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-text-secondary">Row</span><div>{selectedSeat.RowIndex}</div></div>
                  <div><span className="text-xs text-text-secondary">Col</span><div>{selectedSeat.ColIndex}</div></div>
                  <div><span className="text-xs text-text-secondary">Type</span><div>{selectedSeat.IsAisle ? 'AISLE' : selectedSeat.SeatType}</div></div>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-text-secondary">Giá thêm</span>
                  <input type="number" value={selectedSeat.SeatPrice || 0} onChange={(event) => updateSelectedSeat('SeatPrice', Number(event.target.value))} disabled={selectedSeat.IsAisle || selectedSeat.SeatType === 'DISABLED'} className="w-full rounded-md border border-border-default bg-surface-container-low px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50" />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-inverse-surface px-4 py-2 text-sm text-inverse-on-surface shadow-lg">{toast}</div>}
    </div>
  );
};

export default SeatLayoutBuilder;
