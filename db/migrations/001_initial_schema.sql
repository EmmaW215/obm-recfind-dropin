-- RecFindOBM — Initial Database Schema (Supabase PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;

-- Facilities: physical locations
CREATE TABLE IF NOT EXISTS facilities (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    facility_type   VARCHAR(50) NOT NULL,
    address         VARCHAR(500) NOT NULL,
    location        GEOMETRY(Point, 4326) NOT NULL,
    phone           VARCHAR(20),
    website_url     VARCHAR(500),
    amenities       TEXT[],
    has_pool        BOOLEAN DEFAULT FALSE,
    has_arena       BOOLEAN DEFAULT FALSE,
    has_fitness     BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities (facility_type);

-- Activities: individual drop-in program instances
CREATE TABLE IF NOT EXISTS activities (
    id              VARCHAR(50) PRIMARY KEY,
    program_id      VARCHAR(20),
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    age_group       VARCHAR(20) NOT NULL,
    facility_id     VARCHAR(50) NOT NULL REFERENCES facilities(id),
    room            VARCHAR(200),
    date            DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    cost_amount     DECIMAL(8,2) DEFAULT 0.00,
    cost_type       VARCHAR(10) DEFAULT 'free',
    spots_left      INTEGER,
    is_full         BOOLEAN DEFAULT FALSE,
    activity_type   VARCHAR(20) DEFAULT 'drop_in',
    source_category VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_facility ON activities (facility_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities (category);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities (date);
CREATE INDEX IF NOT EXISTS idx_activities_date_time ON activities (date, start_time);
CREATE INDEX IF NOT EXISTS idx_activities_search
    ON activities (date, category, age_group, cost_type, facility_id);
