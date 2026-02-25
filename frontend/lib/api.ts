import { DashboardStats, InferenceResult, Model, Note } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || response.statusText);
    }

    return response.json();
}

export const api = {
    stats: {
        get: () => request<DashboardStats>('/api/dashboard/stats'),
    },
    models: {
        list: () => request<Model[]>('/api/models'),
        train: (config: any) => request('/api/train', { method: 'POST', body: JSON.stringify(config) }),
        progress: () => request<{ status: string; progress: number }>('/api/train/progress'),
    },
    notes: {
        all: () => request<Note[]>('/api/notes/all'),
        search: (q: string) => request<Note[]>(`/api/notes/search?q=${q}`),
    },
    inference: {
        run: (text: string, modelId?: string, threshold?: number) =>
            request<InferenceResult>('/api/infer', {
                method: 'POST',
                body: JSON.stringify({ text, model_version_id: modelId, keep_threshold: threshold }),
            }),
        batch: (texts: string[], modelId?: string, threshold?: number) =>
            request<{ count: number; results: InferenceResult[] }>('/api/infer/batch/export', {
                method: 'POST',
                body: JSON.stringify({ texts, model_version_id: modelId, keep_threshold: threshold }),
            }),
    },
    labeling: {
        sentences: () => request<any[]>('/api/sentences'),
        submit: (id: string, label: string) =>
            request(`/api/sentences/${id}/label`, {
                method: 'POST',
                body: JSON.stringify({ label }),
            }),
    },
};
