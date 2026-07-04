import type { VercelRequest, VercelResponse } from '@vercel/node';

type CandidateSource = {
	name: string;
	url: string;
};

type TimeSample = {
	name: string;
	url: string;
	epochMs: number;
	measuredAt: number;
	rttMs: number;
};

type TimeApiSuccess = {
	ok: true;
	provider: 'cn-http-date' | 'server-fallback';
	source: string;
	epochMs: number;
	datetime: string;
	measuredAt: number;
	rttMs: number;
	samples: Array<{
		name: string;
		rttMs: number;
		measuredAt: number;
	}>;
	fallback?: boolean;
};

const CANDIDATE_SOURCES: CandidateSource[] = [
	{ name: 'Baidu', url: 'https://www.baidu.com/' },
	{ name: 'Tencent', url: 'https://www.qq.com/' },
	{ name: 'Bilibili', url: 'https://www.bilibili.com/' },
	{ name: 'JD', url: 'https://www.jd.com/' },
	{ name: 'Taobao', url: 'https://www.taobao.com/' },
];

const CACHE_TTL_MS = 15_000;
const UPSTREAM_TIMEOUT_MS = 2_500;

let memoryCache:
	| {
			expiresAt: number;
			payload: TimeApiSuccess;
	  }
	| null = null;

function setCors(res: VercelResponse) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length === 0) return Date.now();
	if (sorted.length % 2 === 1) return sorted[mid];
	return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function fetchHttpDate(candidate: CandidateSource): Promise<TimeSample> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
	const startedAt = Date.now();

	const doFetch = async (method: 'HEAD' | 'GET') => {
		return fetch(candidate.url, {
			method,
			cache: 'no-store',
			redirect: 'follow',
			signal: controller.signal,
			headers: {
				'user-agent': 'immersive-clock-time-sync/1.0',
				'cache-control': 'no-cache',
				pragma: 'no-cache',
			},
		});
	};

	try {
		let resp = await doFetch('HEAD');
		let dateHeader = resp.headers.get('date');

		if (!resp.ok || !dateHeader) {
			resp = await doFetch('GET');
			dateHeader = resp.headers.get('date');
		}

		const endedAt = Date.now();
		const rttMs = Math.max(0, endedAt - startedAt);

		if (!resp.ok) {
			throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
		}
		if (!dateHeader) {
			throw new Error('Missing Date header');
		}

		const headerEpochMs = Date.parse(dateHeader);
		if (!Number.isFinite(headerEpochMs)) {
			throw new Error(`Invalid Date header: ${dateHeader}`);
		}

		const adjustedEpochMs = headerEpochMs + Math.round(rttMs / 2);

		return {
			name: candidate.name,
			url: candidate.url,
			epochMs: adjustedEpochMs,
			measuredAt: endedAt,
			rttMs,
		};
	} finally {
		clearTimeout(timeout);
	}
}

async function buildTimePayload(): Promise<TimeApiSuccess> {
	if (memoryCache && Date.now() < memoryCache.expiresAt) {
		return memoryCache.payload;
	}

	const settled = await Promise.allSettled(
		CANDIDATE_SOURCES.map((item) => fetchHttpDate(item))
	);

	const successes = settled
		.filter((item): item is PromiseFulfilledResult<TimeSample> => item.status === 'fulfilled')
		.map((item) => item.value);

	if (successes.length === 0) {
		const now = Date.now();
		const payload: TimeApiSuccess = {
			ok: true,
			provider: 'server-fallback',
			source: 'server Date.now() fallback',
			epochMs: now,
			datetime: new Date(now).toISOString(),
			measuredAt: now,
			rttMs: 0,
			fallback: true,
			samples: [],
		};

		memoryCache = {
			expiresAt: Date.now() + 3_000,
			payload,
		};

		return payload;
	}

	const fastest = [...successes].sort((a, b) => a.rttMs - b.rttMs);
	const picked = fastest.slice(0, Math.min(3, fastest.length));

	const epochMs = median(picked.map((item) => item.epochMs));
	const measuredAt = Math.max(...picked.map((item) => item.measuredAt));
	const best = picked[0];

	const payload: TimeApiSuccess = {
		ok: true,
		provider: 'cn-http-date',
		source: picked.map((item) => item.name).join(', '),
		epochMs,
		datetime: new Date(epochMs).toISOString(),
		measuredAt,
		rttMs: best.rttMs,
		samples: picked.map((item) => ({
			name: item.name,
			rttMs: item.rttMs,
			measuredAt: item.measuredAt,
		})),
	};

	memoryCache = {
		expiresAt: Date.now() + CACHE_TTL_MS,
		payload,
	};

	return payload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	setCors(res);

	if (req.method === 'OPTIONS') {
		res.status(204).end();
		return;
	}

	if (req.method !== 'GET') {
		res.status(405).json({ ok: false, error: 'Method Not Allowed' });
		return;
	}

	try {
		const payload = await buildTimePayload();
		res.status(200).json(payload);
	} catch (error) {
		res.status(500).json({
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}