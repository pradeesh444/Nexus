import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  const digest = scryptSync(password, salt, 64);
  return timingSafeEqual(Buffer.from(key, "hex"), digest);
}
export const permissions = {
  owner: [
    "inventory",
    "sales",
    "hr",
    "finance",
    "procurement",
    "audit",
    "users",
  ],
  manager: ["inventory", "sales", "hr", "finance", "procurement", "audit"],
  staff: ["inventory", "sales"],
  hr: ["hr"],
  accountant: ["finance"],
};
export const publicUser = ({ id, name, email, role }) => ({
  id,
  name,
  email,
  role,
  permissions: permissions[role],
});
