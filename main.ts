// Make the AI Judge Laugh — deterministic entry picker.
// Scores hand-written one-line office jokes against the judge's brief,
// in the brief's own order, and writes the winner to entry.txt.
//
// Judge criteria (most important first):
//   1. About office life, and lands as a joke.
//   2. True to the office: meetings, email, bosses, coffee, deadlines, printer.
//   3. Surprising turn: a fresh angle or an unexpected last word, not a pun
//      or a stock line everyone has heard.
//   4. Tight: one line, no wasted setup, every word earning its place,
//      reads cleanly aloud.
//   5. Original: not a familiar line with the nouns swapped.
//
// Node 22+, standard library only, no network, fully deterministic.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Candidates: 18 one-line office jokes, each written for this entry.
// Every line is a single sentence (or two short clauses), under 200 chars,
// and each one carries a real office observation with a turn at the end.
// ---------------------------------------------------------------------------
const CANDIDATES: string[] = [
  "The office plant is the only one here getting regular feedback, sunlight, and a promotion to a bigger pot.",
  "My job description says 'other duties as assigned,' which is corporate for 'we haven't invented your job yet.'",
  "I told my boss I work best under pressure, so now every deadline is yesterday.",
  "We replaced the water cooler with a Slack channel called #hydration, and morale has never been drier.",
  "The printer has been 'out of toner' since March, and at this point I think it's just shy.",
  "Our team building exercise was trust falls, which is fitting, because that's what my salary does every year.",
  "My calendar is so full of meetings about meetings that I blocked an hour to mourn the work I never got to do.",
  "I put my out-of-office on for lunch and came back to fourteen emails asking if I was still alive.",
  "The Wi-Fi password changes monthly, and the only person who knows it is the intern who left in June.",
  "Our boss calls it synergy when two people do the job of five and get paid for one.",
  "I asked IT for a faster laptop and got a motivational poster about patience instead.",
  "The office coffee tastes like it was brewed during the previous administration, and it outlasted two of them.",
  "My inbox has three thousand unread emails, and the only one I answered said 'per my last email.'",
  "We had a meeting to decide whether we needed the meeting, and it decided yes, unanimously, at 4:59 on a Friday.",
  "I spent an hour in a meeting titled 'Quick Sync' and the only thing that synced was everyone's regret.",
  "The only thing our open-plan office is open about is how loudly Dave chews.",
  "My boss said we're a family, so I asked HR when the family reunion covers my rent.",
  "I asked for a raise and my boss gave me more responsibility, which is the office version of a participation trophy.",
  "The break room microwave has a sign saying 'clean up after yourself,' signed by nobody, obeyed by nobody.",
  "HR sent a survey about morale, and the only question with a hundred percent response rate was the one about the free pizza.",
];

// ---------------------------------------------------------------------------
// Lexicons. All scoring is lexicon + structure based, no randomness, no I/O.
// ---------------------------------------------------------------------------

// Office anchors the judge itself names, plus the everyday office furniture.
const OFFICE_WORDS = [
  "meeting", "meetings", "email", "emails", "boss", "coffee", "deadline",
  "deadlines", "printer", "office", "calendar", "inbox", "hr", "slack",
  "salary", "intern", "it department", "laptop", "wi-fi", "water cooler",
  "job description", "raise", "out-of-office", "team building", "plant",
  "open-plan", "responsibility", "administration", "toner", "password",
  "job", "corporate", "break room", "microwave", "survey", "morale",
];

// Concrete, lived-in office detail: the nouns and situations a listener nods at.
const TRUTH_WORDS = [
  "toner", "march", "june", "friday", "4:59", "fourteen", "three thousand",
  "monthly", "every year", "every morning", "since", "still", "left",
  "password", "poster", "patience", "trophy", "rent", "chews", "drier",
  "hydration", "feedback", "sunlight", "bigger pot", "mourn", "regret",
  "synced", "unanimously", "outlasted", "assigned", "brewed", "obeyed",
  "signed by nobody", "free pizza", "hundred percent", "clean up",
];

// The punch lives in the tail: words that reframe the setup instead of
// repeating it. A line whose last clause carries one of these turns.
const TWIST_WORDS = [
  "bigger pot", "haven't invented", "yesterday", "drier", "shy",
  "every year", "mourn", "still alive", "left in june", "paid for one",
  "patience instead", "outlasted", "4:59", "regret", "chews", "rent",
  "participation trophy", "never got to do", "covers my rent",
  "obeyed by nobody", "free pizza",
];

// Wordplay punches: the brief wants a fresh angle or an unexpected last
// word "rather than a pun", so a tail that turns on a pun is docked.
const PUN_TAIL_WORDS = ["bigger pot", "drier", "synced"];

// Stock lines the judge has heard ten thousand times: puns and memes with
// the nouns swapped. Each hit docks surprise and originality hard.
const CLICHE_PHRASES = [
  "per my last email", "we're a family", "we are a family", "synergy",
  "quick sync", "meetings about meetings", "circle back", "touch base",
  "trust falls", "participation trophy", "motivational poster",
  "work best under pressure", "open-plan", "out-of-office",
];

// Filler that earns no laugh and costs tightness.
const FILLER_WORDS = [
  "very", "really", "just", "actually", "literally", "basically",
  "totally", "quite", "somewhat",
];

// ---------------------------------------------------------------------------
// Scoring. Each criterion scores 0-10, weighted in the brief's order.
// ---------------------------------------------------------------------------
interface Score {
  office: number;
  truth: number;
  surprise: number;
  tight: number;
  original: number;
  total: number;
}

function countHits(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const w of words) {
    if (lower.includes(w)) hits++;
  }
  return hits;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// The tail of the line: everything after the last comma, "so", "which" or
// "and" that starts the closing clause. The punch has to live there.
function tailClause(text: string): string {
  const lower = text.toLowerCase();
  const marks = [", so ", ", which ", ", and ", ", because ", ", that "];
  let tail = lower;
  for (const m of marks) {
    const i = lower.lastIndexOf(m);
    if (i >= 0) tail = lower.slice(i + m.length);
  }
  return tail;
}

function scoreOffice(text: string): number {
  const hits = countHits(text, OFFICE_WORDS);
  // Two or more distinct office anchors: clearly about office life.
  let s = Math.min(10, hits * 4);
  // A joke needs a turn: a subordinate clause or a contrast word.
  const lower = text.toLowerCase();
  const hasTurn =
    lower.includes(", so ") ||
    lower.includes(", which ") ||
    lower.includes(", and ") ||
    lower.includes(", because ") ||
    lower.includes(" but ") ||
    lower.includes(" that ") ||
    lower.includes(" instead");
  if (!hasTurn) s = Math.min(s, 5);
  return s;
}

function scoreTruth(text: string): number {
  const hits = countHits(text, TRUTH_WORDS);
  let s = Math.min(10, 3 + hits * 2);
  // A concrete time, number or date makes the observation checkable.
  if (/\b(march|june|friday|4:59|fourteen|three thousand|monthly|every year|since)\b/i.test(text)) s += 1;
  return Math.min(10, s);
}

function scoreSurprise(text: string): number {
  const tail = tailClause(text);
  const tailHits = countHits(tail, TWIST_WORDS);
  const wholeHits = countHits(text, TWIST_WORDS);
  let s = Math.min(10, wholeHits * 3 + tailHits * 3);
  // Ending-on-the-punch bonus: the twist word sits in the last six words.
  const lastSix = text.toLowerCase().split(/\s+/).slice(-6).join(" ");
  if (countHits(lastSix, TWIST_WORDS) > 0) s += 2;
  // Pun dock: the brief wants a fresh angle or an unexpected last word
  // "rather than a pun", so a tail that turns on wordplay loses points.
  s -= countHits(tail, PUN_TAIL_WORDS) * 2;
  // Cliche docks: a stock punch is the opposite of surprising.
  const cliches = countHits(text, CLICHE_PHRASES);
  s -= cliches * 4;
  return Math.max(0, Math.min(10, s));
}

function scoreTight(text: string): number {
  const chars = [...text].length;
  const words = wordCount(text);
  // Sweet spot for a one-breath line: 70-130 characters.
  let s = 10;
  if (chars < 50) s -= 2;
  if (chars > 130) s -= Math.min(4, Math.floor((chars - 130) / 15));
  if (words > 30) s -= 2;
  // Filler words are wasted setup.
  s -= countHits(text, FILLER_WORDS) * 2;
  // More than two commas means the setup is doing too much work.
  const commas = (text.match(/,/g) || []).length;
  if (commas > 2) s -= (commas - 2) * 2;
  // A second sentence is a second joke fighting the first.
  if ((text.match(/[.!?]\s+[A-Z]/g) || []).length > 0) s -= 3;
  // Abbreviations and hashtags trip a read-aloud.
  if (/#\w/.test(text)) s -= 1;
  return Math.max(0, Math.min(10, s));
}

function scoreOriginal(text: string): number {
  let s = 9;
  const cliches = countHits(text, CLICHE_PHRASES);
  s -= cliches * 3;
  // A line that is mostly a known meme template is a swap, not a joke.
  if (/per my last email/i.test(text)) s -= 2;
  if (/we'?re a family/i.test(text)) s -= 2;
  return Math.max(0, Math.min(10, s));
}

function scoreLine(text: string): Score {
  const office = scoreOffice(text);
  const truth = scoreTruth(text);
  const surprise = scoreSurprise(text);
  const tight = scoreTight(text);
  const original = scoreOriginal(text);
  // Weights follow the brief's order: office first, originality last.
  let total = office * 3 + truth * 2.5 + surprise * 2 + tight * 1.5 + original * 1;
  // Grounding cap: a line with no real office anchor cannot win on
  // cleverness alone — it fails criterion 1 outright.
  if (office < 4) total = Math.min(total, 40);
  // A stock line caps out: it can be tight, but it is not surprising
  // and it is not original, so it cannot take the top spot.
  if (countHits(text, CLICHE_PHRASES) >= 2) total = Math.min(total, 55);
  return { office, truth, surprise, tight, original, total };
}

// ---------------------------------------------------------------------------
// Gates (the sealed scorer's rules, applied here first):
//   1-200 characters, single line, valid UTF-8, not only whitespace.
// ---------------------------------------------------------------------------
function gateCheck(text: string): string[] {
  const problems: string[] = [];
  const chars = [...text].length;
  if (chars < 1 || chars > 200) problems.push(`length ${chars} chars (need 1-200)`);
  if (/[\r\n]/.test(text)) problems.push("not a single line");
  if (text.trim().length === 0) problems.push("only whitespace");
  // Valid UTF-8: a round-trip through Buffer must be byte-identical.
  const bytes = Buffer.from(text, "utf8");
  if (bytes.toString("utf8") !== text) problems.push("not valid UTF-8");
  return problems;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output/entry.txt";
  const dir = outDir.endsWith("entry.txt") ? outDir.slice(0, -"entry.txt".length) : outDir;
  const outPath = outDir.endsWith("entry.txt") ? outDir : join(outDir, "entry.txt");

  // Score every candidate, print the table, pick the winner.
  const ranked = CANDIDATES.map((text) => ({ text, score: scoreLine(text) }));
  ranked.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    if ([...a.text].length !== [...b.text].length) return [...a.text].length - [...b.text].length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  for (const { text, score } of ranked) {
    console.log(
      `${score.total.toFixed(1).padStart(5)} ` +
        `[office ${score.office} truth ${score.truth} surprise ${score.surprise} ` +
        `tight ${score.tight} original ${score.original}] (${[...text].length}c) ${text}`,
    );
  }

  const winner = ranked[0];
  const gateProblems = gateCheck(winner.text);
  if (gateProblems.length > 0) {
    throw new Error(`Winner fails gate: ${gateProblems.join("; ")}`);
  }

  mkdirSync(dir || ".", { recursive: true });
  writeFileSync(outPath, winner.text, "utf8");

  // Read it back and verify every gate against the file on disk.
  const back = readFileSync(outPath, "utf8");
  const backProblems = gateCheck(back);
  if (back !== winner.text) throw new Error("Read-back mismatch: file differs from winner");
  if (backProblems.length > 0) {
    throw new Error(`Written file fails gate: ${backProblems.join("; ")}`);
  }

  console.log(`\nWinner (${[...winner.text].length} chars, score ${winner.score.total.toFixed(1)}):`);
  console.log(winner.text);
  console.log(`Wrote ${outPath} — gate verified on read-back.`);
}

main();
