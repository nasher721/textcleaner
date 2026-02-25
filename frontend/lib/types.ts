export interface Note {
    id: string;
    text: string;
    date: string;
}

export interface Model {
    id: string;
    version: string;
    base_model: string;
    is_active: boolean;
    max_steps?: number;
    lr?: number;
    created_at: string;
}

export interface DashboardStats {
    notes: number;
    models: number;
    total_sentences: number;
    labeled_sentences: number;
    span_annotations: number;
    labeling_history: Array<{ day: string; count: number }>;
}

export interface InferenceResult {
    raw_text: string;
    cleaned_text: string;
    structured_json: Record<string, any>;
}
