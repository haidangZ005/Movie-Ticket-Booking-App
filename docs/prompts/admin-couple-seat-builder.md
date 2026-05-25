# Prompt: Them UI/UX va logic tao ghe doi trong SeatLayoutBuilder

Hay them tinh nang tao va tach ghe doi `COUPLE` trong trang admin cau hinh so do ghe.

## Boi canh

Project: `Movie-Ticket-Booking-App`

File chinh can sua:

```text
frontend-admin/src/pages/SeatLayoutBuilder.jsx
```

Backend hien luu ghe bang cac field:

```text
SeatID
HallID
SeatNumber
SeatType
SeatPrice
PairID
RowIndex
ColIndex
IsAisle
```

Yeu cau quan trong:

- Khong doi ten bien/API field/backend field neu khong can thiet.
- Khong doi `RowIndex` va `ColIndex`.
- Khong bien 2 ghe thanh 1 record duy nhat trong DB.
- Ghe doi phai duoc luu bang 2 seat records co cung `PairID`.
- Uu tien sua frontend-admin truoc.
- Khong sua backend neu payload hien tai da ho tro `SeatType = COUPLE` va `PairID`.

## Muc tieu

Admin co the:

1. Chon dung 2 ghe lien ke trong cung hang.
2. Bam `Tao ghe doi`.
3. UI render 2 ghe do thanh mot cum ghe doi.
4. Hai ghe van la 2 o vat ly rieng trong state/payload.
5. Hai ghe co:
   - `SeatType = 'COUPLE'`
   - `PairID` giong nhau
   - `IsAisle = false`
6. Admin co the chon mot nua hoac ca cap ghe doi roi bam `Tach ghe doi`.
7. Khi tach, ca cap co cung `PairID` tro ve ghe thuong.

## UX mong muon

Khong cho admin click mot ghe don roi bien ngay thanh `COUPLE`.

Ghe doi la quan he giua 2 ghe, nen flow dung la:

```text
Chon 2 ghe lien ke -> Tao ghe doi
```

Flow UI:

```text
1. Admin chon mode/chuc nang chon ghe.
2. Click 2 ghe lien ke trong cung hang.
3. Nut "Tao ghe doi" sang len.
4. Bam "Tao ghe doi".
5. UI hien thi 2 ghe nhu mot cum couple.
```

Neu chon sai:

```text
Vui long chon dung 2 ghe lien ke trong cung mot hang.
```

## State can them

Them state multi-select:

```js
const [selectedSeatIndexes, setSelectedSeatIndexes] = useState([]);
```

Neu file dang co `selectedSeatIndex` don de hien thi inspector, co the giu lai. Khong can xoa neu dang duoc dung.

## Quy tac chon ghe

Khi click mot ghe:

1. Neu ghe la `AISLE`, `DISABLED`, hoac `EMPTY`, khong cho chon de tao couple.
2. Neu ghe dang la `COUPLE` va co `PairID`, highlight ca cap cung `PairID`.
3. Neu ghe thuong, toggle vao/ra khoi `selectedSeatIndexes`.
4. Khong cho chon qua 2 ghe khi tao couple.
5. Neu da chon 2 ghe roi click ghe thu 3, hien thi thong bao nhe hoac thay selection bang ghe moi tuy UI hien tai. Uu tien khong cho chon qua 2 de tranh nham.

## Nut thao tac can them

Them 2 nut trong toolbar hoac panel thao tac:

```text
Tao ghe doi
Tach ghe doi
```

### Nut `Tao ghe doi`

Chi enable khi:

- Dang chon dung 2 ghe.
- 2 ghe hop le de tao couple.

Neu click khi chua hop le thi khong update state, chi bao loi.

### Nut `Tach ghe doi`

Enable khi:

- Admin chon mot ghe dang la `COUPLE`, hoac
- Admin chon ca cap ghe dang la `COUPLE`.

Khi bam, tach toan bo ghe co cung `PairID`.

## Dieu kien hop le de tao ghe doi

Viet helper:

```js
const isSeatUnavailableForCouple = (seat) => {
  return seat.IsAisle || ['AISLE', 'DISABLED', 'EMPTY'].includes(seat.SeatType);
};
```

Viet helper validate:

```js
const getCoupleValidationError = (selectedSeats) => {
  if (selectedSeats.length !== 2) {
    return 'Vui long chon dung 2 ghe.';
  }

  const [seatA, seatB] = selectedSeats;

  if (isSeatUnavailableForCouple(seatA) || isSeatUnavailableForCouple(seatB)) {
    return 'Khong the tao ghe doi tu loi di hoac ghe da vo hieu hoa.';
  }

  if (seatA.RowIndex !== seatB.RowIndex) {
    return 'Hai ghe doi phai nam cung mot hang.';
  }

  if (Math.abs(seatA.ColIndex - seatB.ColIndex) !== 1) {
    return 'Hai ghe doi phai nam lien ke nhau.';
  }

  if (seatA.PairID || seatB.PairID) {
    return 'Ghe da thuoc mot cap ghe doi khac. Vui long tach ghe doi truoc.';
  }

  return null;
};
```

## Logic tao ghe doi

Khi admin bam `Tao ghe doi`:

1. Lay 2 ghe tu `selectedSeatIndexes`.
2. Validate bang `getCoupleValidationError`.
3. Neu co loi, hien thi alert/toast va return.
4. Sort 2 ghe theo `ColIndex`.
5. Tao `PairID` on dinh theo vi tri:

```js
const pairId = `R${rowIndex}-C${leftColIndex}-C${rightColIndex}`;
```

6. Update dung 2 ghe do:

```js
{
  ...seat,
  SeatType: 'COUPLE',
  PairID: pairId,
  IsAisle: false,
  SeatPrice: coupleSeatPrice
}
```

7. Khong doi `RowIndex`.
8. Khong doi `ColIndex`.
9. Khong doi `SeatNumber`, tru khi project dang co helper `renumberSeats`, luc do goi lai `renumberSeats`.
10. Clear selection:

```js
setSelectedSeatIndexes([]);
```

11. Set dirty state:

```js
setHasUnsavedChanges(true);
```

## Logic tach ghe doi

Khi admin bam `Tach ghe doi`:

1. Lay cac ghe dang chon.
2. Tim tat ca `PairID` cua cac ghe duoc chon.
3. Neu khong co `PairID`, bao:

```text
Vui long chon ghe doi can tach.
```

4. Voi moi `PairID`, tim toan bo ghe trong layout co cung `PairID`.
5. Reset cac ghe do:

```js
{
  ...seat,
  SeatType: 'STANDARD',
  PairID: null,
  SeatPrice: 0,
  IsAisle: false
}
```

6. Neu project co gia ghe thuong mac dinh thi dung gia do thay vi `0`.
7. Neu project co `renumberSeats`, goi lai sau khi tach.
8. Clear selection.
9. Set dirty state:

```js
setHasUnsavedChanges(true);
```

## Tuong tac voi cac mode hien tai

Neu trang dang co mode:

```text
STANDARD
VIP
COUPLE
AISLE
DISABLED
EMPTY
```

Xu ly nhu sau:

- `STANDARD`, `VIP`, `AISLE`, `DISABLED`, `EMPTY`: giu logic click doi loai nhu hien tai.
- `COUPLE`: khong doi mot o don le thanh couple ngay.
- Voi `COUPLE`, click ghe de chon/toggle, sau do bam `Tao ghe doi`.
- Neu ghe dang co `PairID`, khong cho doi truc tiep sang `AISLE`/`DISABLED`/`EMPTY`. Hien thi:

```text
Vui long tach ghe doi truoc khi doi loai ghe.
```

## Tuong tac voi renumberSeats neu da co

Neu file da co helper `renumberSeats`:

1. Sau khi tao ghe doi, goi lai `renumberSeats`.
2. Sau khi tach ghe doi, goi lai `renumberSeats`.
3. `COUPLE` van duoc tinh la ghe that, nen van co `SeatNumber`.
4. `PairID` khong duoc bi mat khi renumber.
5. `RowIndex` va `ColIndex` khong duoc doi.

## Render ghe doi

Khi render tung ghe:

1. Neu `SeatType === 'COUPLE'` va co `PairID`, tim ghe cung cap.
2. Xac dinh ghe trai/phai bang `ColIndex`.
3. Them class/style tuong ung:
   - `couple-left`
   - `couple-right`
4. Goi y style:
   - Mau rieng cho ghe doi.
   - Hai ghe cung `PairID` nhin nhu mot cum.
   - Ghe trai bo goc trai.
   - Ghe phai bo goc phai.
   - Border giua 2 ghe mo hoac bo border giua.
   - Khi hover/click mot nua thi highlight ca cap.
5. Label co the giu rieng tung ghe:
   - `A3`
   - `A4`
6. Co the them tooltip/text phu:

```text
Ghe doi: A3 - A4
```

## Payload khi luu

Vi du chon A3 va A4 de tao ghe doi.

Payload mong muon van co 2 records:

```js
{
  SeatNumber: 'A3',
  SeatType: 'COUPLE',
  PairID: 'R1-C3-C4',
  RowIndex: 1,
  ColIndex: 3,
  IsAisle: false
}

{
  SeatNumber: 'A4',
  SeatType: 'COUPLE',
  PairID: 'R1-C3-C4',
  RowIndex: 1,
  ColIndex: 4,
  IsAisle: false
}
```

Khong duoc luu thanh:

```js
{
  SeatNumber: 'A3-A4',
  SeatType: 'COUPLE',
  RowIndex: 1,
  ColIndex: 3
}
```

## Edge cases bat buoc xu ly

1. Chon 1 ghe roi bam tao couple -> bao loi.
2. Chon 3 ghe -> khong cho chon qua 2 hoac bao loi.
3. Chon 2 ghe khac hang -> bao loi.
4. Chon 2 ghe khong lien ke -> bao loi.
5. Chon ghe `AISLE`, `DISABLED`, hoac `EMPTY` -> bao loi.
6. Chon ghe da thuoc couple khac -> yeu cau tach truoc.
7. Tach mot nua ghe doi van phai tach ca cap.
8. Doi mot ghe dang couple sang `AISLE`/`DISABLED`/`EMPTY` phai bi chan va yeu cau tach truoc.
9. Luu payload phai co dung 2 ghe `COUPLE` cung `PairID`.

## Yeu cau kiem tra

Sau khi sua, chay:

```bash
npm run build
```

trong thu muc:

```text
frontend-admin
```

Test thu cong:

```text
Tao layout 1 hang 6 ghe
Chon A3 va A4 -> tao ghe doi
Chon A2 va A4 -> phai bao loi khong lien ke
Chon A3 va B3 -> phai bao loi khac hang
Chon A3 dang couple -> tach ghe doi -> A3/A4 ve STANDARD
Tao lai couple roi bam luu -> payload co 2 seat COUPLE cung PairID
```

## Ket qua mong muon

- Admin tao duoc ghe doi bang thao tac chon 2 ghe lien ke roi bam `Tao ghe doi`.
- UI render cap ghe doi ro rang nhu mot cum ghe.
- Du lieu van luu thanh 2 seat records co cung `PairID`.
- Mobile sau nay co the dua vao `PairID` de click mot nua va tu chon ca cap.
- Khong pha logic `RowIndex`, `ColIndex`, `SeatNumber`.
- Khong sua file khong lien quan.
