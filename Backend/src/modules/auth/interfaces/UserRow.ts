export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  role: 'user' | 'admin';
}
