import { ApiError } from "../../common/ApiError";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateVerificationToken } from "../../utils/otp";
import { signToken } from "../../utils/jwt";
import { patientRepository } from "./patient.repository";
import { sendVerificationEmail } from "../notification/email.client";
import { recordAudit } from "../administration/audit.service";
import { LoginPatientInput, RegisterPatientInput } from "./patient.schema";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export const patientService = {
  async register(input: RegisterPatientInput) {
    const existing = await patientRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const patient = await patientRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      preferredLanguage: input.preferredLanguage,
    });

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await patientRepository.createVerificationToken(token, patient.id, expiresAt);
    await sendVerificationEmail(patient.email, token);

    await recordAudit({
      actorId: patient.id,
      actorType: "PATIENT",
      action: "PATIENT_REGISTERED",
      entityType: "Patient",
      entityId: patient.id,
    });

    return { id: patient.id, email: patient.email, fullName: patient.fullName };
  },

  async verifyEmail(token: string) {
    const record = await patientRepository.findValidVerificationToken(token);
    if (!record || !record.patientId) throw ApiError.badRequest("Invalid or expired token");

    await patientRepository.markEmailVerified(record.patientId);
    await patientRepository.consumeVerificationToken(record.id);

    return { verified: true };
  },

  async login(input: LoginPatientInput) {
    const patient = await patientRepository.findByEmail(input.email);
    if (!patient) throw ApiError.unauthorized("Invalid email or password");

    const valid = await comparePassword(input.password, patient.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    if (!patient.emailVerified) {
      throw ApiError.forbidden("Please verify your email before logging in");
    }

    const token = signToken({ sub: patient.id, role: "PATIENT", email: patient.email });
    return { token, patient: { id: patient.id, email: patient.email, fullName: patient.fullName } };
  },

  async getProfile(patientId: string) {
    const patient = await patientRepository.findById(patientId);
    if (!patient) throw ApiError.notFound("Patient not found");
    const { passwordHash, ...safe } = patient;
    return safe;
  },

  async deleteAccount(patientId: string) {
    await patientRepository.softDelete(patientId);
    await recordAudit({
      actorId: patientId,
      actorType: "PATIENT",
      action: "PATIENT_ACCOUNT_DELETED",
      entityType: "Patient",
      entityId: patientId,
    });
    return { deleted: true };
  },
};
