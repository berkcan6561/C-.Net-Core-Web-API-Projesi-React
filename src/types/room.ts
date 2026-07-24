export interface Room {
  id: number;
  roomNumber: string;
  capacity: number;
  pricePerNight: number;
  imageUrls?: string[];
}