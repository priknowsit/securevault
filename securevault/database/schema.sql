-- PostgreSQL schema blueprint for SECUREVAULT Enterprise
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- File Metadata record matches standard custom B-Tree definitions
CREATE TABLE file_metadata (
    file_id VARCHAR(128) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    file_sha256 VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_location VARCHAR(256) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chunk layout to record subsegments maps (Supports parallel deduplication logic)
CREATE TABLE storage_chunk_mapping (
    chunk_hash VARCHAR(64) PRIMARY KEY,
    reference_count INT DEFAULT 1,
    size_bytes REAL NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE file_chunk_junction (
    file_id VARCHAR(128) REFERENCES file_metadata(file_id) ON DELETE CASCADE,
    chunk_hash VARCHAR(64) REFERENCES storage_chunk_mapping(chunk_hash),
    chunk_index INT NOT NULL,
    PRIMARY KEY(file_id, chunk_index)
);

-- Immutable audit logs table partitioned by timestamp for performance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor VARCHAR(64) NOT NULL,
    user_action VARCHAR(32) NOT NULL,
    target_resource VARCHAR(128) NOT NULL,
    operation_status VARCHAR(16) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes optimized for heavy lookup rates
CREATE INDEX idx_metadata_owner ON file_metadata(owner_id);
CREATE INDEX idx_audit_timeline ON audit_logs(recorded_at DESC);
