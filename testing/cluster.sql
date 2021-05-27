CREATE TABLE media (
  id TEXT NOT NULL PRIMARY KEY,
  owner_pub_key TEXT NOT NULL,
  name TEXT,
  description TEXT,
  price BIGINT,
  tags TEXT[] not null default '{}',
  ttl BIGINT,
  filename TEXT,
  size BIGINT,
  mime TEXT,
  nonce TEXT,
  created timestamptz,
  updated timestamptz,
  expiry timestamptz, -- optional permanent deletion of file
  total_sats BIGINT,
  total_buys BIGINT,
  template boolean,
  width INT,
  height INT
);

ALTER TABLE media ADD COLUMN tsv tsvector;

CREATE INDEX media_tsv ON media USING GIN(tsv);



CREATE TABLE tribes (
  uuid TEXT NOT NULL PRIMARY KEY,
  owner_pub_key TEXT NOT NULL,
  owner_alias TEXT,
  group_key TEXT,
  name TEXT,
  description TEXT,
  tags TEXT[] not null default '{}',
  img TEXT,
  price_to_join BIGINT,
  price_per_message BIGINT,
  escrow_amount BIGINT,
  escrow_millis BIGINT,
  created timestamptz,
  updated timestamptz,
  member_count BIGINT,
  unlisted boolean,
  private boolean,
  deleted boolean,
  app_url TEXT,
  feed_url TEXT,
  last_active BIGINT,
  bots TEXT,
  owner_route_hint TEXT,
  unique_name TEXT
);

ALTER TABLE tribes ADD COLUMN tsv tsvector;

CREATE INDEX tribes_tsv ON tribes USING GIN(tsv);



CREATE TABLE bots (
  uuid TEXT NOT NULL PRIMARY KEY,
  owner_pub_key TEXT NOT NULL,
  owner_alias TEXT,
  name TEXT,
  unique_name TEXT,
  description TEXT,
  tags TEXT[] not null default '{}',
  img TEXT,
  price_per_use BIGINT,
  created timestamptz,
  updated timestamptz,
  member_count BIGINT,
  unlisted boolean,
  deleted boolean
);

ALTER TABLE bots ADD COLUMN tsv tsvector;

CREATE INDEX bots_tsv ON bots USING GIN(tsv);





CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  owner_pub_key TEXT NOT NULL,
  owner_alias TEXT,
  owner_route_hint TEXT,
  owner_contact_key TEXT,
  description TEXT,
  tags TEXT[] not null default '{}',
  img TEXT,
  created timestamptz,
  updated timestamptz,
  unlisted boolean,
  deleted boolean,
  unique_name TEXT,
  price_to_meet BIGINT,
  twitter TEXT
);

ALTER TABLE people ADD COLUMN tsv tsvector;

CREATE INDEX people_tsv ON people USING GIN(tsv);