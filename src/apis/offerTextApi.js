// src/apis/offerTextApi.js
import http from "./http";

/**
 * Offer Texts Management APIs
 */

// Create new offer text
export const createOfferTextAPI = (payload) => {
  return http.post(`/offer-texts`, payload);
};

// Get all offer texts (admin)
export const getAllOfferTextsAPI = () => {
  return http.get(`/offer-texts/admin`);
};

// Get single offer text by ID
export const getOfferTextByIdAPI = (offerTextId) => {
  return http.get(`/offer-texts/${offerTextId}`);
};

// Update offer text
export const updateOfferTextAPI = (offerTextId, payload) => {
  return http.patch(`/offer-texts/${offerTextId}`, payload);
};

// Update offer text status (active/inactive)
export const updateOfferTextStatusAPI = (offerTextId, isActive) => {
  return http.patch(`/offer-texts/${offerTextId}/status`, { isActive });
};

// Delete offer text
export const deleteOfferTextAPI = (offerTextId) => {
  return http.delete(`/offer-texts/${offerTextId}`);
};

export default {
  createOfferTextAPI,
  getAllOfferTextsAPI,
  getOfferTextByIdAPI,
  updateOfferTextAPI,
  updateOfferTextStatusAPI,
  deleteOfferTextAPI,
};