export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  role: 'user' | 'admin';
  email_verified_at: Date | null;
}
