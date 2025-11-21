import bcrypt from "bcryptjs";
import User from "@/models/User";

let ensureAdminPromise: Promise<void> | null = null;

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin User";

  if (!adminEmail || !adminPassword) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[BandHub] ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping automatic admin bootstrap."
      );
    }
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail });
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (!existingAdmin) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });
    return;
  }

  let shouldUpdate = false;

  if (existingAdmin.role !== "admin") {
    existingAdmin.role = "admin";
    shouldUpdate = true;
  }

  if (existingAdmin.status !== "active") {
    existingAdmin.status = "active";
    shouldUpdate = true;
  }

  if (!existingAdmin.password) {
    existingAdmin.password = hashedPassword;
    shouldUpdate = true;
  }

  if (existingAdmin.password) {
    const matches = await bcrypt.compare(adminPassword, existingAdmin.password);
    if (!matches) {
      existingAdmin.password = hashedPassword;
      shouldUpdate = true;
    }
  }

  if (existingAdmin.name !== adminName) {
    existingAdmin.name = adminName;
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    await existingAdmin.save();
  }
}

export function ensureAdminUser() {
  if (!ensureAdminPromise) {
    ensureAdminPromise = ensureAdmin().catch((err) => {
      console.error("[BandHub] Failed to ensure admin user:", err);
    });
  }
  return ensureAdminPromise;
}
