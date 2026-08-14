ALTER TABLE "members"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'designer',
  ADD COLUMN "password_hash" TEXT,
  ADD COLUMN "password_updated_at" TIMESTAMP(3);

UPDATE "members"
SET "username" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '.', 'g')) || '-' || LEFT("id", 8)
WHERE "username" IS NULL;

INSERT INTO "members" ("id", "name", "username", "role", "created_by") VALUES
  ('roster-vishnu-kumar', 'Vishnu Kumar', 'vishnu.kumar', 'designer', 'system'),
  ('roster-vishnu-varthini', 'Vishnu Varthini', 'vishnu.varthini', 'designer', 'system'),
  ('roster-onish', 'Onish', 'onish', 'designer', 'system'),
  ('roster-asrafdeen', 'Asrafdeen', 'asrafdeen', 'designer', 'system'),
  ('roster-abirami', 'Abirami', 'abirami', 'designer', 'system'),
  ('roster-sanjay-kumar', 'Sanjay Kumar', 'sanjay.kumar', 'lead', 'system'),
  ('roster-vimalraj', 'Vimalraj', 'vimalraj', 'lead', 'system'),
  ('roster-thomas', 'Thomas', 'thomas', 'head', 'system'),
  ('roster-lingesvar', 'Lingesvar', 'lingesvar', 'head', 'system'),
  ('roster-kowsi', 'Kowsi', 'kowsi', 'pm', 'system'),
  ('roster-visitor', 'Visitor', 'visitor', 'visitor', 'system')
ON CONFLICT ("name") DO UPDATE SET
  "username" = EXCLUDED."username",
  "role" = EXCLUDED."role";

ALTER TABLE "members" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "members_username_key" ON "members"("username");
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");