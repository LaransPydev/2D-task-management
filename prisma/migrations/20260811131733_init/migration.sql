-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "asin" TEXT NOT NULL DEFAULT '',
    "dtype" TEXT NOT NULL,
    "market" TEXT NOT NULL DEFAULT 'DE',
    "designer" TEXT,
    "lead" TEXT,
    "head" TEXT,
    "pm" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'product',
    "priority" TEXT NOT NULL DEFAULT 'med',
    "due_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage_since" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" TEXT NOT NULL DEFAULT '',
    "ticket_url" TEXT NOT NULL DEFAULT '',
    "brief_url" TEXT NOT NULL DEFAULT '',
    "work_url" TEXT NOT NULL DEFAULT '',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" TEXT NOT NULL DEFAULT '',
    "rev_lead" INTEGER NOT NULL DEFAULT 0,
    "rev_head" INTEGER NOT NULL DEFAULT 0,
    "rev_amz" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT,
    "note" TEXT,
    CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "deliverable_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "events_project_id_at_idx" ON "events"("project_id", "at");

-- CreateIndex
CREATE INDEX "comments_project_id_at_idx" ON "comments"("project_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "members_name_key" ON "members"("name");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_types_name_key" ON "deliverable_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "markets_name_key" ON "markets"("name");
