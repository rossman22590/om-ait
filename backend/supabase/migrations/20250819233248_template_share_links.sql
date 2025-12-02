BEGIN;

CREATE TABLE IF NOT EXISTS template_share_links (
    share_id VARCHAR(12) PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES agent_templates(template_id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_template_share_links_template_id ON template_share_links(template_id);
CREATE INDEX IF NOT EXISTS idx_template_share_links_created_by ON template_share_links(created_by);
CREATE INDEX IF NOT EXISTS idx_template_share_links_created_at ON template_share_links(created_at DESC);

ALTER TABLE template_share_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'template_share_links' 
        AND policyname = 'Share links are publicly viewable'
    ) THEN
        CREATE POLICY "Share links are publicly viewable" ON template_share_links FOR SELECT
    USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'template_share_links' 
        AND policyname = 'Template creators can create share links'
    ) THEN
        CREATE POLICY "Template creators can create share links" ON template_share_links FOR INSERT
    WITH CHECK (
        created_by = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM agent_templates 
            WHERE template_id = template_share_links.template_id 
            AND creator_id = auth.uid()
        )
    );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'template_share_links' 
        AND policyname = 'Share link creators can update their links'
    ) THEN
        CREATE POLICY "Share link creators can update their links" ON template_share_links FOR UPDATE
    USING (created_by = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'template_share_links' 
        AND policyname = 'Share link creators can delete their links'
    ) THEN
        CREATE POLICY "Share link creators can delete their links" ON template_share_links FOR DELETE
    USING (created_by = auth.uid());
    END IF;
END $$;

COMMIT; 