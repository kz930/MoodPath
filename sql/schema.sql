CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    locale TEXT NOT NULL DEFAULT 'zh-CN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    journal_text TEXT NOT NULL DEFAULT '',
    mood_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    sleep_hours NUMERIC(4,2) NOT NULL,
    energy_score SMALLINT NOT NULL CHECK (energy_score BETWEEN 1 AND 10),
    stress_score SMALLINT NOT NULL CHECK (stress_score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS emotion_outputs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    primary_emotion TEXT NOT NULL,
    secondary_emotion TEXT,
    valence NUMERIC(3,2) NOT NULL,
    arousal NUMERIC(3,2) NOT NULL,
    intensity NUMERIC(3,2) NOT NULL,
    confidence NUMERIC(3,2) NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, analysis_date)
);

CREATE TABLE IF NOT EXISTS pattern_outputs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    trend TEXT NOT NULL,
    patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
    triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(3,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, analysis_date)
);

CREATE TABLE IF NOT EXISTS intervention_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    selected_intervention TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_min SMALLINT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    fallback TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, plan_date)
);

CREATE TABLE IF NOT EXISTS reflection_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    intervention_type TEXT NOT NULL,
    completed BOOLEAN NOT NULL,
    helpfulness SMALLINT NOT NULL CHECK (helpfulness BETWEEN 1 AND 5),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_flags (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_date DATE NOT NULL,
    risk_level TEXT NOT NULL,
    risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    safe_response TEXT NOT NULL,
    resource_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, risk_date)
);
