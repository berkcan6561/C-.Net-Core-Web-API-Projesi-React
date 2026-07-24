import axiosInstance from './axiosInstance';
import type { Room } from '../types/room';

export const getRooms = async (): Promise<Room[]> => {
  const { data } = await axiosInstance.get<Room[]>('/Room');
  return data;
};

export const getRoomById = async (id: number): Promise<Room> => {
  const { data } = await axiosInstance.get<Room>(`/Room/${id}`);
  return data;
};

export const getAvailableRooms = async (start: string, end: string): Promise<Room[]> => {
  const { data } = await axiosInstance.get<Room[]>('/Room/available', { params: { start, end } });
  return data;
};

export const createRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
  const { data } = await axiosInstance.post<Room>('/Room', room);
  return data;
};

export const updateRoom = async (room: Room): Promise<void> => {
  await axiosInstance.put(`/Room/${room.id}`, room);
};

export const deleteRoom = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Room/${id}`);
};

export const uploadRoomImages = async (id: number, files: FileList): Promise<Room> => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  const { data } = await axiosInstance.post<Room>(`/Room/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteRoomImage = async (id: number, imageUrl: string): Promise<Room> => {
  const { data } = await axiosInstance.delete<Room>(`/Room/${id}/images`, {
    data: `"${imageUrl}"`,
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
};