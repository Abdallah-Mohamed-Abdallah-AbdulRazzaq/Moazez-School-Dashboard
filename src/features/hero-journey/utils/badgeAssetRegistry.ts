const HERO_JOURNEY_BADGE_ROOT = "/assets/hero-journey/badges";

export const HERO_JOURNEY_BADGE_PLACEHOLDER =
  `${HERO_JOURNEY_BADGE_ROOT}/placeholder.svg`;

const badgeAssetMap: Record<string, string> = {
  "reading-trailblazer": `${HERO_JOURNEY_BADGE_ROOT}/reading-trailblazer.png`,
  "logic-lantern": `${HERO_JOURNEY_BADGE_ROOT}/logic-lantern.png`,
  "focus-flame": `${HERO_JOURNEY_BADGE_ROOT}/focus-flame.png`,
  "science-scout": `${HERO_JOURNEY_BADGE_ROOT}/science-scout.png`,
  "teamwork-spark": `${HERO_JOURNEY_BADGE_ROOT}/teamwork-spark.png`,
  "quiz-sprinter": `${HERO_JOURNEY_BADGE_ROOT}/quiz-sprinter.png`,
  "streak-keeper": `${HERO_JOURNEY_BADGE_ROOT}/streak-keeper.png`,
  "mission-finisher": `${HERO_JOURNEY_BADGE_ROOT}/mission-finisher.png`,
};

export function getHeroJourneyBadgeAssetPath(slug?: string | null) {
  if (!slug) {
    return HERO_JOURNEY_BADGE_PLACEHOLDER;
  }

  return badgeAssetMap[slug] || HERO_JOURNEY_BADGE_PLACEHOLDER;
}

export function getHeroJourneyBadgePlaceholderPath() {
  return HERO_JOURNEY_BADGE_PLACEHOLDER;
}

export const heroJourneyBadgeAssetRegistry = badgeAssetMap;
