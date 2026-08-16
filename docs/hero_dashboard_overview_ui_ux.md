# Hero Dashboard Overview UI/UX Specification

## Target endpoint

`GET /api/v1/reinforcement/hero/overview`

This dashboard should be built as an **analytics overview for school/admin/teacher users**, not as a student journey screen.

The endpoint returns dashboard-level summaries for:

- Scope
- Missions
- Progress
- Objectives
- Rewards
- Events
- Top students
- Recent activity

---

## 1. Page header and smart filters

### Header

**Hero Journey Overview**

Subtitle:

> Track missions, progress, XP, badges, and student activity.

### Filters

Place the filters at the top of the page. They should be sticky or easy to access because users will frequently change the dashboard scope.

| Filter | UI Component |
|---|---|
| Academic year | Select |
| Term | Select |
| Date range | Date picker: Today / 7 days / 30 days / Custom |
| Stage | Select |
| Grade | Select |
| Section | Select |
| Classroom | Select |
| Student | Searchable dropdown |

Supported query params:

```ts
{
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
}
```

### Filter UX behavior

Filters should be hierarchical:

```text
Stage → Grade → Section → Classroom → Student
```

Recommended behavior:

- When the user selects a stage, only show grades inside that stage.
- When the user selects a grade, only show sections inside that grade.
- When the user selects a section, only show classrooms inside that section.
- When the user selects a classroom, only show students inside that classroom.
- If a classroom is selected, visually auto-fill or lock its parent section, grade, and stage.
- Add a **Reset filters** button.

If backend returns a hierarchy mismatch error, show:

```text
The selected filters do not belong together.
Please reset the scope or choose matching stage/grade/classroom.
```

---

## 2. KPI cards row

Show 5–6 KPI cards at the top of the dashboard.

Recommended cards:

### 1. Total Missions

Main value:

```ts
missions.total
```

Secondary values:

```ts
missions.published
missions.draft
missions.archived
```

### 2. Completion Rate

Main value:

```ts
progress.completionRate * 100
```

Format as percentage.

### 3. Total Hero XP

Main value:

```ts
rewards.totalHeroXp
```

### 4. Badges Awarded

Main value:

```ts
rewards.badgesAwarded
```

### 5. Required Objectives Completed

Main value:

```ts
objectives.completedRequired / objectives.totalRequired
```

### 6. Students With Badges

Main value:

```ts
rewards.studentsWithBadges
```

Suggested layout:

```text
[ Total Missions ] [ Completion Rate ] [ Total Hero XP ] [ Badges Awarded ] [ Objectives ] [ Students With Badges ]
```

UX note:

Do not show trend arrows unless the backend later provides comparison data. Avoid fake “+10% from last week” indicators.

---

## 3. Mission health section

Create a card titled:

**Mission Status**

Recommended UI:

- Donut chart or segmented chart for:
  - Draft
  - Published
  - Archived
- Small stats below:
  - With XP reward
  - With badge reward
  - Without rewards, calculated client-side if needed

Data source:

```ts
missions: {
  total: number;
  draft: number;
  published: number;
  archived: number;
  withBadgeReward: number;
  withXpReward: number;
}
```

UX purpose:

This card helps admins understand whether the Hero Journey content is ready, incomplete, or archived.

---

## 4. Student progress overview

Create a large card titled:

**Student Progress**

Recommended UI:

- Horizontal stacked bar:
  - Not started
  - In progress
  - Completed
  - Cancelled
- Big completion percentage.
- Short helper text.

Data source:

```ts
progress: {
  totalProgress: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}
```

Suggested helper text:

```text
Based on expected mission progress for students in the selected scope.
```

UX warning state:

If `notStarted` is high, show a subtle warning:

```text
Many students have not started Hero missions yet.
```

---

## 5. Objectives completion card

Create a card titled:

**Required Objectives**

Recommended UI:

- Progress bar
- Completed count
- Total required count
- Average progress percentage

Data source:

```ts
objectives: {
  totalRequired: number;
  completedRequired: number;
  averageProgressPercent: number;
}
```

Suggested layout:

```text
Required Objectives
completedRequired / totalRequired completed

Average progress: averageProgressPercent%
```

UX purpose:

This is important because mission completion alone does not show whether students are completing required objectives.

---

## 6. Rewards and motivation section

Create a card titled:

**Rewards & Motivation**

Split it into two visual blocks:

```text
XP Impact
- Total Hero XP
- XP-granted missions

Badge Impact
- Badges awarded
- Students with badges
```

Data source:

```ts
rewards: {
  totalHeroXp: number;
  xpGrantedMissions: number;
  badgesAwarded: number;
  studentsWithBadges: number;
}
```

UX purpose:

This section answers whether the rewards system is actually motivating students.

---

## 7. Top students leaderboard

Create a card titled:

**Top Students**

Recommended table columns:

| Rank | Student | Completed Missions | Hero XP | Badges | Avg Progress |
|---|---|---:|---:|---:|---:|

Data source:

```ts
topStudents: [
  {
    studentId: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      name: string;
      nameAr: string | null;
      code: string | null;
      admissionNo: string | null;
    };
    completedMissions: number;
    totalHeroXp: number;
    badgesCount: number;
    averageProgressPercent: number;
  }
]
```

UX behavior:

- Make each student row clickable.
- On click, apply the `studentId` filter to the dashboard.
- Add “View student hero details” as a secondary action if a student profile page exists.
- If the list is empty, show an empty state instead of a blank table.

Empty state:

```text
No top students found for this scope yet.
```

---

## 8. Recent activity feed

Create a card titled:

**Recent Hero Activity**

Each activity item should include:

- Icon
- Event type label
- Student reference
- Mission reference if available
- Timestamp
- Optional actor reference

Data source:

```ts
recentActivity: [
  {
    id: string;
    type: string;
    missionId: string | null;
    progressId: string | null;
    objectiveId: string | null;
    studentId: string | null;
    xpLedgerId: string | null;
    badgeId: string | null;
    occurredAt: string;
    actorUserId: string | null;
  }
]
```

Event types to support:

- `mission_started`
- `objective_completed`
- `mission_completed`
- `xp_granted`
- `badge_awarded`

Suggested labels:

| API type | UI label |
|---|---|
| `mission_started` | Mission started |
| `objective_completed` | Objective completed |
| `mission_completed` | Mission completed |
| `xp_granted` | XP granted |
| `badge_awarded` | Badge awarded |

UX behavior:

- Show the latest activity first.
- Use relative time, for example: “5 minutes ago”.
- Use exact time on hover or in a tooltip.
- Do not overload the feed with too many colors.

Empty state:

```text
No recent hero activity found for this scope.
```

---

## 9. Suggested desktop layout

```text
-------------------------------------------------
Hero Journey Overview
[Academic Year] [Term] [Date Range] [Stage] [Grade] [Classroom] [Student]
-------------------------------------------------

[KPI] [KPI] [KPI] [KPI] [KPI] [KPI]

-------------------------------------------------
| Mission Status        | Student Progress       |
| Donut + counts        | Stacked bar + rate     |
-------------------------------------------------

-------------------------------------------------
| Objectives            | Rewards & Motivation   |
| Progress bar          | XP + badges            |
-------------------------------------------------

-------------------------------------------------
| Top Students Leaderboard       | Recent Activity       |
| Table                          | Feed                  |
-------------------------------------------------
```

---

## 10. Suggested mobile layout

```text
Hero Journey Overview
[Filters button]

Horizontal KPI cards

Mission Status
Student Progress
Required Objectives
Rewards & Motivation
Top Students
Recent Activity
```

Mobile UX notes:

- Put filters inside a bottom sheet or drawer.
- Keep KPI cards horizontally scrollable.
- Use cards instead of wide tables.
- Convert leaderboard rows into compact student cards.

---

## 11. Loading state

Use skeleton loading, not only a spinner.

Recommended skeletons:

- Header filter skeletons
- KPI card skeletons
- Chart placeholders
- Table row placeholders
- Activity feed placeholders

---

## 12. Empty state

If no missions, no enrollments, or no activity exists for the selected scope:

```text
No Hero Journey data found for this scope.
Try changing the term, stage, classroom, or date range.
```

Add action buttons:

```text
Reset filters
View Hero Map
Create Hero Mission
```

Only show “Create Hero Mission” if the user has permission to manage hero missions.

---

## 13. Permission error state

If user does not have permission:

```text
You don’t have permission to view Hero Journey analytics.
Contact your school admin.
```

Required permission:

```text
reinforcement.hero.view
```

---

## 14. API error state

Show a friendly message:

```text
We couldn’t load the Hero Journey overview.
Please try again.
```

Add:

- Retry button
- Small technical details only in dev mode
- Request ID if available

---

## 15. Recommended drill-downs

The overview should not become a huge raw data page. Add links/cards to more detailed views:

- Hero Map
- Stage Summary
- Classroom Summary
- Badge Summary
- Student Hero View

Recommended drill-down behavior:

| User action | Result |
|---|---|
| Click stage filter result | Open stage summary |
| Click classroom | Open classroom summary |
| Click student row | Apply student filter or open student hero profile |
| Click badge metric | Open badge summary |
| Click mission status card | Open mission management/list |

---

## 16. What not to build first

Avoid building these first:

- Huge raw data table
- Too many charts on one screen
- Fake trend indicators
- Complex custom reports
- Student journey map inside the overview page

The overview should answer these questions quickly:

1. Are missions ready?
2. Are students progressing?
3. Are rewards motivating students?
4. Who are the top students?
5. What happened recently?

---

## 17. Suggested frontend data model

```ts
export interface HeroOverviewResponse {
  scope: {
    academicYearId: string;
    yearId: string;
    termId: string;
    stageId: string | null;
    gradeId: string | null;
    sectionId: string | null;
    classroomId: string | null;
    studentId: string | null;
    subjectId: string | null;
  };

  missions: {
    total: number;
    draft: number;
    published: number;
    archived: number;
    withBadgeReward: number;
    withXpReward: number;
  };

  progress: {
    totalProgress: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };

  objectives: {
    totalRequired: number;
    completedRequired: number;
    averageProgressPercent: number;
  };

  rewards: {
    totalHeroXp: number;
    xpGrantedMissions: number;
    badgesAwarded: number;
    studentsWithBadges: number;
  };

  events: {
    missionStarted: number;
    objectiveCompleted: number;
    missionCompleted: number;
    xpGranted: number;
    badgeAwarded: number;
  };

  topStudents: Array<{
    studentId: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      name: string;
      nameAr: string | null;
      code: string | null;
      admissionNo: string | null;
    };
    completedMissions: number;
    totalHeroXp: number;
    badgesCount: number;
    averageProgressPercent: number;
  }>;

  recentActivity: Array<{
    id: string;
    type: string;
    missionId: string | null;
    progressId: string | null;
    objectiveId: string | null;
    studentId: string | null;
    xpLedgerId: string | null;
    badgeId: string | null;
    occurredAt: string;
    actorUserId: string | null;
  }>;
}
```

---

## 18. Implementation priority

### Phase 1

Build:

- Header
- Filters
- KPI cards
- Mission status
- Student progress
- Empty/loading/error states

### Phase 2

Build:

- Objectives card
- Rewards card
- Top students leaderboard
- Recent activity feed

### Phase 3

Build:

- Drill-down navigation
- Student row click behavior
- Classroom/stage summary links
- Better charts
- Export/report actions

---

## 19. Summary

The dashboard overview should be a clean analytics screen focused on fast decision-making.

It should help school staff quickly understand:

- How many Hero missions exist
- Whether missions are published and reward-ready
- How much progress students are making
- How many objectives are completed
- How much XP and badge activity exists
- Which students are performing best
- What recent Hero activity happened
