// src/apis/reviewApi.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const getAdminReviewsAPI = () => axios.get(`${BASE_URL}/reviews/admin`, { withCredentials: true });

export const updateReviewStatusAPI = (id, status) => 
  axios.put(`${BASE_URL}/reviews/${id}/status`, { status }, { withCredentials: true });

export const deleteReviewAPI = (id) => 
  axios.delete(`${BASE_URL}/reviews/${id}`, { withCredentials: true });
