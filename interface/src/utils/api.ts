import axios from 'axios';
import storage from '../utils/storage';

const proxyUrl = window.location.origin + '/api';
// const proxyUrl = 'http://localhost:3000/api';

export async function getRepositories(options: { ordering?: string, namespace?: string, search?: string } = {}) {
	const token = storage.get('DTVAuth');
	const repository = storage.get('DTVRepository');
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
		console.error('Error fetching Docker repositories:', error);
		throw error;
	}
}

export async function getRepositoryTags(selectedRepo: string, options: { page?: number, page_size?: number, name?: string, ordering?: string } = {}) {
	const token = storage.get('DTVAuth');
	const repository = storage.get('DTVRepository');
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
		console.error('Error fetching repository tags:', error);
		throw error;
	}
}

export async function getTagDetails(repo: string, tag: string) {
	const token = storage.get('DTVAuth');
	const repository = storage.get('DTVRepository');
	try {
		const response = await axios.get(`${proxyUrl}/https://hub.docker.com/v2/repositories/${repository}/${repo}/tags/${tag}`, {
			headers: {
				Authorization: `JWT ${token}`
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching tag details:', error);
		throw error;
	}
}

export async function proxy(url: string) {
	const token = storage.get('DTVAuth');
	try {
		const response = await axios.get(`${proxyUrl}/${url}`, {
			headers: {
				Authorization: `JWT ${token}`
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching tag details:', error);
		throw error;
	}
}