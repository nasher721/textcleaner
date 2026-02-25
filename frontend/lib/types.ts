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

export interface InferenceEntity {
    label: string;
    text: string;
    start_char: number;
    end_char: number;
    prob: number;
    negated: boolean;
    temporal: boolean;
}

export interface InferenceResult {
    cleaned_text: string;
    structured_json: Record<string, unknown>;
    confidence: {
        sentence_keep_probs: Array<{ sentence: string; prob_keep: number }>;
        entities: InferenceEntity[];
    };
    warnings: string[];
    meta: {
        model_version_id: string | null;
        keep_threshold: number;
        kept_sentence_count: number;
        total_sentence_count: number;
    };
}
