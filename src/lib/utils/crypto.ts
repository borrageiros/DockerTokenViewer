// src/lib/server/encryption.ts
import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = env.PRIVATE_SECRET_KEY;
const IV_LENGTH = 16;

function getKey() {
	if (!SECRET_KEY) throw new Error('SECRET_KEY no definida');
	return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

export function encrypt(data: object): string {
	const json = JSON.stringify(data);
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
	let encrypted = cipher.update(json, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	const ivBase64 = iv.toString('base64');
	return `${ivBase64}:${encrypted}`;
}

export function decrypt(encryptedData: string): object {
	const [ivBase64, encrypted] = encryptedData.split(':');
	const iv = Buffer.from(ivBase64, 'base64');
	const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
	let decrypted = decipher.update(encrypted, 'base64', 'utf8');
	decrypted += decipher.final('utf8');
	return JSON.parse(decrypted);
}
