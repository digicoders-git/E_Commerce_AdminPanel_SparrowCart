// src/apis/deliveryBoyApi.js
import http from "./http";

/**
 * Delivery Boys Management APIs
 */

// Create new delivery boy
export const createDeliveryBoyAPI = (formData) => {
  return http.post(`/delivery-boys`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all delivery boys (admin)
export const getAllDeliveryBoysAPI = () => {
  return http.get(`/delivery-boys/admin`);
};

// Get single delivery boy by ID
export const getDeliveryBoyByIdAPI = (deliveryBoyId) => {
  return http.get(`/delivery-boys/admin/${deliveryBoyId}`);
};

// Update delivery boy
export const updateDeliveryBoyAPI = (deliveryBoyId, formData) => {
  return http.patch(`/delivery-boys/${deliveryBoyId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update delivery boy status (active/inactive)
export const updateDeliveryBoyStatusAPI = (deliveryBoyId, isActive) => {
  return http.patch(`/delivery-boys/${deliveryBoyId}/status`, { isActive });
};

// Delete delivery boy
export const deleteDeliveryBoyAPI = (deliveryBoyId) => {
  return http.delete(`/delivery-boys/${deliveryBoyId}`);
};

export default {
  createDeliveryBoyAPI,
  getAllDeliveryBoysAPI,
  getDeliveryBoyByIdAPI,
  updateDeliveryBoyAPI,
  updateDeliveryBoyStatusAPI,
  deleteDeliveryBoyAPI,
};