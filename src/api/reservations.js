import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
export const createReservation = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/reservations`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating reservation:", error);
    throw error.response?.data || error.message;
  }
};
export const getAllReservations = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/reservations`);
    return response.data.reservations;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    throw error.response?.data || error.message;
  }
};
export const getReservationById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/reservations/${id}`);
    return response.data.reservation;
  } catch (error) {
    console.error(`Error fetching reservation with ID ${id}:`, error);
    throw error.response?.data || error.message;
  }
};
export const updateReservation = async (id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/reservations/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating reservation with ID ${id}:`, error);
    throw error.response?.data || error.message;
  }
};
export const deleteReservation = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/reservations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting reservation with ID ${id}:`, error);
    throw error.response?.data || error.message;
  }
};
