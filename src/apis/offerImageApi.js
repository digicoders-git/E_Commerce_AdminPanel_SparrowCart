// src/apis/offerImageApi.js
import http from "./http";

/**
 * Offer Images Management APIs
 */

// Create new offer image
export const createOfferImageAPI = (formData) => {
  return http.post(`/offer-images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Get all offer images (admin)
export const getAllOfferImagesAPI = () => {
  return http.get(`/offer-images/admin`);
};

// Get single offer image by ID
export const getOfferImageByIdAPI = (offerImageId) => {
  return http.get(`/offer-images/${offerImageId}`);
};

// Update offer image
export const updateOfferImageAPI = (offerImageId, formData) => {
  return http.patch(`/offer-images/${offerImageId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update offer image status (active/inactive)
export const updateOfferImageStatusAPI = (offerImageId, isActive) => {
  return http.patch(`/offer-images/${offerImageId}/status`, { isActive });
};

// Delete offer image
export const deleteOfferImageAPI = (offerImageId) => {
  return http.delete(`/offer-images/${offerImageId}`);
};

export default {
  createOfferImageAPI,
  getAllOfferImagesAPI,
  getOfferImageByIdAPI,
  updateOfferImageAPI,
  updateOfferImageStatusAPI,
  deleteOfferImageAPI,
};