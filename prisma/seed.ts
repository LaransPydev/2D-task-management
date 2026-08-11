/**
 * Ports the original single-file app's seed() sample data into real rows.
 * Run with `npx prisma db seed` (wired up in prisma.config.ts). Safe to
 * re-run — it skips if the table already has projects, unless --force is
 * passed (e.g. `npx prisma db seed -- --force`).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { peopleIn, DAY } from "../lib/domain";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type EventSpec = [kind: string, from: string | null, to: string, actor: string, actorRole: string, note: string, weight?: number];
type ChatSpec = [actor: string, actorRole: string, text: string];

interface ProjectInput {
  id: string;
  product: string;
  asin: string;
  dtype: string;
  market: string;
  designer: string;
  lead: string;
  head: string;
  pm: string;
  stage: string;
  priority: string;
  dueDate: Date;
  createdAt: Date;
  stageSince: Date;
  ticketId: string;
  blocked: boolean;
  blockReason: string;
  revLead: number;
  revHead: number;
  revAmz: number;
}
interface EventInput {
  id: string;
  projectId: string;
  at: Date;
  actor: string;
  actorRole: string;
  kind: string;
  fromStage: string | null;
  toStage: string;
  note: string | null;
}
interface CommentInput {
  id: string;
  projectId: string;
  at: Date;
  actor: string;
  actorRole: string;
  text: string;
}

async function main() {
  const force = process.argv.includes("--force");
  const existing = await prisma.project.count();
  if (existing > 0 && !force) {
    console.log(`Skipping seed — ${existing} project(s) already in the database. Re-run with --force to wipe and reseed.`);
    return;
  }
  if (existing > 0 && force) {
    console.log("Wiping existing data before reseeding...");
    await prisma.comment.deleteMany();
    await prisma.event.deleteMany();
    await prisma.project.deleteMany();
  }

  const TEAM = { designers: peopleIn("designer"), lead: "Sanjay Kumar", head: "Lingesvar", pm: "Kowsi" };
  const L2 = "Vimalraj";
  const H2 = "Thomas";
  const D = TEAM.designers;

  const P: ProjectInput[] = [];
  const E: EventInput[] = [];
  const C: CommentInput[] = [];

  function mk(
    product: string,
    asin: string,
    dtype: string,
    market: string,
    designer: string,
    stage: string,
    ageD: number,
    stageD: number,
    pri: string,
    opts: {
      due?: number;
      lead?: string;
      head?: string;
      ticket?: string;
      block?: string;
      rl?: number;
      rh?: number;
      ra?: number;
      trail?: EventSpec[];
      chat?: ChatSpec[];
    } = {},
  ) {
    const id = randomUUID();
    const created = new Date(Date.now() - ageD * DAY);
    const end = new Date(Date.now() - stageD * DAY);

    P.push({
      id,
      product,
      asin,
      dtype,
      market,
      designer,
      lead: opts.lead || TEAM.lead,
      head: opts.head || TEAM.head,
      pm: TEAM.pm,
      stage,
      priority: pri,
      dueDate: new Date(Date.now() + (opts.due ?? 7) * DAY),
      createdAt: created,
      stageSince: end,
      ticketId: opts.ticket || "",
      blocked: !!opts.block,
      blockReason: opts.block || "",
      revLead: opts.rl || 0,
      revHead: opts.rh || 0,
      revAmz: opts.ra || 0,
    });

    // Place the trail between created_at and the moment the current stage began, so the
    // activity log and the "Xd in stage" counter can never contradict each other. The
    // numbers in each trail row are relative weights, not absolute days.
    const specs: EventSpec[] = [["create", null, "product", TEAM.pm, "pm", "Product selected for " + dtype + " (" + market + ")", 0]];
    (opts.trail || []).forEach((s) => specs.push(s));
    const start = created.getTime();
    const endMs = end.getTime();
    const gaps = specs.map((s, i) => (i === 0 ? 0 : s[6] || 1));
    const total = gaps.reduce((a, b) => a + b, 0);
    let cum = 0;
    specs.forEach((s, i) => {
      cum += gaps[i];
      const at = total > 0 ? start + (endMs - start) * (cum / total) : start;
      E.push({
        id: randomUUID(),
        projectId: id,
        at: new Date(at),
        actor: s[3],
        actorRole: s[4],
        kind: s[0],
        fromStage: s[1],
        toStage: s[2],
        note: s[5] || null,
      });
    });
    (opts.chat || []).forEach((m, i) => {
      const chatLen = (opts.chat as ChatSpec[]).length;
      C.push({
        id: randomUUID(),
        projectId: id,
        at: new Date(Date.now() - (chatLen - i) * 0.4 * DAY),
        actor: m[0],
        actorRole: m[1],
        text: m[2],
      });
    });
    return id;
  }

  mk("WP300 Walking Pad", "B0C4WP3001", "Main Gallery", "DE", D[0], "lead_rev", 11, 1, "high", {
    due: 3,
    rl: 0,
    trail: [
      ["stage", "product", "concept", D[0], "designer", "7 concept routes drafted, benefit-led angle chosen", 1],
      ["stage", "concept", "design", D[0], "designer", "Concept approved internally, moving into design", 2],
      ["stage", "design", "lead_rev", D[0], "designer", "All 7 slides done, mobile-legibility pass complete", 6],
    ],
    chat: [
      [TEAM.head, "head", "Is the app slide in this set? Sportstech Live has to be slot 3."],
      [D[0], "designer", "Yes — slot 3 is the STL app slide, screenshots are the current build."],
    ],
  });

  mk("F37s Laufband", "B0B7F37S01", "A+ Content", "DE", D[1], "lead_fix", 19, 2, "high", {
    due: 2,
    rl: 1,
    trail: [
      ["stage", "product", "concept", D[1], "designer", "Module structure mapped to the 7 fixed A+ modules", 2],
      ["stage", "concept", "design", D[1], "designer", "Copy locked with SEO, building modules", 3],
      ["stage", "design", "lead_rev", D[1], "designer", "All 7 modules built, German copy proofed", 7],
      [
        "stage",
        "lead_rev",
        "lead_fix",
        TEAM.lead,
        "lead",
        "Comparison module: competitor column is unfair and the incline spec contradicts the spec sheet (12% vs 15%). Fix both before it goes to Lingesvar.",
        4,
      ],
    ],
    chat: [
      [TEAM.lead, "lead", "Incline number has to match the ERP spec exactly — HWG risk if we overstate it."],
      [D[1], "designer", "Corrected to 15%, re-checking the comparison table now."],
    ],
  });

  mk("ESX500 Crosstrainer", "B08ESX5001", "Main Image", "DE", D[2], "head_rev", 24, 4, "high", {
    due: 1,
    rl: 1,
    trail: [
      ["stage", "product", "concept", D[2], "designer", "3 main-image routes: hero angle, scale reference, feature-led", 1],
      ["stage", "concept", "design", D[2], "designer", "Hero angle chosen for CTR", 2],
      ["stage", "design", "lead_rev", D[2], "designer", "Main image on pure white, 85% frame fill", 5],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "Frame fill too tight, console not readable at mobile size", 3],
      ["stage", "lead_fix", "lead_rev", D[2], "designer", "Reframed to 88%, console enlarged", 2],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved — clean and compliant", 1],
    ],
    chat: [[TEAM.head, "head", "Why is this sitting 4 days with me? Ping me next time, I missed it."]],
  });

  mk("ROWX700 Rudergerät", "B09ROW7001", "Premium Gallery", "DE", D[3], "amz_rej", 38, 2, "high", {
    due: 1,
    rl: 1,
    rh: 1,
    ra: 1,
    ticket: "CS-88421",
    trail: [
      ["stage", "product", "concept", D[3], "designer", "Glassy-card feature overview, 7 features from spec doc", 2],
      ["stage", "concept", "design", D[3], "designer", "Icon set + card system built", 3],
      ["stage", "design", "lead_rev", D[3], "designer", "7 feature cards complete", 6],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "Icon weights inconsistent across cards", 2],
      ["stage", "lead_fix", "lead_rev", D[3], "designer", "Icons unified to 2px stroke", 2],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved", 1],
      ["stage", "head_rev", "head_fix", TEAM.head, "head", 'Card 5 claim "verbrennt 800 kcal" is not defensible — remove it', 2],
      ["stage", "head_fix", "head_rev", D[3], "designer", "Claim removed, replaced with resistance levels", 2],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved for live", 1],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case CS-88421 opened with Seller Support", 1],
      ["stage", "ticket", "amz_rev", TEAM.pm, "pm", "Uploaded to amazon.de", 1],
      ["stage", "amz_rev", "amz_rej", TEAM.pm, "pm", "REJECTED — Text/claim not allowed. Amazon flagged the wording on card 2 as a health claim.", 3],
    ],
    chat: [
      [TEAM.pm, "pm", "Amazon rejected card 2. @Asrafdeen we need it reworded, not just resized."],
      [D[3], "designer", "On it — rewriting card 2 without the health wording."],
      [TEAM.head, "head", "Keep it factual: resistance levels and stroke length only."],
    ],
  });

  mk("DFT200 Vibrationsplatte", "B07DFT2001", "Main Gallery", "DE", D[0], "done", 26, 3, "med", {
    due: -6,
    rl: 1,
    rh: 0,
    ticket: "CS-87990",
    trail: [
      ["stage", "product", "concept", D[0], "designer", "Concept set built from review mining", 2],
      ["stage", "concept", "design", D[0], "designer", "Design started", 2],
      ["stage", "design", "lead_rev", D[0], "designer", "Gallery complete", 6],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "Slide 4 text too small on mobile", 2],
      ["stage", "lead_fix", "lead_rev", D[0], "designer", "Text scaled up 40%", 1],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved", 1],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved, strong set", 2],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case CS-87990 opened", 1],
      ["stage", "ticket", "amz_rev", TEAM.pm, "pm", "Submitted", 1],
      ["stage", "amz_rev", "done", TEAM.pm, "pm", "APPROVED — live on amazon.de", 4],
    ],
  });

  mk("SX600 Speedbike", "B0A6SX6001", "Main Gallery", "DE", D[1], "done", 17, 2, "high", {
    due: -4,
    rl: 0,
    rh: 0,
    ticket: "CS-88102",
    trail: [
      ["stage", "product", "concept", D[1], "designer", "Concepts from SQP keyword intent", 1],
      ["stage", "concept", "design", D[1], "designer", "Design started", 2],
      ["stage", "design", "lead_rev", D[1], "designer", "Gallery complete", 5],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved first pass — no notes", 1],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved first pass", 1],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case CS-88102 opened", 1],
      ["stage", "ticket", "amz_rev", TEAM.pm, "pm", "Submitted", 1],
      ["stage", "amz_rev", "done", TEAM.pm, "pm", "APPROVED — live", 3],
    ],
  });

  mk("HGX200 Kraftstation", "B0BHGX2001", "A+ Content", "DE", D[2], "design", 9, 5, "med", {
    due: 6,
    lead: L2,
    head: H2,
    trail: [
      ["stage", "product", "concept", D[2], "designer", "Module plan drafted", 2],
      ["stage", "concept", "design", D[2], "designer", "Concept signed off, designing modules", 2],
    ],
    chat: [
      [TEAM.lead, "lead", "How far are you on the storage module?"],
      [D[2], "designer", "Module 3 done, module 4 mechanism animation frames in progress."],
    ],
  });

  mk("KRX3 Kraftturm", "B0CKRX3001", "Brand Story", "DE", D[4], "concept", 5, 3, "low", {
    due: 12,
    lead: L2,
    head: H2,
    trail: [["stage", "product", "concept", D[3], "designer", "Founder story angle being researched", 2]],
  });

  mk("MS300 Massagepistole", "B0DMS3001", "Infographic Set", "DE", D[0], "ticket", 31, 8, "med", {
    due: 2,
    rl: 1,
    rh: 0,
    ticket: "CS-88510",
    trail: [
      ["stage", "product", "concept", D[0], "designer", "6 infographics scoped", 1],
      ["stage", "concept", "design", D[0], "designer", "Design started", 2],
      ["stage", "design", "lead_rev", D[0], "designer", "Set complete", 5],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "Amplitude figure needs the ERP source", 2],
      ["stage", "lead_fix", "lead_rev", D[0], "designer", "Figure corrected to spec sheet", 1],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved", 1],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved", 2],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case CS-88510 opened with Seller Support", 2],
    ],
  });

  mk("EX10 Ergometer", "B09EX10001", "Main Gallery", "FR", D[1], "head_fix", 27, 9, "med", {
    due: 0,
    rl: 1,
    rh: 1,
    block: "Waiting on the French copy sign-off from the FR market owner — nobody assigned since 24 July.",
    trail: [
      ["stage", "product", "concept", D[1], "designer", "FR adaptation of the DE gallery", 1],
      ["stage", "concept", "design", D[1], "designer", "Design adaptation started", 2],
      ["stage", "design", "lead_rev", D[1], "designer", "FR gallery adapted", 5],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "French copy reads machine-translated on slides 2 and 5", 3],
      ["stage", "lead_fix", "lead_rev", D[1], "designer", "Copy revised", 2],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved pending native check", 1],
      ["stage", "head_rev", "head_fix", TEAM.head, "head", "Needs a native FR speaker to sign the copy before I approve", 5],
    ],
    chat: [
      [TEAM.pm, "pm", "Who owns FR copy sign-off? This has been stuck 9 days."],
      [TEAM.head, "head", "Nobody assigned. That is the blocker — not the design."],
    ],
  });

  mk("BRT100 Rudergerät", "B08BRT1001", "Variation Images", "DE", D[4], "live_req", 22, 3, "low", {
    due: 4,
    rl: 0,
    rh: 0,
    trail: [
      ["stage", "product", "concept", D[4], "designer", "Colour variation set scoped", 1],
      ["stage", "concept", "design", D[4], "designer", "Design started", 2],
      ["stage", "design", "lead_rev", D[4], "designer", "All variants rendered", 4],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved first pass", 1],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved — PM please raise the request", 2],
    ],
  });

  mk("F37s Laufband", "B0B7F37S01", "Video", "DE", D[4], "product", 2, 2, "med", { due: 18, lead: L2, head: H2, trail: [] });

  mk("ESX500 Crosstrainer", "B08ESX5001", "A+ Content", "ES", D[0], "done", 45, 6, "low", {
    due: -14,
    rl: 1,
    rh: 1,
    ra: 1,
    ticket: "CS-87551",
    trail: [
      ["stage", "product", "concept", D[0], "designer", "ES adaptation scoped", 2],
      ["stage", "concept", "design", D[0], "designer", "Design started", 2],
      ["stage", "design", "lead_rev", D[0], "designer", "Modules adapted", 6],
      ["stage", "lead_rev", "lead_fix", TEAM.lead, "lead", "Spanish typography breaking on module 5", 2],
      ["stage", "lead_fix", "lead_rev", D[0], "designer", "Fixed", 2],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved", 1],
      ["stage", "head_rev", "head_fix", TEAM.head, "head", "Comparison module needs ES competitor set, not the DE one", 3],
      ["stage", "head_fix", "head_rev", D[0], "designer", "ES competitors swapped in", 3],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved", 1],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case CS-87551 opened", 2],
      ["stage", "ticket", "amz_rev", TEAM.pm, "pm", "Submitted to amazon.es", 1],
      ["stage", "amz_rev", "amz_rej", TEAM.pm, "pm", "REJECTED — Image quality / resolution below requirement on module 2", 3],
      ["stage", "amz_rej", "design", D[0], "designer", "Re-exported at 2x resolution", 2],
      ["stage", "design", "lead_rev", D[0], "designer", "Resubmitted", 1],
      ["stage", "lead_rev", "head_rev", TEAM.lead, "lead", "Approved", 1],
      ["stage", "head_rev", "live_req", TEAM.head, "head", "Approved", 1],
      ["stage", "live_req", "ticket", TEAM.pm, "pm", "Case reopened", 1],
      ["stage", "ticket", "amz_rev", TEAM.pm, "pm", "Resubmitted", 1],
      ["stage", "amz_rev", "done", TEAM.pm, "pm", "APPROVED — live on amazon.es", 4],
    ],
  });

  for (const p of P) {
    await prisma.project.create({ data: p });
  }
  if (E.length) await prisma.event.createMany({ data: E });
  if (C.length) await prisma.comment.createMany({ data: C });

  console.log(`Seeded ${P.length} projects, ${E.length} events, ${C.length} comments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
