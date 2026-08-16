# Reinforcement Module - Backend API Endpoints

Source: [Moazez-Backend/src/modules/reinforcement](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/tree/main/src/modules/reinforcement)

Base path prefix: `/reinforcement`

---

## 1. Overview Module

**Controller:** `ReinforcementOverviewController`  
**Base path:** `/reinforcement`

### GET /reinforcement/overview
**Permission:** `reinforcement.overview.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| stageId | UUID | No |
| gradeId | UUID | No |
| sectionId | UUID | No |
| classroomId | UUID | No |
| studentId | UUID | No |
| source | string (max 32) | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |

**Response:** `ReinforcementOverviewResponseDto`
```json
{
  "scope": {},
  "tasks": {},
  "assignments": {},
  "reviewQueue": {},
  "xp": {},
  "topStudents": [],
  "recentActivity": []
}
```

### GET /reinforcement/students/:studentId/progress
**Permission:** `reinforcement.overview.view`  
**Path Params:** `studentId` (UUID)  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |

**Response:** `StudentReinforcementProgressResponseDto`
```json
{
  "student": {},
  "enrollment": {} | null,
  "assignments": {},
  "tasks": [],
  "submissions": {},
  "xp": {},
  "recentReviews": []
}
```

### GET /reinforcement/classrooms/:classroomId/summary
**Permission:** `reinforcement.overview.view`  
**Path Params:** `classroomId` (UUID)  
**Query Params:** Same as student progress (academicYearId, yearId, termId, dateFrom, dateTo)

**Response:** `ClassroomReinforcementSummaryResponseDto`
```json
{
  "classroom": {},
  "studentsCount": 0,
  "assignments": {},
  "reviewQueue": {},
  "xp": {},
  "topStudents": [],
  "students": []
}
```

---

## 2. Tasks Module

**Controller:** `ReinforcementTasksController`  
**Base path:** `/reinforcement`

### GET /reinforcement/filter-options
**Permission:** `reinforcement.tasks.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |

**Response:** `ReinforcementFilterOptionsResponseDto`
```json
{
  "academicYears": [],
  "terms": [],
  "stages": [],
  "grades": [],
  "sections": [],
  "classrooms": [],
  "subjects": [],
  "students": [],
  "sources": [],
  "statuses": [],
  "targetScopes": [],
  "proofTypes": [],
  "rewardTypes": []
}
```

### GET /reinforcement/tasks
**Permission:** `reinforcement.tasks.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| status | string (max 32) | No |
| source | string (max 32) | No |
| targetScope / scope | string (max 32) | No |
| targetId | UUID | No |
| classroomId | UUID | No |
| sectionId | UUID | No |
| gradeId | UUID | No |
| stageId | UUID | No |
| studentId | UUID | No |
| subjectId | UUID | No |
| dueFrom | ISO date string | No |
| dueTo | ISO date string | No |
| dueDate | ISO date string | No |
| search / q | string (max 200) | No |
| includeCancelled | boolean | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

**Response:** `ReinforcementTasksListResponseDto`
```json
{
  "items": [
    {
      "id": "uuid",
      "academicYearId": "uuid",
      "yearId": "uuid",
      "termId": "uuid",
      "subjectId": "uuid | null",
      "titleEn": "string | null",
      "titleAr": "string | null",
      "descriptionEn": "string | null",
      "descriptionAr": "string | null",
      "source": "string",
      "status": "string",
      "reward": {
        "type": "string | null",
        "value": 0,
        "labelEn": "string | null",
        "labelAr": "string | null"
      },
      "dueDate": "string | null",
      "assignedById": "uuid | null",
      "assignedByName": "string | null",
      "cancelledAt": "string | null",
      "cancellationReason": "string | null",
      "targets": [
        {
          "id": "uuid",
          "scopeType": "string",
          "scopeKey": "string",
          "stageId": "uuid | null",
          "gradeId": "uuid | null",
          "sectionId": "uuid | null",
          "classroomId": "uuid | null",
          "studentId": "uuid | null"
        }
      ],
      "stages": [
        {
          "id": "uuid",
          "sortOrder": 1,
          "titleEn": "string | null",
          "titleAr": "string | null",
          "descriptionEn": "string | null",
          "descriptionAr": "string | null",
          "proofType": "string",
          "requiresApproval": true
        }
      ],
      "assignmentSummary": {
        "total": 0,
        "notCompleted": 0,
        "inProgress": 0,
        "underReview": 0,
        "completed": 0,
        "cancelled": 0
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": 0,
  "limit": null,
  "offset": null
}
```

### POST /reinforcement/tasks
**Permission:** `reinforcement.tasks.manage`  
**Request Body:** `CreateReinforcementTaskDto`
```json
{
  "academicYearId": "uuid (optional)",
  "yearId": "uuid (optional)",
  "termId": "uuid (required)",
  "subjectId": "uuid | null (optional)",
  "titleEn": "string max 255 (optional)",
  "titleAr": "string max 255 (optional)",
  "descriptionEn": "string max 2000 (optional)",
  "descriptionAr": "string max 2000 (optional)",
  "source": "string max 32 (optional)",
  "rewardType": "string max 32 (optional)",
  "rewardValue": "number ≥0 (optional)",
  "rewardLabelEn": "string max 255 (optional)",
  "rewardLabelAr": "string max 255 (optional)",
  "dueDate": "ISO date (optional)",
  "assignedById": "uuid (optional)",
  "assignedByName": "string max 255 (optional)",
  "metadata": "{} (optional)",
  "targets": [
    {
      "scopeType": "string max 32 (required)",
      "scopeId": "uuid | null (optional)"
    }
  ],
  "stages": [
    {
      "sortOrder": "int ≥1 (optional)",
      "titleEn": "string max 255 (optional)",
      "titleAr": "string max 255 (optional)",
      "descriptionEn": "string max 2000 (optional)",
      "descriptionAr": "string max 2000 (optional)",
      "proofType": "string max 32 (optional)",
      "requiresApproval": "boolean (optional)",
      "metadata": "{} (optional)"
    }
  ]
}
```
**Response:** Single `ReinforcementTaskResponseDto` (same shape as list item)

### GET /reinforcement/tasks/:taskId
**Permission:** `reinforcement.tasks.view`  
**Path Params:** `taskId` (UUID)  
**Response:** Single `ReinforcementTaskResponseDto`

### POST /reinforcement/tasks/:taskId/duplicate
**Permission:** `reinforcement.tasks.manage`  
**Path Params:** `taskId` (UUID)  
**Request Body:** `DuplicateReinforcementTaskDto`
```json
{
  "titleEn": "string max 255 (optional)",
  "titleAr": "string max 255 (optional)",
  "dueDate": "ISO date (optional)",
  "academicYearId": "uuid (optional)",
  "yearId": "uuid (optional)",
  "termId": "uuid (optional)"
}
```
**Response:** Single `ReinforcementTaskResponseDto`

### POST /reinforcement/tasks/:taskId/cancel
**Permission:** `reinforcement.tasks.manage`  
**Path Params:** `taskId` (UUID)  
**Request Body:** `CancelReinforcementTaskDto`
```json
{
  "reason": "string max 1000 (optional)"
}
```
**Response:** Single `ReinforcementTaskResponseDto`

---

## 3. Templates Module

**Controller:** `ReinforcementTemplatesController`  
**Base path:** `/reinforcement/templates`

### GET /reinforcement/templates
**Permission:** `reinforcement.templates.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| search | string (max 200) | No |
| source | string (max 32) | No |
| includeDeleted | boolean | No |

**Response:** `ReinforcementTaskTemplatesListResponseDto`
```json
{
  "items": [
    {
      "id": "uuid",
      "nameEn": "string | null",
      "nameAr": "string | null",
      "descriptionEn": "string | null",
      "descriptionAr": "string | null",
      "source": "string",
      "reward": {
        "type": "string | null",
        "value": 0,
        "labelEn": "string | null",
        "labelAr": "string | null"
      },
      "stages": [
        {
          "id": "uuid",
          "sortOrder": 1,
          "titleEn": "string | null",
          "titleAr": "string | null",
          "descriptionEn": "string | null",
          "descriptionAr": "string | null",
          "proofType": "string",
          "requiresApproval": true
        }
      ],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

### POST /reinforcement/templates
**Permission:** `reinforcement.templates.manage`  
**Request Body:** `CreateReinforcementTaskTemplateDto`
```json
{
  "nameEn": "string max 255 (optional)",
  "nameAr": "string max 255 (optional)",
  "descriptionEn": "string max 2000 (optional)",
  "descriptionAr": "string max 2000 (optional)",
  "source": "string max 32 (optional)",
  "rewardType": "string max 32 (optional)",
  "rewardValue": "number ≥0 (optional)",
  "rewardLabelEn": "string max 255 (optional)",
  "rewardLabelAr": "string max 255 (optional)",
  "metadata": "{} (optional)",
  "stages": [
    {
      "sortOrder": "int ≥1 (optional)",
      "titleEn": "string max 255 (optional)",
      "titleAr": "string max 255 (optional)",
      "descriptionEn": "string max 2000 (optional)",
      "descriptionAr": "string max 2000 (optional)",
      "proofType": "string max 32 (optional)",
      "requiresApproval": "boolean (optional)",
      "metadata": "{} (optional)"
    }
  ]
}
```
**Response:** Single `ReinforcementTaskTemplateResponseDto`

---

## 4. Reviews Module

**Controller:** `ReinforcementReviewsController`  
**Base path:** `/reinforcement`

### POST /reinforcement/assignments/:assignmentId/stages/:stageId/submit
**Permission:** `reinforcement.tasks.manage`  
**Path Params:** `assignmentId` (UUID), `stageId` (UUID)  
**Request Body:** `SubmitReinforcementStageDto`
```json
{
  "proofText": "string max 4000 (optional)",
  "proofFileId": "uuid (optional)",
  "metadata": "{} (optional)"
}
```

### GET /reinforcement/review-queue
**Permission:** `reinforcement.reviews.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| status | string (max 32) | No |
| source | string (max 32) | No |
| taskId | UUID | No |
| studentId | UUID | No |
| classroomId | UUID | No |
| sectionId | UUID | No |
| gradeId | UUID | No |
| stageId | UUID | No |
| search / q | string (max 200) | No |
| submittedFrom | ISO date string | No |
| submittedTo | ISO date string | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

**Response:** `ReinforcementReviewQueueListResponseDto`
```json
{
  "items": [
    {
      "id": "uuid",
      "assignmentId": "uuid",
      "taskId": "uuid",
      "stageId": "uuid",
      "studentId": "uuid",
      "enrollmentId": "uuid",
      "status": "string",
      "submittedAt": "string | null",
      "reviewedAt": "string | null",
      "task": {},
      "stage": {},
      "student": {},
      "assignment": {},
      "proof": {},
      "currentReview": {} | null,
      "reviewHistory": [],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": 0,
  "limit": null,
  "offset": null
}
```

### GET /reinforcement/review-queue/:submissionId
**Permission:** `reinforcement.reviews.view`  
**Path Params:** `submissionId` (UUID)  
**Response:** Single `ReinforcementReviewItemResponseDto`

### POST /reinforcement/review-queue/:submissionId/approve
**Permission:** `reinforcement.reviews.manage`  
**Path Params:** `submissionId` (UUID)  
**Request Body:** `ReviewReinforcementSubmissionDto`
```json
{
  "note": "string max 2000 (optional)",
  "noteAr": "string max 2000 (optional)"
}
```

### POST /reinforcement/review-queue/:submissionId/reject
**Permission:** `reinforcement.reviews.manage`  
**Path Params:** `submissionId` (UUID)  
**Request Body:** `ReviewReinforcementSubmissionDto`
```json
{
  "note": "string max 2000 (optional)",
  "noteAr": "string max 2000 (optional)"
}
```

---

## 5. XP Module

**Controller:** `ReinforcementXpController`  
**Base path:** `/reinforcement/xp`

### GET /reinforcement/xp/policies
**Permission:** `reinforcement.xp.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| scopeType | string (max 32) | No |
| scopeKey | string (max 160) | No |
| isActive | boolean | No |
| includeDeleted | boolean | No |

**Response:** Array of `XpPolicyResponseDto`
```json
[
  {
    "id": "uuid | null",
    "academicYearId": "uuid",
    "termId": "uuid",
    "scopeType": "string",
    "scopeKey": "string",
    "dailyCap": 0 | null,
    "weeklyCap": 0 | null,
    "cooldownMinutes": 0 | null,
    "allowedReasons": null,
    "startsAt": "string | null",
    "endsAt": "string | null",
    "isActive": true,
    "isDefault": false,
    "createdAt": "string | null",
    "updatedAt": "string | null"
  }
]
```

### GET /reinforcement/xp/policies/effective
**Permission:** `reinforcement.xp.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | **Yes** |
| scopeType | string (max 32) | No |
| scopeId | UUID | No |
| studentId | UUID | No |
| classroomId | UUID | No |
| sectionId | UUID | No |
| gradeId | UUID | No |
| stageId | UUID | No |

**Response:** Single `XpPolicyResponseDto`

### POST /reinforcement/xp/policies
**Permission:** `reinforcement.xp.manage`  
**Request Body:** `CreateXpPolicyDto`
```json
{
  "academicYearId": "uuid (optional)",
  "yearId": "uuid (optional)",
  "termId": "uuid (required)",
  "scopeType": "string max 32 (required)",
  "scopeId": "uuid | null (optional)",
  "dailyCap": "int ≥0 (optional)",
  "weeklyCap": "int ≥0 (optional)",
  "cooldownMinutes": "int ≥0 (optional)",
  "allowedReasons": "any (optional)",
  "startsAt": "ISO date (optional)",
  "endsAt": "ISO date (optional)",
  "isActive": "boolean (optional)"
}
```
**Response:** Single `XpPolicyResponseDto`

### PATCH /reinforcement/xp/policies/:policyId
**Permission:** `reinforcement.xp.manage`  
**Path Params:** `policyId` (UUID)  
**Request Body:** `UpdateXpPolicyDto`
```json
{
  "dailyCap": "int ≥0 (optional)",
  "weeklyCap": "int ≥0 (optional)",
  "cooldownMinutes": "int ≥0 (optional)",
  "allowedReasons": "any (optional)",
  "startsAt": "ISO date (optional)",
  "endsAt": "ISO date (optional)",
  "isActive": "boolean (optional)"
}
```
**Response:** Single `XpPolicyResponseDto`

### GET /reinforcement/xp/ledger
**Permission:** `reinforcement.xp.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| studentId | UUID | No |
| classroomId | UUID | No |
| sectionId | UUID | No |
| gradeId | UUID | No |
| stageId | UUID | No |
| sourceType | string (max 48) | No |
| sourceId | string (max 160) | No |
| occurredFrom | ISO date string | No |
| occurredTo | ISO date string | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

**Response:** Array of `XpLedgerResponseDto`
```json
[
  {
    "id": "uuid",
    "academicYearId": "uuid",
    "termId": "uuid",
    "studentId": "uuid",
    "enrollmentId": "uuid | null",
    "assignmentId": "uuid | null",
    "policyId": "uuid | null",
    "sourceType": "string",
    "sourceId": "string",
    "amount": 10,
    "reason": "string | null",
    "reasonAr": "string | null",
    "actorUserId": "uuid | null",
    "occurredAt": "string",
    "student": {} | null,
    "createdAt": "string"
  }
]
```

### GET /reinforcement/xp/summary
**Permission:** `reinforcement.xp.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | **Yes** |
| scopeType | string (max 32) | No |
| scopeId | UUID | No |
| classroomId | UUID | No |
| sectionId | UUID | No |
| gradeId | UUID | No |
| stageId | UUID | No |
| studentId | UUID | No |
| occurredFrom | ISO date string | No |
| occurredTo | ISO date string | No |

**Response:** XP summary object (aggregated totals)

### POST /reinforcement/xp/grants/reinforcement-review/:submissionId
**Permission:** `reinforcement.xp.manage`  
**Path Params:** `submissionId` (UUID)  
**Request Body:** `GrantXpForReinforcementReviewDto`
```json
{
  "amount": "int ≥1 (optional)",
  "reason": "string max 500 (optional)",
  "reasonAr": "string max 500 (optional)"
}
```

### POST /reinforcement/xp/grants/manual
**Permission:** `reinforcement.xp.manage`  
**Request Body:** `GrantManualXpDto`
```json
{
  "academicYearId": "uuid (optional)",
  "yearId": "uuid (optional)",
  "termId": "uuid (required)",
  "studentId": "uuid (required)",
  "enrollmentId": "uuid | null (optional)",
  "amount": "int ≥1 (required)",
  "reason": "string max 500 (required)",
  "reasonAr": "string max 500 (optional)",
  "sourceId": "string max 160 (optional)",
  "dedupeKey": "string max 160 (optional)"
}
```

---

## 6. Rewards Module

### 6a. Reward Catalog

**Controller:** `RewardCatalogController`  
**Base path:** `/reinforcement/rewards`

### GET /reinforcement/rewards/catalog
**Permission:** `reinforcement.rewards.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| termId | UUID | No |
| status | `draft` / `published` / `archived` | No |
| type | `physical` / `digital` / `privilege` / `certificate` / `other` | No |
| search | string (max 200) | No |
| includeArchived | boolean | No |
| includeDeleted | boolean | No |
| onlyAvailable | boolean | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

### GET /reinforcement/rewards/catalog/:rewardId
**Permission:** `reinforcement.rewards.view`  
**Path Params:** `rewardId` (UUID)

### POST /reinforcement/rewards/catalog
**Permission:** `reinforcement.rewards.manage`  
**Request Body:** `CreateRewardCatalogItemDto`
```json
{
  "academicYearId": "uuid (optional)",
  "termId": "uuid (optional)",
  "titleEn": "string max 255 (optional)",
  "titleAr": "string max 255 (optional)",
  "descriptionEn": "string max 2000 (optional)",
  "descriptionAr": "string max 2000 (optional)",
  "type": "physical | digital | privilege | certificate | other (optional)",
  "minTotalXp": "int ≥0 (optional)",
  "stockQuantity": "int ≥0 (optional)",
  "stockRemaining": "int ≥0 (optional)",
  "isUnlimited": "boolean (optional)",
  "imageFileId": "uuid (optional)",
  "sortOrder": "int (optional)",
  "metadata": "{} (optional)"
}
```

### PATCH /reinforcement/rewards/catalog/:rewardId
**Permission:** `reinforcement.rewards.manage`  
**Path Params:** `rewardId` (UUID)  
**Request Body:** `UpdateRewardCatalogItemDto` (same fields as Create, all optional)

### POST /reinforcement/rewards/catalog/:rewardId/publish
**Permission:** `reinforcement.rewards.manage`  
**Path Params:** `rewardId` (UUID)  
**Request Body:** None

### POST /reinforcement/rewards/catalog/:rewardId/archive
**Permission:** `reinforcement.rewards.manage`  
**Path Params:** `rewardId` (UUID)  
**Request Body:** `ArchiveRewardCatalogItemDto`
```json
{
  "reason": "string max 1000 (optional)"
}
```

---

### 6b. Reward Dashboard

**Controller:** `RewardDashboardController`  
**Base path:** `/reinforcement/rewards`

### GET /reinforcement/rewards/overview
**Permission:** `reinforcement.rewards.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| termId | UUID | No |
| studentId | UUID | No |
| status | `requested`/`approved`/`rejected`/`fulfilled`/`cancelled` | No |
| type | `physical`/`digital`/`privilege`/`certificate`/`other` | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |
| includeArchived | boolean | No |

### GET /reinforcement/rewards/students/:studentId/summary
**Permission:** `reinforcement.rewards.redemptions.view`  
**Path Params:** `studentId` (UUID)  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| termId | UUID | No |
| includeCatalogEligibility | boolean | No |
| includeHistory | boolean | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |

### GET /reinforcement/rewards/catalog-summary
**Permission:** `reinforcement.rewards.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| termId | UUID | No |
| status | `draft`/`published`/`archived` | No |
| type | `physical`/`digital`/`privilege`/`certificate`/`other` | No |
| includeArchived | boolean | No |
| includeDeleted | boolean | No |
| onlyAvailable | boolean | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |

---

### 6c. Reward Redemptions

**Controller:** `RewardRedemptionsController`  
**Base path:** `/reinforcement/rewards`

### GET /reinforcement/rewards/redemptions
**Permission:** `reinforcement.rewards.redemptions.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| status | `requested`/`approved`/`rejected`/`fulfilled`/`cancelled` | No |
| catalogItemId | UUID | No |
| studentId | UUID | No |
| academicYearId | UUID | No |
| termId | UUID | No |
| requestSource | `dashboard`/`teacher`/`student_app`/`parent_app`/`system` | No |
| requestedFrom | ISO 8601 date | No |
| requestedTo | ISO 8601 date | No |
| includeTerminal | boolean | No |
| search | string (max 200) | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

### GET /reinforcement/rewards/redemptions/:redemptionId
**Permission:** `reinforcement.rewards.redemptions.view`  
**Path Params:** `redemptionId` (UUID)

### POST /reinforcement/rewards/redemptions
**Permission:** `reinforcement.rewards.redemptions.request`  
**Request Body:** `CreateRewardRedemptionDto`
```json
{
  "catalogItemId": "uuid (required)",
  "studentId": "uuid (required)",
  "enrollmentId": "uuid (optional)",
  "academicYearId": "uuid (optional)",
  "termId": "uuid (optional)",
  "requestSource": "dashboard | teacher | student_app | parent_app | system (optional)",
  "requestNoteEn": "string max 1000 (optional)",
  "requestNoteAr": "string max 1000 (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/rewards/redemptions/:redemptionId/cancel
**Permission:** `reinforcement.rewards.redemptions.request`  
**Path Params:** `redemptionId` (UUID)  
**Request Body:** `CancelRewardRedemptionDto`
```json
{
  "cancellationReasonEn": "string max 1000 (optional)",
  "cancellationReasonAr": "string max 1000 (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/rewards/redemptions/:redemptionId/approve
**Permission:** `reinforcement.rewards.redemptions.review`  
**Path Params:** `redemptionId` (UUID)  
**Request Body:** `ApproveRewardRedemptionDto`
```json
{
  "reviewNoteEn": "string max 1000 (optional)",
  "reviewNoteAr": "string max 1000 (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/rewards/redemptions/:redemptionId/reject
**Permission:** `reinforcement.rewards.redemptions.review`  
**Path Params:** `redemptionId` (UUID)  
**Request Body:** `RejectRewardRedemptionDto`
```json
{
  "reviewNoteEn": "string max 1000 (optional)",
  "reviewNoteAr": "string max 1000 (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/rewards/redemptions/:redemptionId/fulfill
**Permission:** `reinforcement.rewards.fulfill`  
**Path Params:** `redemptionId` (UUID)  
**Request Body:** `FulfillRewardRedemptionDto`
```json
{
  "fulfillmentNoteEn": "string max 1000 (optional)",
  "fulfillmentNoteAr": "string max 1000 (optional)",
  "metadata": "{} (optional)"
}
```

---

## 7. Hero Journey Module

### 7a. Badge & Mission CRUD

**Controller:** `HeroJourneyController`  
**Base path:** `/reinforcement/hero`

### GET /reinforcement/hero/badges
**Permission:** `reinforcement.hero.badges.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| search | string (max 200) | No |
| isActive | boolean | No |
| includeDeleted | boolean | No |

### GET /reinforcement/hero/badges/:badgeId
**Permission:** `reinforcement.hero.badges.view`  
**Path Params:** `badgeId` (UUID)

### POST /reinforcement/hero/badges
**Permission:** `reinforcement.hero.badges.manage`  
**Request Body:** `CreateHeroBadgeDto`
```json
{
  "slug": "string max 100 (required)",
  "nameEn": "string max 255 (optional)",
  "nameAr": "string max 255 (optional)",
  "descriptionEn": "string max 1000 (optional)",
  "descriptionAr": "string max 1000 (optional)",
  "assetPath": "string max 500 (optional)",
  "fileId": "uuid (optional)",
  "sortOrder": "int (optional)",
  "isActive": "boolean (optional)",
  "metadata": "{} (optional)"
}
```

### PATCH /reinforcement/hero/badges/:badgeId
**Permission:** `reinforcement.hero.badges.manage`  
**Path Params:** `badgeId` (UUID)  
**Request Body:** `UpdateHeroBadgeDto` (same fields as Create, all optional including slug)

### DELETE /reinforcement/hero/badges/:badgeId
**Permission:** `reinforcement.hero.badges.manage`  
**Path Params:** `badgeId` (UUID)  
**Response:** `{ "ok": true }`

### GET /reinforcement/hero/missions
**Permission:** `reinforcement.hero.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| stageId | UUID | No |
| subjectId | UUID | No |
| status | `draft` / `published` / `archived` | No |
| search | string (max 200) | No |
| includeArchived | boolean | No |
| includeDeleted | boolean | No |
| limit | int (1-100) | No |
| offset | int (≥0) | No |

### GET /reinforcement/hero/missions/:missionId
**Permission:** `reinforcement.hero.view`  
**Path Params:** `missionId` (UUID)

### POST /reinforcement/hero/missions
**Permission:** `reinforcement.hero.manage`  
**Request Body:** `CreateHeroMissionDto`
```json
{
  "academicYearId": "uuid (optional)",
  "yearId": "uuid (optional)",
  "termId": "uuid (required)",
  "stageId": "uuid (required)",
  "subjectId": "uuid (optional)",
  "linkedAssessmentId": "uuid (optional)",
  "linkedLessonRef": "string max 255 (optional)",
  "titleEn": "string max 255 (optional)",
  "titleAr": "string max 255 (optional)",
  "briefEn": "string max 2000 (optional)",
  "briefAr": "string max 2000 (optional)",
  "requiredLevel": "int ≥1 (optional)",
  "rewardXp": "int ≥0 (optional)",
  "badgeRewardId": "uuid (optional)",
  "positionX": "int (optional)",
  "positionY": "int (optional)",
  "sortOrder": "int (optional)",
  "metadata": "{} (optional)",
  "objectives": [
    {
      "type": "string max 32 (optional)",
      "titleEn": "string max 255 (optional)",
      "titleAr": "string max 255 (optional)",
      "subtitleEn": "string max 500 (optional)",
      "subtitleAr": "string max 500 (optional)",
      "linkedAssessmentId": "uuid (optional)",
      "linkedLessonRef": "string max 255 (optional)",
      "sortOrder": "int (optional)",
      "isRequired": "boolean (optional)",
      "metadata": "{} (optional)"
    }
  ]
}
```

### PATCH /reinforcement/hero/missions/:missionId
**Permission:** `reinforcement.hero.manage`  
**Path Params:** `missionId` (UUID)  
**Request Body:** `UpdateHeroMissionDto` (same fields as Create, all optional)

### POST /reinforcement/hero/missions/:missionId/publish
**Permission:** `reinforcement.hero.manage`  
**Path Params:** `missionId` (UUID)  
**Request Body:** None

### POST /reinforcement/hero/missions/:missionId/archive
**Permission:** `reinforcement.hero.manage`  
**Path Params:** `missionId` (UUID)  
**Request Body:** `ArchiveHeroMissionDto`
```json
{
  "reason": "string max 1000 (optional)"
}
```

### DELETE /reinforcement/hero/missions/:missionId
**Permission:** `reinforcement.hero.manage`  
**Path Params:** `missionId` (UUID)  
**Response:** `{ "ok": true }`

---

### 7b. Hero Journey Progress

**Controller:** `HeroJourneyProgressController`  
**Base path:** `/reinforcement/hero`

### GET /reinforcement/hero/students/:studentId/progress
**Permission:** `reinforcement.hero.progress.view`  
**Path Params:** `studentId` (UUID)  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| stageId | UUID | No |
| status | `not_started`/`in_progress`/`completed`/`cancelled` | No |
| includeAvailable | boolean | No |
| includeArchived | boolean | No |

### GET /reinforcement/hero/progress/:progressId
**Permission:** `reinforcement.hero.progress.view`  
**Path Params:** `progressId` (UUID)

### POST /reinforcement/hero/students/:studentId/missions/:missionId/start
**Permission:** `reinforcement.hero.progress.manage`  
**Path Params:** `studentId` (UUID), `missionId` (UUID)  
**Request Body:** `StartHeroMissionDto`
```json
{
  "enrollmentId": "uuid (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/hero/progress/:progressId/objectives/:objectiveId/complete
**Permission:** `reinforcement.hero.progress.manage`  
**Path Params:** `progressId` (UUID), `objectiveId` (UUID)  
**Request Body:** `CompleteHeroObjectiveDto`
```json
{
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/hero/progress/:progressId/complete
**Permission:** `reinforcement.hero.progress.manage`  
**Path Params:** `progressId` (UUID)  
**Request Body:** `CompleteHeroMissionDto`
```json
{
  "metadata": "{} (optional)"
}
```

---

### 7c. Hero Journey Rewards

**Controller:** `HeroJourneyRewardsController`  
**Base path:** `/reinforcement/hero`

### POST /reinforcement/hero/progress/:progressId/grant-xp
**Permission:** `reinforcement.hero.progress.manage`  
**Path Params:** `progressId` (UUID)  
**Request Body:** `GrantHeroMissionXpDto`
```json
{
  "amount": "int ≥1 (optional)",
  "reason": "string max 500 (optional)",
  "reasonAr": "string max 500 (optional)",
  "metadata": "{} (optional)"
}
```

### POST /reinforcement/hero/progress/:progressId/award-badge
**Permission:** `reinforcement.hero.progress.manage`  
**Path Params:** `progressId` (UUID)  
**Request Body:** `AwardHeroMissionBadgeDto`
```json
{
  "metadata": "{} (optional)"
}
```

### GET /reinforcement/hero/students/:studentId/rewards
**Permission:** `reinforcement.hero.progress.view`  
**Path Params:** `studentId` (UUID)  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| includeEvents | boolean | No |

---

### 7d. Hero Journey Dashboard

**Controller:** `HeroJourneyDashboardController`  
**Base path:** `/reinforcement/hero`

### GET /reinforcement/hero/overview
**Permission:** `reinforcement.hero.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |
| stageId | UUID | No |
| gradeId | UUID | No |
| sectionId | UUID | No |
| classroomId | UUID | No |
| studentId | UUID | No |

### GET /reinforcement/hero/map
**Permission:** `reinforcement.hero.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| stageId | UUID | No |
| subjectId | UUID | No |
| studentId | UUID | No |
| includeDraft | boolean | No |
| includeArchived | boolean | No |

### GET /reinforcement/hero/stages/:stageId/summary
**Permission:** `reinforcement.hero.view`  
**Path Params:** `stageId` (UUID)  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| dateFrom | ISO date string | No |
| dateTo | ISO date string | No |

### GET /reinforcement/hero/classrooms/:classroomId/summary
**Permission:** `reinforcement.hero.view`  
**Path Params:** `classroomId` (UUID)  
**Query Params:** Same as stage summary

### GET /reinforcement/hero/badge-summary
**Permission:** `reinforcement.hero.badges.view`  
**Query Params:**
| Param | Type | Required |
|-------|------|----------|
| academicYearId | UUID | No |
| yearId | UUID | No |
| termId | UUID | No |
| stageId | UUID | No |
| classroomId | UUID | No |
| studentId | UUID | No |
| includeInactive | boolean | No |

---

## Summary: All Endpoints (Quick Reference)

| # | Method | Path | Module |
|---|--------|------|--------|
| 1 | GET | `/reinforcement/overview` | Overview |
| 2 | GET | `/reinforcement/students/:studentId/progress` | Overview |
| 3 | GET | `/reinforcement/classrooms/:classroomId/summary` | Overview |
| 4 | GET | `/reinforcement/filter-options` | Tasks |
| 5 | GET | `/reinforcement/tasks` | Tasks |
| 6 | POST | `/reinforcement/tasks` | Tasks |
| 7 | GET | `/reinforcement/tasks/:taskId` | Tasks |
| 8 | POST | `/reinforcement/tasks/:taskId/duplicate` | Tasks |
| 9 | POST | `/reinforcement/tasks/:taskId/cancel` | Tasks |
| 10 | GET | `/reinforcement/templates` | Templates |
| 11 | POST | `/reinforcement/templates` | Templates |
| 12 | POST | `/reinforcement/assignments/:assignmentId/stages/:stageId/submit` | Reviews |
| 13 | GET | `/reinforcement/review-queue` | Reviews |
| 14 | GET | `/reinforcement/review-queue/:submissionId` | Reviews |
| 15 | POST | `/reinforcement/review-queue/:submissionId/approve` | Reviews |
| 16 | POST | `/reinforcement/review-queue/:submissionId/reject` | Reviews |
| 17 | GET | `/reinforcement/xp/policies` | XP |
| 18 | GET | `/reinforcement/xp/policies/effective` | XP |
| 19 | POST | `/reinforcement/xp/policies` | XP |
| 20 | PATCH | `/reinforcement/xp/policies/:policyId` | XP |
| 21 | GET | `/reinforcement/xp/ledger` | XP |
| 22 | GET | `/reinforcement/xp/summary` | XP |
| 23 | POST | `/reinforcement/xp/grants/reinforcement-review/:submissionId` | XP |
| 24 | POST | `/reinforcement/xp/grants/manual` | XP |
| 25 | GET | `/reinforcement/rewards/catalog` | Rewards |
| 26 | GET | `/reinforcement/rewards/catalog/:rewardId` | Rewards |
| 27 | POST | `/reinforcement/rewards/catalog` | Rewards |
| 28 | PATCH | `/reinforcement/rewards/catalog/:rewardId` | Rewards |
| 29 | POST | `/reinforcement/rewards/catalog/:rewardId/publish` | Rewards |
| 30 | POST | `/reinforcement/rewards/catalog/:rewardId/archive` | Rewards |
| 31 | GET | `/reinforcement/rewards/overview` | Rewards |
| 32 | GET | `/reinforcement/rewards/students/:studentId/summary` | Rewards |
| 33 | GET | `/reinforcement/rewards/catalog-summary` | Rewards |
| 34 | GET | `/reinforcement/rewards/redemptions` | Rewards |
| 35 | GET | `/reinforcement/rewards/redemptions/:redemptionId` | Rewards |
| 36 | POST | `/reinforcement/rewards/redemptions` | Rewards |
| 37 | POST | `/reinforcement/rewards/redemptions/:redemptionId/cancel` | Rewards |
| 38 | POST | `/reinforcement/rewards/redemptions/:redemptionId/approve` | Rewards |
| 39 | POST | `/reinforcement/rewards/redemptions/:redemptionId/reject` | Rewards |
| 40 | POST | `/reinforcement/rewards/redemptions/:redemptionId/fulfill` | Rewards |
| 41 | GET | `/reinforcement/hero/badges` | Hero Journey |
| 42 | GET | `/reinforcement/hero/badges/:badgeId` | Hero Journey |
| 43 | POST | `/reinforcement/hero/badges` | Hero Journey |
| 44 | PATCH | `/reinforcement/hero/badges/:badgeId` | Hero Journey |
| 45 | DELETE | `/reinforcement/hero/badges/:badgeId` | Hero Journey |
| 46 | GET | `/reinforcement/hero/missions` | Hero Journey |
| 47 | GET | `/reinforcement/hero/missions/:missionId` | Hero Journey |
| 48 | POST | `/reinforcement/hero/missions` | Hero Journey |
| 49 | PATCH | `/reinforcement/hero/missions/:missionId` | Hero Journey |
| 50 | POST | `/reinforcement/hero/missions/:missionId/publish` | Hero Journey |
| 51 | POST | `/reinforcement/hero/missions/:missionId/archive` | Hero Journey |
| 52 | DELETE | `/reinforcement/hero/missions/:missionId` | Hero Journey |
| 53 | GET | `/reinforcement/hero/students/:studentId/progress` | Hero Progress |
| 54 | GET | `/reinforcement/hero/progress/:progressId` | Hero Progress |
| 55 | POST | `/reinforcement/hero/students/:studentId/missions/:missionId/start` | Hero Progress |
| 56 | POST | `/reinforcement/hero/progress/:progressId/objectives/:objectiveId/complete` | Hero Progress |
| 57 | POST | `/reinforcement/hero/progress/:progressId/complete` | Hero Progress |
| 58 | POST | `/reinforcement/hero/progress/:progressId/grant-xp` | Hero Rewards |
| 59 | POST | `/reinforcement/hero/progress/:progressId/award-badge` | Hero Rewards |
| 60 | GET | `/reinforcement/hero/students/:studentId/rewards` | Hero Rewards |
| 61 | GET | `/reinforcement/hero/overview` | Hero Dashboard |
| 62 | GET | `/reinforcement/hero/map` | Hero Dashboard |
| 63 | GET | `/reinforcement/hero/stages/:stageId/summary` | Hero Dashboard |
| 64 | GET | `/reinforcement/hero/classrooms/:classroomId/summary` | Hero Dashboard |
| 65 | GET | `/reinforcement/hero/badge-summary` | Hero Dashboard |
