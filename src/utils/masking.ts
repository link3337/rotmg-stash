/**
 * Masks an email address by replacing parts of it with asterisks.
 *
 * - If the email starts with 'steamworks:', the part after the colon is masked.
 * - If the email contains '@', both the username and domain parts are masked.
 * - If the email is empty, an empty string is returned.
 *
 * @param email - The email address to be masked.
 * @returns The masked email address.
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  if (email.startsWith('steamworks:')) {
    const [steamworks, steam64Id] = email.split(':');
    return `${steamworks}:${'*'.repeat(steam64Id.length)}`;
  } else if (email.includes('@')) {
    const [username, domain] = email.split('@');
    return `${'*'.repeat(username.length)}@${'*'.repeat(domain?.length)}`;
  }
  return email;
};
