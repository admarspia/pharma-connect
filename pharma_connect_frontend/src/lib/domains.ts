import { api } from "./api-client";
import {
  Medicine,
  PharmacyNearby,
  PharmacyProfile,
  PlatformAnalytics,
  Prescription,
  Reservation,
  Stock,
} from "./types";

// ---- Patient ----
export const patientApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<{ id: string; email: string; fullName: string }>("/patients/register", data, false),
  verifyEmail: (token: string) => api.post<{ verified: boolean }>("/patients/verify-email", { token }, false),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; patient: { id: string; email: string; fullName: string } }>(
      "/patients/login",
      data,
      false
    ),
  me: () => api.get<{ id: string; email: string; fullName: string }>("/patients/me"),
  deleteAccount: () => api.del<{ deleted: boolean }>("/patients/me"),
};

// ---- Prescriptions ----
export const prescriptionApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("prescription", file);
    return api.upload<Prescription>("/prescriptions", fd);
  },
  list: () => api.get<Prescription[]>("/prescriptions"),
  get: (id: string) => api.get<Prescription>(`/prescriptions/${id}`),
};

// ---- Pharmacy ----
export const pharmacyApi = {
  register: (data: {
    email: string;
    password: string;
    ownerName: string;
    businessName: string;
    phone?: string;
    addressLine: string;
    city: string;
    country: string;
  }) => api.post<{ id: string; email: string; businessName: string }>("/pharmacies/register", data, false),
  verifyEmail: (token: string) => api.post<{ verified: boolean }>("/pharmacies/verify-email", { token }, false),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; pharmacy: { id: string; email: string; businessName: string } }>(
      "/pharmacies/login",
      data,
      false
    ),
  me: () => api.get<PharmacyProfile>("/pharmacies/me"),
  deleteAccount: () => api.del<{ deleted: boolean }>("/pharmacies/me"),
  uploadLicense: (file: File) => {
    const fd = new FormData();
    fd.append("license", file);
    return api.upload<{ licenseStatus: string; aiScore: unknown }>("/pharmacies/me/license", fd);
  },
};

// ---- Medicines ----
export const medicineApi = {
  search: (query: string, lang = "en") =>
    api.get<Medicine[]>(`/medicines/search?q=${encodeURIComponent(query)}&lang=${lang}`, false),
  get: (id: string, lang = "en") => api.get<Medicine>(`/medicines/${id}?lang=${lang}`, false),
};

// ---- Inventory (pharmacy stock) ----
export const inventoryApi = {
  list: () => api.get<Stock[]>("/inventory"),
  lowStock: () => api.get<Stock[]>("/inventory/low-stock"),
  add: (data: { medicineId: string; quantity: number; price?: number; lowStockThreshold?: number }) =>
    api.post<Stock>("/inventory", data),
  update: (id: string, data: { quantity?: number; price?: number; lowStockThreshold?: number }) =>
    api.patch<Stock>(`/inventory/${id}`, data),
  remove: (id: string) => api.del<{ deleted: boolean }>(`/inventory/${id}`),
};

// ---- Reservations ----
export const reservationApi = {
  create: (data: {
    pharmacyId: string;
    prescriptionId?: string;
    items: Array<{ medicineId: string; quantity: number }>;
  }) => api.post<Reservation>("/reservations", data),
  listMine: (status?: string) =>
    api.get<Reservation[]>(`/reservations${status ? `?status=${status}` : ""}`),
  get: (id: string) => api.get<Reservation>(`/reservations/${id}`),
  cancel: (id: string) => api.post<Reservation>(`/reservations/${id}/cancel`),
  review: (id: string, decision: "ACCEPTED" | "REJECTED", note?: string) =>
    api.post<Reservation>(`/reservations/${id}/review`, { decision, note }),
  complete: (id: string) => api.post<Reservation>(`/reservations/${id}/complete`),
};

// ---- Location ----
export const locationApi = {
  nearby: (lat: number, lng: number, radiusKm = 10) =>
    api.get<PharmacyNearby[]>(`/locations/pharmacies/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, false),
};

// ---- Admin ----
export const adminApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; admin: { id: string; email: string; fullName: string; role: string } }>(
      "/admin/login",
      data,
      false
    ),
  pendingPharmacies: () => api.get<PharmacyProfile[]>("/admin/pharmacies/pending"),
  decideLicense: (pharmacyId: string, decision: "APPROVED" | "REJECTED" | "SUSPENDED") =>
    api.post<PharmacyProfile>(`/admin/pharmacies/${pharmacyId}/license-decision`, { decision }),
  analytics: () => api.get<PlatformAnalytics>("/admin/analytics"),
  auditLogs: (entityType?: string) =>
    api.get<unknown[]>(`/admin/audit-logs${entityType ? `?entityType=${entityType}` : ""}`),
};
