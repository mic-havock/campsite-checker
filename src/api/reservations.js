import axios from "axios";

// Base URL configured from the environment
const BASE_URL = import.meta.env.VITE_BASE_URL;

const reservationsAPI = {
  // Create a new reservation
  create: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/reservations`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating reservation:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get all reservations
  getAll: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/reservations`);
      return response.data.reservations;
    } catch (error) {
      console.error("Error fetching reservations:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get a single reservation by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/reservations/${id}`);
      return response.data.reservation;
    } catch (error) {
      console.error(`Error fetching reservation with ID ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Update a reservation by ID
  update: async (id, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/reservations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating reservation with ID ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete a reservation by ID
  delete: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/reservations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting reservation with ID ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default reservationsAPI;
