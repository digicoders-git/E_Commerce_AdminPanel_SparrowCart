import http from "./http";

// ── FAQ APIs ──────────────────────────────
export const getAllFAQsAPI = () => http.get("/help/faqs/admin");
export const createFAQAPI = (data) => http.post("/help/faqs", data);
export const updateFAQAPI = (id, data) => http.patch(`/help/faqs/${id}`, data);
export const deleteFAQAPI = (id) => http.delete(`/help/faqs/${id}`);

// ── Ticket APIs ───────────────────────────
export const getAllTicketsAPI = (status) =>
  http.get("/help/tickets", { params: status ? { status } : {} });
export const updateTicketAPI = (id, data) => http.patch(`/help/tickets/${id}`, data);
export const deleteTicketAPI = (id) => http.delete(`/help/tickets/${id}`);
