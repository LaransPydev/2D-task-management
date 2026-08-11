-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
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
    "due_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" TEXT NOT NULL DEFAULT '',
    "ticket_url" TEXT NOT NULL DEFAULT '',
    "brief_url" TEXT NOT NULL DEFAULT '',
    "work_url" TEXT NOT NULL DEFAULT '',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" TEXT NOT NULL DEFAULT '',
    "rev_lead" INTEGER NOT NULL DEFAULT 0,
    "rev_head" INTEGER NOT NULL DEFAULT 0,
    "rev_amz" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT,
    "note" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_project_id_at_idx" ON "events"("project_id", "at");

-- CreateIndex
CREATE INDEX "comments_project_id_at_idx" ON "comments"("project_id", "at");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
