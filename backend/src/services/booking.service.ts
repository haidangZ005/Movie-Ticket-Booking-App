import BookingModel from '../models/booking.model';

class BookingService {
  static async getMyBookings(customerId: number) {
    return await BookingModel.findByCustomerId(customerId);
  }
}

export default BookingService;
