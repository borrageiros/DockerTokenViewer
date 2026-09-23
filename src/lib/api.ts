import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { setBaseRepository } from '$lib/stores/repository';
import { config } from '$lib/stores/config';

const proxy = '/api/proxy';
const TAG_SEARCH_CONCURRENCY = 5;
const TAG_SEARCH_PAGE_SIZE = 100;
const TAG_SEARCH_MAX_PAGES = 3;

export class RequestError extends Error {
	status: number;

	constructor(status: number) {
		super(`Request failed: ${status}`);
		this.name = 'RequestError';
		this.status = status;
	}
}

let redirectingToLogin = false;

// Serialize object to query string
function buildQueryString(params: Record<string, string | number | undefined>): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			query.append(key, String(value));
		}
	}
	return query.toString();
}

// Fetch wrapper with token, timeout, error handling
function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('Aborted', 'AbortError'));
			return;
		}

		const timeout = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);

		const onAbort = () => {
			clearTimeout(timeout);
			reject(new DOMException('Aborted', 'AbortError'));
		};

		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

async function fetchWithAuth<T>(
	endpoint: string,
	params?: Record<string, string | number | undefined>,
	timeout = 10000,
	signal?: AbortSignal
): Promise<T> {
	const activeAccount = get(config.getActiveAccount());
	if (!activeAccount) {
		goto('/login');
		throw new Error('No active account found');
	}

	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}

	const controller = new AbortController();
	let timedOut = false;
	const timer = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, timeout);
	const onAbort = () => controller.abort();
	signal?.addEventListener('abort', onAbort);

	const url = params ? `${endpoint}?${buildQueryString(params)}` : `${endpoint}`;

	try {
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json',
				Account: activeAccount.data
			},
			signal: controller.signal
		});

		if (response.status === 401) {
			if (typeof window !== 'undefined' && !redirectingToLogin) {
				redirectingToLogin = true;
				setBaseRepository(null);
				goto('/login');
			}
			throw new RequestError(401);
		}

		if (!response.ok) {
			console.error(`HTTP error: ${response.status} ${response.statusText}`);
			throw new RequestError(response.status);
		}

		redirectingToLogin = false;
		const data: T = await response.json();
		return data;
	} catch (error) {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}
		if (timedOut) {
			throw new Error('Request timeout');
		}
		throw error;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', onAbort);
	}
}

// Types
export interface Repository {
	name: string;
	namespace: string;
	repository_type: string;
	status: number;
	description: string;
	status_description: string;
	is_private: boolean;
	star_count: number;
	pull_count: number;
	last_updated: string;
	last_modified: string;
	date_registered: string;
	affiliation: string;
	media_types: string[];
	content_types: string[];
	categories: string[];
	storage_size: number;
}

export interface RepositoriesResponse {
	count: number;
	results: Repository[];
}

interface ImageInfo {
	architecture: string;
	features: string;
	variant: string | null;
	digest: string;
	os: string;
	os_features: string;
	os_version: string | null;
	size: number;
	status: string;
	last_pulled: string;
	last_pushed: string;
}

export interface Tag {
	name: string;
	full_size: number;
	last_updated: string;
	creator: number;
	id: number;
	images: ImageInfo[];
	last_updater: number;
	last_updater_username: string;
	repository: number;
	v2: boolean;
	tag_status: string;
	tag_last_pulled: string;
	tag_last_pushed: string;
	media_type: string;
	content_type: string;
	digest: string;
}

interface TagsResponse {
	count: number;
	results: Tag[];
	next: string | null;
}

// --- API FUNCTIONS ---

export async function getRepositories(
	options: { ordering?: string; namespace?: string; name?: string; signal?: AbortSignal } = {}
): Promise<RepositoriesResponse> {
	const { signal, ...queryOptions } = options;
	let allResults: Repository[] = [];
	let totalCount = 0;
	let page = 1;

	do {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		const params = {
			page,
			page_size: 100,
			...queryOptions
		};

		const data = await fetchWithAuth<RepositoriesResponse>(
			`${proxy}/v2/repositories`,
			params,
			10000,
			signal
		);

		if (page === 1) totalCount = data.count;
		allResults = allResults.concat(data.results ?? []);
		page++;
	} while (allResults.length < totalCount);

	return {
		count: totalCount,
		results: allResults
	};
}

export async function getRepositoryTags(
	selectedRepo: string,
	options: { page?: number; page_size?: number; name?: string; ordering?: string } = {}
): Promise<{
	count: number;
	results: Tag[];
	next: boolean;
	page: number;
}> {
	const params = {
		page: options.page || 1,
		page_size: options.page_size || 15,
		...options
	};

	const data = await fetchWithAuth<TagsResponse>(
		`${proxy}/v2/repositories/${selectedRepo}/tags`,
		params
	);

	return {
		count: data.count,
		results: data.results,
		next: !!data.next,
		page: params.page
	};
}

export interface TagSearchMatch {
	repository: string;
	tag: Tag;
}

export interface TagSearchUpdate {
	completed: number;
	total: number;
	failed: number;
	matches: TagSearchMatch[];
}

async function getMatchingTags(
	repository: string,
	query: string,
	signal?: AbortSignal
): Promise<Tag[]> {
	const matches: Tag[] = [];
	let page = 1;
	let totalCount = 0;

	do {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		const params = {
			page,
			page_size: TAG_SEARCH_PAGE_SIZE,
			name: query
		};
		const endpoint = `${proxy}/v2/repositories/${repository}/tags`;

		let data: TagsResponse;
		try {
			data = await fetchWithAuth<TagsResponse>(endpoint, params, 15000, signal);
		} catch (error) {
			if (error instanceof RequestError && error.status === 429) {
				await wait(1000, signal);
				data = await fetchWithAuth<TagsResponse>(endpoint, params, 15000, signal);
			} else {
				throw error;
			}
		}

		const pageResults = data.results ?? [];
		if (page === 1) totalCount = data.count ?? pageResults.length;
		matches.push(...pageResults);
		page++;
	} while (matches.length < totalCount && page <= TAG_SEARCH_MAX_PAGES);

	return matches;
}

export async function searchTagsAcrossRepositories(
	query: string,
	repositories: { name: string }[],
	options: {
		signal?: AbortSignal;
		onRepositoryDone?: (update: TagSearchUpdate) => void;
	} = {}
): Promise<{ matches: TagSearchMatch[]; failed: number }> {
	const trimmed = query.trim();
	if (!trimmed || repositories.length === 0) {
		return { matches: [], failed: 0 };
	}

	const { signal, onRepositoryDone } = options;
	const total = repositories.length;
	const allMatches: TagSearchMatch[] = [];
	let completed = 0;
	let failed = 0;
	let nextIndex = 0;

	async function worker() {
		while (!signal?.aborted) {
			const index = nextIndex++;
			if (index >= repositories.length) return;

			const repository = repositories[index].name;
			let matches: TagSearchMatch[] = [];

			try {
				const tags = await getMatchingTags(repository, trimmed, signal);
				matches = tags.map((tag) => ({ repository, tag }));
				allMatches.push(...matches);
			} catch (error) {
				if (signal?.aborted || isAbortError(error)) return;
				if (error instanceof RequestError && error.status === 401) throw error;
				if (!(error instanceof RequestError && error.status === 404)) {
					failed++;
				}
			}

			if (signal?.aborted) return;

			completed++;
			onRepositoryDone?.({
				completed,
				total,
				failed,
				matches
			});
		}
	}

	const workerCount = Math.min(TAG_SEARCH_CONCURRENCY, repositories.length);
	await Promise.all(Array.from({ length: workerCount }, () => worker()));

	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}

	return { matches: allMatches, failed };
}

export async function getTagDetails(repo: string, tag: string): Promise<Tag> {
	const data = await fetchWithAuth<Tag>(`${proxy}/v2/repositories/${repo}/tags/${tag}`);
	return data;
}

export async function deleteAuthCookie() {
	const data = await fetch('/api/delete-auth-cookie', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	return data;
}

export async function logout() {
	const data = await fetch('/api/logout', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	goto('/login');
	return data;
}

export async function login(token: string, organization: string, user: string) {
	const data = await fetch('/api/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token, organization, user })
	});
	return data;
}
