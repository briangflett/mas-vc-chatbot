/**
 * Dev smoke test: exercises the real KB hybrid-retrieval path (OpenAI embedding
 * → parameterized RRF SQL → formatting) against the live Azure DB.
 *
 *   node --env-file=.env.local --import tsx scripts/verify-kb.ts "your question"
 */
import { searchKnowledgeBase } from "../lib/kb";

const q = process.argv[2] ?? "How do I close a project?";
searchKnowledgeBase(q)
  .then((out) => {
    console.log(`Query: ${q}\n`);
    console.log(out.slice(0, 1200));
    console.log(`\n[ok] returned ${out.length} chars`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("[fail]", err);
    process.exit(1);
  });
