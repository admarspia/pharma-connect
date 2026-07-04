export type Role = "PATIENT" | "PHARMACY" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  brandName: string | null;
  category: string | null;
  description: string | null;
  translatedName?: string;
  translatedDescription?: string | null;
}

export interface PharmacyNearby {
  id: string;
  businessName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface Stock {
  id: string;
  pharmacyId: string;
  medicineId: string;
  quantity: number;
  price: string | number | null;
  lowStockThreshold: number;
  medicine: Medicine;
}

export type ReservationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED";

export interface ReservationItem {
  id: string;
  medicineId: string;
  quantity: number;
  medicine: Medicine;
}

export interface Reservation {
  id: string;
  patientId: string;
  pharmacyId: string;
  prescriptionId: string | null;
  status: ReservationStatus;
  expiresAt: string;
  reviewNote: string | null;
  createdAt: string;
  items: ReservationItem[];
  pharmacy?: { id: string; businessName: string };
  patient?: { id: string; fullName: string; email: string };
}

export interface PrescriptionScore {
  clarity: number;
  completeness: number;
  overallConfidence: number;
}

export interface ExtractedMedicineEntry {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  confidence: number;
}

export interface Prescription {
  id: string;
  status: "UPLOADED" | "PROCESSING" | "ANALYZED" | "FAILED" | "MANUAL_REVIEW";
  ocrText: string | null;
  extractedMedicines: ExtractedMedicineEntry[] | null;
  score: PrescriptionScore | null;
  confidence: number | null;
  createdAt: string;
}

export interface PharmacyProfile {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  licenseStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  addressVerified: boolean;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  subscriptionStatus: string;
}

export interface PlatformAnalytics {
  totalPatients: number;
  totalPharmacies: number;
  reservations: Record<ReservationStatus, number>;
  lowStockAlertCount: number;
}
