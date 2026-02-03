/**
 * Check if an email address belongs to an admin user.
 * Admin is identified by the ADMIN_EMAIL environment variable.
 */
export function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !email) {
    return false
  }
  return email === adminEmail
}
