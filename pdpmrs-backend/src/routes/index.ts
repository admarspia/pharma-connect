import { Router } from "express";
import patientRoutes from "../domains/patient/patient.routes";
import prescriptionRoutes from "../domains/patient/prescription.routes";
import pharmacyRoutes from "../domains/pharmacy/pharmacy.routes";
import medicineRoutes from "../domains/medicine/medicine.routes";
import inventoryRoutes from "../domains/inventory/inventory.routes";
import reservationRoutes from "../domains/reservation/reservation.routes";
import locationRoutes from "../domains/location/location.routes";
import administrationRoutes from "../domains/administration/administration.routes";

const router = Router();

router.use("/patients", patientRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/pharmacies", pharmacyRoutes);
router.use("/medicines", medicineRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/reservations", reservationRoutes);
router.use("/locations", locationRoutes);
router.use("/admin", administrationRoutes);

router.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

export default router;
