create extension if not exists "pg_net" with schema "public" version '0.14.0';

CREATE TABLE IF NOT EXISTS "public"."google_oauth_tokens" (
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "encrypted_token" text,
    "token_hash" text,
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now(),
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."google_oauth_tokens" enable row level security;

CREATE UNIQUE INDEX IF NOT EXISTS google_oauth_tokens_pkey ON public.google_oauth_tokens USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS google_oauth_tokens_user_id_key ON public.google_oauth_tokens USING btree (user_id);

DO $$
BEGIN
    -- Check if constraint already exists (not just the index)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'google_oauth_tokens_pkey'
    ) AND EXISTS (
        -- Only try to use the index if it exists and isn't already a constraint
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'google_oauth_tokens_pkey'
        AND schemaname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conindid = (SELECT oid FROM pg_class WHERE relname = 'google_oauth_tokens_pkey')
        )
    ) THEN
        ALTER TABLE "public"."google_oauth_tokens"
            ADD CONSTRAINT "google_oauth_tokens_pkey" PRIMARY KEY using index "google_oauth_tokens_pkey";
        RAISE NOTICE 'Added PRIMARY KEY constraint google_oauth_tokens_pkey';
    ELSE
        RAISE NOTICE 'Skipping google_oauth_tokens_pkey - constraint already exists or index is already associated with a constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding google_oauth_tokens_pkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'google_oauth_tokens_user_id_fkey'
    ) THEN
        ALTER TABLE "public"."google_oauth_tokens"
            ADD CONSTRAINT "google_oauth_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;
        RAISE NOTICE 'Added FOREIGN KEY constraint google_oauth_tokens_user_id_fkey';
    ELSE
        RAISE NOTICE 'Skipping google_oauth_tokens_user_id_fkey - constraint already exists';
    END IF;
END $$;

alter table "public"."google_oauth_tokens" validate constraint "google_oauth_tokens_user_id_fkey";

DO $$
BEGIN
    -- Check if constraint already exists (not just the index)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'google_oauth_tokens_user_id_key'
    ) AND EXISTS (
        -- Only try to use the index if it exists and isn't already a constraint
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'google_oauth_tokens_user_id_key'
        AND schemaname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conindid = (SELECT oid FROM pg_class WHERE relname = 'google_oauth_tokens_user_id_key')
        )
    ) THEN
        ALTER TABLE "public"."google_oauth_tokens"
            ADD CONSTRAINT "google_oauth_tokens_user_id_key" UNIQUE using index "google_oauth_tokens_user_id_key";
        RAISE NOTICE 'Added UNIQUE constraint google_oauth_tokens_user_id_key';
    ELSE
        RAISE NOTICE 'Skipping google_oauth_tokens_user_id_key - constraint already exists or index is already associated with a constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding google_oauth_tokens_user_id_key constraint: %', SQLERRM;
END $$;

grant delete on table "public"."google_oauth_tokens" to "anon";

grant insert on table "public"."google_oauth_tokens" to "anon";

grant references on table "public"."google_oauth_tokens" to "anon";

grant select on table "public"."google_oauth_tokens" to "anon";

grant trigger on table "public"."google_oauth_tokens" to "anon";

grant truncate on table "public"."google_oauth_tokens" to "anon";

grant update on table "public"."google_oauth_tokens" to "anon";

grant delete on table "public"."google_oauth_tokens" to "authenticated";

grant insert on table "public"."google_oauth_tokens" to "authenticated";

grant references on table "public"."google_oauth_tokens" to "authenticated";

grant select on table "public"."google_oauth_tokens" to "authenticated";

grant trigger on table "public"."google_oauth_tokens" to "authenticated";

grant truncate on table "public"."google_oauth_tokens" to "authenticated";

grant update on table "public"."google_oauth_tokens" to "authenticated";

grant delete on table "public"."google_oauth_tokens" to "service_role";

grant insert on table "public"."google_oauth_tokens" to "service_role";

grant references on table "public"."google_oauth_tokens" to "service_role";

grant select on table "public"."google_oauth_tokens" to "service_role";

grant trigger on table "public"."google_oauth_tokens" to "service_role";

grant truncate on table "public"."google_oauth_tokens" to "service_role";

grant update on table "public"."google_oauth_tokens" to "service_role";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'google_oauth_tokens'
        AND policyname = 'service_role_only'
    ) THEN
        CREATE POLICY "service_role_only" ON "public"."google_oauth_tokens"
as permissive
for all
to service_role
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));
        RAISE NOTICE 'Created policy service_role_only on google_oauth_tokens';
    ELSE
        RAISE NOTICE 'Skipping policy service_role_only - already exists';
    END IF;
END $$;



