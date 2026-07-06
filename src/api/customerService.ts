import axiosInstance from './axiosInstance';
import type { Customer } from '../types/customer';

export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await axiosInstance.get<Customer[]>('/Customer');
  return data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const { data } = await axiosInstance.get<Customer>(`/Customer/${id}`);
  return data;
};

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
  const { data } = await axiosInstance.post<Customer>('/Customer', customer);
  return data;
};

export const updateCustomer = async (customer: Customer): Promise<void> => {
  await axiosInstance.put(`/Customer/${customer.id}`, customer);
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Customer/${id}`);
};
