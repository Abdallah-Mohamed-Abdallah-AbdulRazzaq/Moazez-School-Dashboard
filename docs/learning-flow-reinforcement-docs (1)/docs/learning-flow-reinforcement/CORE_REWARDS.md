# Core Rewards

Rewards are school reward workflows only. They are not wallet, finance, marketplace, payment, cash, or XP-spend behavior.

## Catalog routes

Base prefix: `/api/v1/reinforcement/rewards`.

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/catalog` | List reward catalog. | `reinforcement.rewards.view` |
| `GET` | `/catalog/:rewardId` | Get reward catalog item. | `reinforcement.rewards.view` |
| `POST` | `/catalog` | Create catalog item. | `reinforcement.rewards.manage` |
| `PATCH` | `/catalog/:rewardId` | Update catalog item. | `reinforcement.rewards.manage` |
| `POST` | `/catalog/:rewardId/publish` | Publish catalog item. | `reinforcement.rewards.manage` |
| `POST` | `/catalog/:rewardId/archive` | Archive catalog item. | `reinforcement.rewards.manage` |

## Redemption routes

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/redemptions` | List redemptions. | `reinforcement.rewards.redemptions.view` |
| `GET` | `/redemptions/:redemptionId` | Get redemption. | `reinforcement.rewards.redemptions.view` |
| `POST` | `/redemptions` | Create redemption request. | `reinforcement.rewards.redemptions.request` |
| `POST` | `/redemptions/:redemptionId/cancel` | Cancel redemption request. | `reinforcement.rewards.redemptions.request` |
| `POST` | `/redemptions/:redemptionId/approve` | Approve redemption. | `reinforcement.rewards.redemptions.review` |
| `POST` | `/redemptions/:redemptionId/reject` | Reject redemption. | `reinforcement.rewards.redemptions.review` |
| `POST` | `/redemptions/:redemptionId/fulfill` | Fulfill approved redemption. | `reinforcement.rewards.fulfill` |

## V1 redemption model

Student redemption in V1 is request/status based:

- Student can request redemption for self.
- Core validates published/not archived status, stock, current enrollment context, XP eligibility, and duplicate-open redemption policy.
- Duplicate open redemption returns conflict.
- XP is not spent or deducted.
- `minTotalXp` is an eligibility threshold.
- Affordability is derived from positive `XpLedger.amount` only.
- Behavior points are not used for affordability.

## App surfaces

| Surface | Capability |
| --- | --- |
| Dashboard/Core | Full catalog and redemption workflow, permission-gated. |
| Student App | List/detail rewards, list/detail own redemptions, request own redemption. |
| Parent App | Read linked child rewards and redemptions only. |
| Teacher App | Display task reward metadata only. |
