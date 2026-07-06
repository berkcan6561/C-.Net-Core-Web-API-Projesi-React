import type { Room } from './room';
import type { Customer } from './customer';

export interface Reservation {
  id: number;
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  room?: Room;
  customer?: Customer;
}

export interface ReservationRequest {
  customerId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
}
