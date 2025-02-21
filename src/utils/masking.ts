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
