# Individual contributions: evidence and limits

Current task team labels: **Chhavi S — PES1UG24CS132** and **Chirag Basanth — PES1UG24CS133**. Expanded names in older documents are historical labels. Git attribution records collaboration; it does not prove independent manual authorship or mastery. Existing implementation documentation discloses AI assistance, and this audit is AI-assisted too.

| Evidence | Recorded identity | Verifiable scope |
|---|---|---|
| d41a53e | chhavi2308-s, chhavi.s2308@gmail.com | Repository initialization |
| 7d489e6 | chhavi2308-s, chhavi.s2308@gmail.com | Adds active src/ app, 384D migrations, Mongo validator/analytics, MiniLM path, tests and documents |
| PR #1, merged fd516e9 | PR creator chhavi2308-s; merge author Chhavi Siddarth Wadhwa | Active implementation integrated from ChiragBasanth:feature/pulsefit-level3-complete |
| 24cc449 | ChiragBasanth, chiragbasanthb@gmail.com | Earlier app/ and lib/ app, 128D SQL, reports and documentation, now superseded |
| 9bb11d2 | ChiragBasanth | Merge integrates implementations |
| 4e398a2 | ChiragBasanth | Portable-service restart fix |
| f17c3e7, 92499a3 | ChiragBasanth | Team/handoff/report documentation updates |
| e567352, 8e0c478, 6ccbd8a, 27bdf8c; merged by PR #2 at e63dd87 | chhavi2308-s, user-requested local identity; merge author Chhavi Siddarth Wadhwa | AI-assisted RLS/runtime grants, query demos, verification, setup repair and documentation |

Original PR: https://github.com/ChiragBasanth/dbms_mini_project_pulsefit/pull/1. GitHub metadata read in this audit confirms creator chhavi2308-s, merged 1 November 2026, merge SHA fd516e93414d034f4df143da8ca68cc5a5a09ce7. `git log --all` and `git show --stat <sha>` support file scopes. These facts do not assign percentages or imply sole manual authorship.

An earlier local checkout on fix/pulsefit-final-submission-audit had uncommitted changes. It was left untouched. Its cardio minimum-value validation repair and U09/API assertions were copied after inspection; they did not originate in this audit. Other uncommitted files and evidence remain there. The original implementation feature branch started at 92499a3 and was merged by PR #2 at e63dd87. The final documentation handoff starts from that merged main and preserves all historical author/committer identities.

Manual confirmation: each student identifies actual personal work, explains database and application concepts, confirms unrecorded collaboration, and follows instructor rules on AI assistance/originality. Commit attribution is evidence, not certification of independent contribution.

## Personal confirmation — not filled by Codex

Verifiable commits above establish attribution and file scope. The execution/viva guides require both students to understand the database and application; they do not retroactively assign feature ownership. Documented responsibilities and genuine personal work must be confirmed by each student, separately from AI-assisted commit attribution.

| Student | Personally performed work / responsibilities | Supporting commit, PR or other evidence | What I can explain and demonstrate | Assistance / limitations to disclose | Date / confirmation |
|---|---|---|---|---|---|
| Chhavi S — PES1UG24CS132 | | | | | |
| Chirag Basanth — PES1UG24CS133 | | | | | |

Do not replace blank fields with invented percentages or conclusions from another person’s test run. Instructor originality/AI policy and viva readiness remain human confirmations.

## Chirag individual review — 17 November 2026

The focused review at original main dba5337 traced Chirag's surviving runtime changes specifically to 4e398a2 in scripts/local-services.ts (persistent configuration/ports, readiness/recovery and IPv4 connection behavior). The helper originated in Chhavi-attributed 7d489e6 and also contains later Chhavi changes; it is not wholly Chirag-authored. 24cc449's earlier app/128D SQL/Mongo implementation is historical and substantially superseded. No incomplete feature exclusively assigned to Chirag was identified.

[CHIRAG_EXECUTION_RESULTS.md](CHIRAG_EXECUTION_RESULTS.md) records fresh Codex-executed restart, browser, database and regression evidence. [CHIRAG_INDIVIDUAL_VIVA.md](CHIRAG_INDIVIDUAL_VIVA.md) prepares the personal walkthrough. These AI-assisted documents and tests neither transfer Chhavi's implementation to Chirag nor complete his blank personal confirmations. He must confirm genuine personal work/assistance and practise independently.
