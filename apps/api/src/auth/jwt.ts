import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: "admin" | "viewer";
  // Headset clients use a different `kind` so we can route by claim.
  kind: "user" | "headset";
}

export function signToken(payload: JwtPayload, opts?: SignOptions): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    ...opts,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
