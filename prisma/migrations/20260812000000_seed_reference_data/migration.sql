-- Seed the previously hardcoded deliverable types and markets into the DB.
-- ON CONFLICT DO NOTHING makes this idempotent — safe to re-run.

INSERT INTO "deliverable_types" ("id", "name", "created_at", "created_by") VALUES
  (gen_random_uuid()::text, 'Main Image',       NOW(), 'system'),
  (gen_random_uuid()::text, 'Main Gallery',     NOW(), 'system'),
  (gen_random_uuid()::text, 'A+ Content',       NOW(), 'system'),
  (gen_random_uuid()::text, 'Premium Gallery',  NOW(), 'system'),
  (gen_random_uuid()::text, 'Brand Story',      NOW(), 'system'),
  (gen_random_uuid()::text, 'Infographic Set',  NOW(), 'system'),
  (gen_random_uuid()::text, 'Video',            NOW(), 'system'),
  (gen_random_uuid()::text, 'Variation Images', NOW(), 'system')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "markets" ("id", "name", "created_at", "created_by") VALUES
  (gen_random_uuid()::text, 'DE', NOW(), 'system'),
  (gen_random_uuid()::text, 'FR', NOW(), 'system'),
  (gen_random_uuid()::text, 'ES', NOW(), 'system'),
  (gen_random_uuid()::text, 'IT', NOW(), 'system'),
  (gen_random_uuid()::text, 'US', NOW(), 'system')
ON CONFLICT (name) DO NOTHING;
