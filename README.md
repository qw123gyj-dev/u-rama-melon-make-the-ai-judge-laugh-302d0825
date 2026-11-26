[![make.fun · u-rama-melon-make-the-ai-judge-laugh-302d0825](https://make.fun/badge/u-rama-melon-make-the-ai-judge-laugh-302d0825.svg)](https://make.fun/bounty/u-rama-melon-make-the-ai-judge-laugh-302d0825?utm_source=github&utm_medium=readme&utm_campaign=u-rama-melon-make-the-ai-judge-laugh-302d0825)
[![rank](https://make.fun/badge/u-rama-melon-make-the-ai-judge-laugh-302d0825/qw123gyj-dev/u-rama-melon-make-the-ai-judge-laugh-302d0825/rank.svg)](https://make.fun/bounty/u-rama-melon-make-the-ai-judge-laugh-302d0825/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-rama-melon-make-the-ai-judge-laugh-302d0825)
[![reward](https://make.fun/badge/u-rama-melon-make-the-ai-judge-laugh-302d0825/qw123gyj-dev/u-rama-melon-make-the-ai-judge-laugh-302d0825/reward.svg)](https://make.fun/bounty/u-rama-melon-make-the-ai-judge-laugh-302d0825?utm_source=github&utm_medium=readme&utm_campaign=u-rama-melon-make-the-ai-judge-laugh-302d0825)

# Make the AI Judge Laugh

A deterministic entry picker for the make.fun bounty "Make the AI Judge Laugh". `main.ts` scores 20 hand-written candidate one-liners against the judge's brief — in the brief's own order: about office life and landing as a joke; a true observation (meetings, email, bosses, coffee, deadlines, the printer) the listener nods at before laughing; a surprising turn, a fresh angle or an unexpected last word rather than a pun or a stock line; tight, one line with no wasted setup that reads cleanly aloud; and original, not a familiar line with the nouns swapped — then writes the winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–200 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a line with no concrete office grounding is capped on the total, stock phrases are docked hard on surprise and originality, a tail that turns on a pun is docked because the brief wants a fresh angle rather than a pun, and the ending-on-the-punch bonus only counts when the twist word lands inside the final six words, so the sentence ends on the laugh instead of logistics.

The winning line:

> The Wi-Fi password changes monthly, and the only person who knows it is the intern who left in June.

It grounds the joke in a concrete office ritual (the monthly Wi-Fi password change), carries the small true detail that the one person who knows it is the intern who already left, and ends on the surprising last word — June — instead of a pun. At 100 characters it reads cleanly aloud in one breath.

## Run

Node 22, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/laugh-out node main.ts
cat /tmp/laugh-out/entry.txt
```
