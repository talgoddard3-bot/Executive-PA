-- Article Favourites
CREATE TABLE IF NOT EXISTS article_favourites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  brief_id    UUID REFERENCES briefs(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,
  item_index  INTEGER NOT NULL,
  headline    TEXT NOT NULL,
  section_label TEXT NOT NULL,
  brief_week_of DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, brief_id, section, item_index)
);

-- Article Comments
CREATE TABLE IF NOT EXISTS article_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  brief_id    UUID REFERENCES briefs(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,
  item_index  INTEGER NOT NULL,
  body        TEXT NOT NULL,
  mentions    TEXT[] DEFAULT '{}',  -- user_ids mentioned via @
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,           -- recipient
  from_user_id UUID,                   -- who triggered it
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,           -- 'mention'
  brief_id    UUID REFERENCES briefs(id) ON DELETE CASCADE,
  section     TEXT,
  item_index  INTEGER,
  headline    TEXT,                    -- article headline for context
  comment_body TEXT,                   -- snippet of the comment
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
