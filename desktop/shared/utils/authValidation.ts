/* ────────── imports ────────── */
import { ApiError } from "./ApiError";
import { ROLES, type Role } from "../constants/permissions";
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
/* ────────── canonical Bangladesh or international mobile identifiers ────────── */
export function phoneNumber(value: unknown): string {
  if (typeof value !== "string") throw new ApiError(400, "Enter a mobile number");
  let phone = value.replace(/[\s()-]/g, "");
  if (/^01[3-9]\d{8}$/.test(phone)) phone = "+88" + phone;
  if (/^8801[3-9]\d{8}$/.test(phone)) phone = "+" + phone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new ApiError(400, "Enter a valid mobile number, such as 01712345678");
  return phone;
}
export function loginIdentifier(value: unknown): string {
  return typeof value === "string" && value.includes("@") ? emailAddress(value) : phoneNumber(value);
}
export function emailAddress(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(value.trim())
  )
    throw new ApiError(400, "Enter a valid email address");
  return value.trim().toLowerCase();
}
export function passwordValue(value: unknown, minimum: 6 | 12 = 12): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    Buffer.byteLength(value, "utf8") > 72
  )
    throw new ApiError(
      400,
      `পাসওয়ার্ড কমপক্ষে ${minimum} অক্ষর এবং সর্বোচ্চ ৭২ UTF-8 bytes হতে হবে`
    );
  return value;
}
export function userName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.trim().length > 80
  )
    throw new ApiError(400, "Name must be 2–80 characters");
  return value.trim();
}
export function roleValue(value: unknown): Role {
  if (typeof value !== "string" || !ROLES.includes(value as Role))
    throw new ApiError(400, "Invalid role");
  return value as Role;
}
