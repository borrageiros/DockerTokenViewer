import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { config } from '$lib/stores/config';
import { DOCKER_HUB_URL } from '$lib/consts';

export function formatBytes(bytes: number | undefined | null): string {
	if (!bytes || bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatNumber(num: number | undefined | null): string {
	if (num === undefined || num === null) return '0';
	return num.toLocaleString();
}

export function formatDate(
	dateString: string | undefined | null,
	locale: 'es' | 'en' = 'es'
): string {
	if (!dateString) return '-';
	try {
		const localeCode = locale === 'es' ? 'es-ES' : 'en-US';
		return new Date(dateString).toLocaleDateString(localeCode, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return '-';
	}
}

export function isToday(dateString: string | undefined | null): boolean {
	if (!dateString) return false;
	const today = new Date();
	const date = new Date(dateString);

	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

export function isYesterday(dateString: string | undefined | null): boolean {
	if (!dateString) return false;
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const date = new Date(dateString);
	return (
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear()
	);
}

export function isThisWeek(dateString: string | undefined | null): boolean {
	if (!dateString) return false;
	const today = new Date();
	const date = new Date(dateString);
	const diffTime = Math.abs(today.getTime() - date.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays <= 7 && !isToday(dateString) && !isYesterday(dateString);
}

export async function copyToClipboard(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
	} catch (err) {
		console.error('Failed to copy to clipboard:', err);
		throw err;
	}
}

export function copyTag(tagName: string): Promise<void> {
	return copyToClipboard(tagName);
}

export function copyImageTag(imageName: string, tagName: string): Promise<void> {
	return copyToClipboard(`${imageName}:${tagName}`);
}

export function copyRepoImageTag(imageName: string, tagName: string): Promise<void> {
	const repo = get(config.getActiveAccount())?.organization;
	return copyToClipboard(`${repo}/${imageName}:${tagName}`);
}

export function copyPullCommand(imageName: string, tagName: string): Promise<void> {
	return copyToClipboard(getPullCommand(imageName, tagName));
}

export function getPullCommand(imageName: string, tagName: string): string {
	const repo = get(config.getActiveAccount())?.organization;
	return `docker pull ${repo}/${imageName}:${tagName}`;
}

export function createClickOutsideHandler(
	isOpenStore: Writable<boolean>,
	containerSelector: string
): (event: Event) => void {
	return function handleClickOutside(event: Event) {
		const target = event.target as HTMLElement;
		if (!target.closest(containerSelector)) {
			isOpenStore.set(false);
		}
	};
}

export function createDropdownManager<T>(initialValue: T | null = null) {
	let openDropdown: T | null = initialValue;

	function toggle(value: T): void {
		openDropdown = openDropdown === value ? null : value;
	}

	function close(): void {
		openDropdown = null;
	}

	function isOpen(value: T): boolean {
		return openDropdown === value;
	}

	return {
		toggle,
		close,
		isOpen,
		get current() {
			return openDropdown;
		}
	};
}

export function getLatestFromResults<T extends { last_updated: string }>(results: T[]): T | null {
	if (results.length === 0) return null;

	return results.reduce((latest, current) => {
		const latestDate = new Date(latest.last_updated);
		const currentDate = new Date(current.last_updated);
		return currentDate > latestDate ? current : latest;
	});
}

export function isTokenExpired(token: string): boolean {
	try {
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
		const expiry = payload.exp * 1000;
		return Date.now() > expiry;
	} catch {
		return true;
	}
}

export async function getDockerHubToken(user: string, token: string) {
	const data = await fetch(`${DOCKER_HUB_URL}/v2/auth/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			identifier: user,
			secret: token
		})
	});
	return data.json();
}
