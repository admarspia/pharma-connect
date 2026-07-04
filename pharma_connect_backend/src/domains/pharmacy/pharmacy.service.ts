import { ApiError } from "../../common/ApiError";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateVerificationToken } from "../../utils/otp";
import { signToken } from "../../utils/jwt";
import { pharmacyRepository } from "./pharmacy.repository";
import { sendVerificationEmail } from "../notification/email.client";
import { recordAudit } from "../administration/audit.service";
import { analyzeLicense } from "../intelligence/license-analysis.service";
import { locationService } from "../location/location.service";
import { LoginPharmacyInput, RegisterPharmacyInput } from "./pharmacy.schema";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export const pharmacyService = {
  async register(input: RegisterPharmacyInput) {
    const existing = await pharmacyRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const pharmacy = await pharmacyRepository.create({
      email: input.email,
      passwordHash,
      ownerName: input.ownerName,
      businessName: input.businessName,
      phone: input.phone,
      addressLine: input.addressLine,
      city: input.city,
      country: input.country,
    });

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await pharmacyRepository.createVerificationToken(token, pharmacy.id, expiresAt);
    await sendVerificationEmail(pharmacy.email, token);

    // Address validation runs at registration time; failures don't block
    // account creation (CON-019) but leave addressVerified = false.
    try {
      const geo = await locationService.validateAndGeocodeAddress(
        input.addressLine,
        input.city,
        input.country
      );
      await pharmacyRepository.setGeolocation(pharmacy.id, geo.latitude, geo.longitude, true);
    } catch {
      // left unverified; pharmacy admin can retry via PATCH /pharmacies/me/address
    }

    await recordAudit({
      actorId: pharmacy.id,
      actorType: "PHARMACY",
      action: "PHARMACY_REGISTERED",
      entityType: "Pharmacy",
      entityId: pharmacy.id,
    });

    return { id: pharmacy.id, email: pharmacy.email, businessName: pharmacy.businessName };
  },

  async verifyEmail(token: string) {
    const record = await pharmacyRepository.findValidVerificationToken(token);
    if (!record || !record.pharmacyId) throw ApiError.badRequest("Invalid or expired token");

    await pharmacyRepository.markEmailVerified(record.pharmacyId);
    await pharmacyRepository.consumeVerificationToken(record.id);
    return { verified: true };
  },

  async login(input: LoginPharmacyInput) {
    const pharmacy = await pharmacyRepository.findByEmail(input.email);
    if (!pharmacy) throw ApiError.unauthorized("Invalid email or password");

    const valid = await comparePassword(input.password, pharmacy.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    if (!pharmacy.emailVerified) {
      throw ApiError.forbidden("Please verify your email before logging in");
    }

    const token = signToken({ sub: pharmacy.id, role: "PHARMACY", email: pharmacy.email });
    return {
      token,
      pharmacy: { id: pharmacy.id, email: pharmacy.email, businessName: pharmacy.businessName },
    };
  },

  async uploadLicense(pharmacyId: string, filePath: string) {
    // AI scoring is review support only (CON-010) - it never sets
    // licenseStatus to APPROVED itself.
    const analysis = await analyzeLicense(filePath);
    const pharmacy = await pharmacyRepository.attachLicenseDocument(pharmacyId, filePath, analysis);

    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "LICENSE_UPLOADED",
      entityType: "Pharmacy",
      entityId: pharmacyId,
      metadata: { riskScore: analysis.riskScore, confidence: analysis.confidence },
    });

    return { licenseStatus: pharmacy.licenseStatus, aiScore: analysis };
  },

  async getProfile(pharmacyId: string) {
    const pharmacy = await pharmacyRepository.findById(pharmacyId);
    if (!pharmacy) throw ApiError.notFound("Pharmacy not found");
    const { passwordHash, ...safe } = pharmacy;
    return safe;
  },

  async deleteAccount(pharmacyId: string) {
    await pharmacyRepository.softDelete(pharmacyId);
    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "PHARMACY_ACCOUNT_DELETED",
      entityType: "Pharmacy",
      entityId: pharmacyId,
    });
    return { deleted: true };
  },
};
