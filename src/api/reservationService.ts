import axiosInstance from './axiosInstance';
import type { Reservation, ReservationRequest } from '../types/reservation';

export const getReservations = async (): Promise<Reservation[]> => {
  const { data } = await axiosInstance.get<Reservation[]>('/Reservation');
  return data;
};

export const getReservationById = async (id: number): Promise<Reservation> => {
  const { data } = await axiosInstance.get<Reservation>(`/Reservation/${id}`);
  return data;
};

export const createReservation = async (reservation: ReservationRequest): Promise<Reservation> => {
  const { data } = await axiosInstance.post<Reservation>('/Reservation', reservation);
  return data;
};

export const updateReservation = async (id: number, reservation: ReservationRequest): Promise<void> => {
  await axiosInstance.put(`/Reservation/${id}`, reservation);
};

export const deleteReservation = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Reservation/${id}`);
};
