ALTER TABLE "members"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'designer',
  ADD COLUMN "password_hash" TEXT,
  ADD COLUMN "password_updated_at" TIMESTAMP(3);

UPDATE "members"
SET
  "username"            = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '.', 'g')) || '-' || LEFT("id", 8),
  "password_hash"       = COALESCE("password_hash", 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ'),
  "password_updated_at" = COALESCE("password_updated_at", NOW())
WHERE "username" IS NULL;

INSERT INTO "members" ("id", "name", "username", "role", "created_by", "password_hash", "password_updated_at") VALUES
  ('roster-vishnu-kumar',    'Vishnu Kumar',    'vishnu.kumar',    'designer', 'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-vishnu-varthini', 'Vishnu Varthini', 'vishnu.varthini', 'designer', 'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-onish',           'Onish',           'onish',           'designer', 'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-asrafdeen',       'Asrafdeen',       'asrafdeen',       'designer', 'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-abirami',         'Abirami',         'abirami',         'designer', 'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-sanjay-kumar',    'Sanjay Kumar',    'sanjay.kumar',    'lead',     'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-vimalraj',        'Vimalraj',        'vimalraj',        'lead',     'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-thomas',          'Thomas',          'thomas',          'head',     'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-lingesvar',       'Lingesvar',       'lingesvar',       'head',     'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-kowsi',           'Kowsi',           'kowsi',           'pm',       'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW()),
  ('roster-visitor',         'Visitor',         'visitor',         'visitor',  'system', 'scrypt$gGjWkaS44VvtL8ix_5rzeQ$YFcO_Sjfpp_xfuPBiZigZaDVFP7OIbjir2bUPglGzt9WJptu_8UeCw6dmjiJ1S3xm1f9ok44NAzNfp7jONTvcQ', NOW())
ON CONFLICT ("name") DO UPDATE SET
  "username"           = EXCLUDED."username",
  "role"               = EXCLUDED."role",
  "password_hash"      = COALESCE("members"."password_hash", EXCLUDED."password_hash"),
  "password_updated_at" = COALESCE("members"."password_updated_at", EXCLUDED."password_updated_at");

ALTER TABLE "members" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "members_username_key" ON "members"("username");
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");