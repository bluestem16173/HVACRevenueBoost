-- Crawl / render gate: some environments used `pages.noindex` to hold pages offline until cleared.
ALTER TABLE pages ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false;
