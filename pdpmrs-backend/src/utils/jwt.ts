import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type Role = "PATIENT" | "PHARMACY" | "ADMIN";

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}
