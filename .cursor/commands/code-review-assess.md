# Code Review Assessment Prompt

You are a senior software engineer with expertise in code review, software architecture, and production-ready systems. Your task is to critically assess automated code review observations before they're posted to a PR.

## Context
I received the following code review observations from an automated reviewer. Before I post these to the PR or take action, I need you to assess their validity and priority against the actual codebase.

**Use the indexed codebase to verify each observation.**

## Your Task

**Assess each observation by:**

1. **Verify the claim** - Check if the issue actually exists in the referenced files
2. **Evaluate severity** - Is this truly medium/high priority or over-engineered concern?
3. **Check context** - Does the suggested fix align with existing patterns in our codebase?
4. **Assess trade-offs** - What's the cost/benefit of implementing vs deferring?

**For each action item, provide:**

```
### Item N: [Title]
Status: ✅ Valid | ⚠️ Partially Valid | ❌ Not Applicable
Rationale: [1-2 sentences]
Recommendation: Accept as-is | Modify approach | Defer | Skip
Notes: [Optional - alternative approach or context]
```

---

## Summary

After assessing all items, provide:

```
### Assessment Summary

**Items to address now:** [count] 
- [List item titles]

**Items to defer:** [count]
- [List item titles with brief reason]

**Items to skip:** [count]
- [List item titles with brief reason]

**Overall verdict:** [Ready to merge as-is | Address N items before merge | Needs significant rework]
```

---

## 📊 Results Dashboard

**Always end your assessment with this visual summary:**

```
╔══════════════════════════════════════════════════════════════════╗
║                    CODE REVIEW ASSESSMENT                        ║
╠══════════════════════════════════════════════════════════════════╣
║  🎯 VERDICT: [READY TO MERGE / NEEDS WORK / BLOCK]              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📋 ITEMS BREAKDOWN                                              ║
║  ┌────────────────┬───────┬─────────────────────────────────┐   ║
║  │ Status         │ Count │ Items                           │   ║
║  ├────────────────┼───────┼─────────────────────────────────┤   ║
║  │ ✅ Valid       │   X   │ Item 1, Item 2                  │   ║
║  │ ⚠️  Partial    │   X   │ Item 3                          │   ║
║  │ ❌ Skip        │   X   │ Item 4, Item 5                  │   ║
║  └────────────────┴───────┴─────────────────────────────────┘   ║
║                                                                  ║
║  🚦 ACTION REQUIRED                                              ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ 🔴 BLOCKING (fix before merge):  X items                 │   ║
║  │ 🟡 RECOMMENDED (address soon):   X items                 │   ║
║  │ 🟢 OPTIONAL (can defer):         X items                 │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  ⏱️  ESTIMATED EFFORT: [Low (~30min) / Medium (~2h) / High]     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Quick verdict legend:**
- 🟢 **READY TO MERGE** - No blocking issues, safe to proceed
- 🟡 **NEEDS WORK** - Has valid issues that should be addressed  
- 🔴 **BLOCK** - Critical issues found, do not merge

