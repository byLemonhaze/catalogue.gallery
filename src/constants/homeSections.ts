export const HOME_SECTION_IDS = {
  hero: 'catalogue-home-hero',
  directory: 'catalogue-home-directory',
  lab: 'catalogue-home-lab',
  apply: 'catalogue-home-apply',
} as const;

export type HomeSectionKey = keyof typeof HOME_SECTION_IDS;
