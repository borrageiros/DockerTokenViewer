import axios from 'axios';
import storage from '../utils/storage';

const location = window.location.origin;
const proxyUrl = location + '/api';

function redirectToLogin(window: Window) {
	window.location.reload();
}

export async function getRepositories(options: { ordering?: string, namespace?: string, search?: string } = {}, window: Window) {
	const token = storage.getCookie('DTVAuth');
	const repository = storage.getCookie('DTVRepository');
	
	if (!token || !repository) {
		redirectToLogin(window);
		return;
	}
	
	try {
		let allResults = [];
		let currentPage = 1;
		let totalCount = 0;
		
		const initialParams: any = {
			page: 1,
			page_size: 100,
			...options
		};

		const initialResponse = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}`, {
			headers: {
				Authorization: `JWT ${token}`
			},
			params: initialParams
		});

		totalCount = initialResponse.data.count;
		allResults = [...initialResponse.data.results];

		const totalPages = Math.ceil(totalCount / 100);

		for (let page = 2; page <= totalPages; page++) {
			const response = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}`, {
				headers: {
					Authorization: `JWT ${token}`
				},
				params: {
					...options,
					page,
					page_size: 100
				}
			});
			allResults = [...allResults, ...response.data.results];
		}

		return {
			count: totalCount,
			results: allResults
		};
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}

export async function getRepositoryTags(selectedRepo: string, options: { page?: number, page_size?: number, name?: string, ordering?: string } = {}, window: Window) {
	const token = storage.getCookie('DTVAuth');
	const repository = storage.getCookie('DTVRepository');
	
	if (!token || !repository) {
		redirectToLogin(window);
		return;
	}
	
	try {
		let allResults = [];
		let totalCount = 0;
		
		const initialParams: any = {
			page: 1,
			page_size: 100,
			...options
		};

		const initialResponse = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}/${selectedRepo}/tags`, {
			headers: {
				Authorization: `JWT ${token}`
			},
			params: initialParams
		});

		totalCount = initialResponse.data.count;
		allResults = [...initialResponse.data.results];

		const totalPages = Math.ceil(totalCount / 100);

		for (let page = 2; page <= totalPages; page++) {
			const response = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}/${selectedRepo}/tags`, {
				headers: {
					Authorization: `JWT ${token}`
				},
				params: {
					...options,
					page,
					page_size: 100
				}
			});
			allResults = [...allResults, ...response.data.results];
		}

		return {
			count: totalCount,
			results: allResults
		};
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}

export async function getTagDetails(repo: string, tag: string, window: Window) {
	const token = storage.getCookie('DTVAuth');
	const repository = storage.getCookie('DTVRepository');
	
	if (!token || !repository) {
		redirectToLogin(window);
		return;
	}
	
	try {
		const response = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}/${repo}/tags/${tag}`, {
			headers: {
				Authorization: `JWT ${token}`
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}

export async function proxy(url: string, window: Window) {
	const token = storage.getCookie('DTVAuth');
	
	if (!token) {
		redirectToLogin(window);
		return;
	}
	
	try {
		const response = await axios.get(`${proxyUrl}/${url}`, {
			headers: {
				Authorization: `JWT ${token}`
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}