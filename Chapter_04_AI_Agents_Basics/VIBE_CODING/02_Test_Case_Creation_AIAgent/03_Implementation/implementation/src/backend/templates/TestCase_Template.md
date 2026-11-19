# Test Cases — <JIRA-KEY>: <title>

> Status: **DRAFT — pending human review.** Not approved until a QA owner signs off.

## 1. Scope & Objectives
- **In scope:** features/requirements these test cases cover.
- **Out of scope:**
- **Objective:** what "tested" means for this ticket.
- **Source test plan:** <link / path to TestPlan>
- **Requirements used (only these):** R1: … | R2: …

## 2. Gaps & Questions for the author
| # | Area | Finding (⚠️/❌) | Question to author |
|---|------|----------------|--------------------|
| 1 |      |                |                    |

## 3. Test Case Format
```
Test Case ID: <PROJECT>-<MODULE>-TC-<NNN>
Summary: Verify <behavior> <condition>
Preconditions: <state required before the test>
Test Data: <placeholders only, e.g. <registered_email>, <valid_password>>
Steps:
1. <action>
2. <action>
Expected Result: <observable behavior, or "Requires clarification">
Priority: High | Medium | Low
Test Type: Positive | Negative | Boundary | Access Control
Status: Not Run
```

**Filled example**
```
Test Case ID: VWO-LOGIN-TC-001
Summary: Verify login with valid registered credentials
Preconditions: An active registered test account is available; the user is logged out.
Test Data: <registered_email>, <valid_password>
Steps:
1. Open https://app.vwo.com/.
2. Enter the registered email.
3. Enter the valid password.
4. Submit the login form.
Expected Result: Login succeeds and the authenticated dashboard opens.
Priority: High
Test Type: Positive
Status: Not Run
```

## 4. Test Cases
| Test Case ID | Requirement | Summary | Preconditions | Test Data | Steps | Expected Result | Priority | Test Type | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-001 | R1 |  |  |  | 1.<br>2.<br>3. |  | High | Positive | Not Run |

> Exact Jira import compatibility requires the Jira project and test-management app's field mapping.

## 5. Traceability (Scenario / Requirement → Test Case)
| Requirement / Scenario (TS-n) | Test Case IDs | Covered? |
|-------------------------------|---------------|----------|
| R1 |  |  |

## 6. Test Data & Environment
- **Data:** placeholders only; never real passwords.
- **Environment / flags:**
- **Roles / permissions:**

## 7. Risks & Assumptions
- **Assumptions made:**
- **Risks:**
- **Marked "Requires clarification":**

## 8. Entry / Exit criteria
- **Entry:**
- **Exit:**

## 9. Rules
- Exact test case count: <N>; each distinct.
- Use only supplied requirements; every case maps to one.
- Do not invent validation messages or policies.
- Status stays "Not Run" until executed; never Passed/Failed without execution.

---
## HUMAN REVIEW GATE
- **I assumed:** …
- **I could not confirm:** …
- **Open questions blocking sign-off:** …
- **Approve, or edit, before I write automation.**
