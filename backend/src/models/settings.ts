import pool from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';

interface Setting {
  id?: number;
  key: string;
  value: string;
  created_at?: Date;
  updated_at?: Date;
}

export const getSettings = async (): Promise<Setting[]> => {
  const result = await pool.query('SELECT id, key, value, created_at, updated_at FROM settings');
  return result.rows.map(row => ({
    ...row,
    value: row.key.includes('api_key') ? decrypt(row.value) : row.value
  }));
};

export const getSetting = async (key: string): Promise<Setting | null> => {
  const result = await pool.query('SELECT id, key, value, created_at, updated_at FROM settings WHERE key = $1', [key]);
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    ...row,
    value: row.key.includes('api_key') ? decrypt(row.value) : row.value
  };
};

export const saveSetting = async (key: string, value: string): Promise<Setting> => {
  const encryptedValue = key.includes('api_key') ? encrypt(value) : value;
  
  const updateResult = await pool.query(
    'UPDATE settings SET value = $1, updated_at = now() WHERE key = $2 RETURNING id, key, value, created_at, updated_at',
    [encryptedValue, key]
  );
  
  if (updateResult.rows.length === 0) {
    const insertResult = await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING id, key, value, created_at, updated_at',
      [key, encryptedValue]
    );
    return {
      ...insertResult.rows[0],
      value: key.includes('api_key') ? value : insertResult.rows[0].value
    };
  }
  
  return {
    ...updateResult.rows[0],
    value: key.includes('api_key') ? value : updateResult.rows[0].value
  };
};

export const deleteSetting = async (key: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM settings WHERE key = $1', [key]);
  return result.rowCount !== null && result.rowCount > 0;
};
