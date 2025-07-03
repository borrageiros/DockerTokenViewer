import { goto } from '$app/navigation';

const proxy = '/api/proxy';

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
async function fetchWithAuth<T>(
	endpoint: string,
	params?: Record<string, string | number | undefined>,
	timeout = 10000
): Promise<T> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	const url = params ? `${endpoint}?${buildQueryString(params)}` : `${endpoint}`;

	const response = await fetch(url, {
		headers: {
			Accept: 'application/json'
		},
		signal: controller.signal
	});

	clearTimeout(timer);

	if (response.status === 401) {
		if (typeof window !== 'undefined') {
			goto('/login');
		}
		throw new Error('Authentication failed');
	}

	if (!response.ok) {
		console.error(`HTTP error: ${response.status} ${response.statusText}`);
		throw new Error(`Request failed: ${response.status}`);
	}

	const data: T = await response.json();
	return data;
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
	options: { ordering?: string; namespace?: string; name?: string } = {}
): Promise<RepositoriesResponse> {
	let allResults: Repository[] = [];
	let totalCount = 0;
	let page = 1;

	do {
		const params = {
			page,
			page_size: 100,
			...options
		};

		const data = await fetchWithAuth<RepositoriesResponse>(`${proxy}/v2/repositories`, params);

		if (page === 1) totalCount = data.count;
		allResults = allResults.concat(data.results);
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

export async function getTagDetails(repo: string, tag: string): Promise<Tag> {
	const data = await fetchWithAuth<Tag>(`${proxy}/v2/repositories/${repo}/tags/${tag}`);
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

export async function login(token: string, repository: string, remember: boolean = false) {
	const data = await fetch('/api/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token, repository, remember })
	});
	return data;
}
