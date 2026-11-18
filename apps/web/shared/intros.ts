export type IntroId = 'prompt' | 'shortcuts';

export interface SiteIntro {
  id: IntroId;
  title: string;
  subtitle: string;
  description: string;
  tags: readonly string[];
  footer: string;
}

export const siteIntros = [
  {
    id: 'prompt',
    title: 'Start Here',
    subtitle: 'A simple place to begin.',
    description: 'Use this space to start a search, shape a thought, or jump into your favorite AI tools. bytab keeps the beginning of your workflow clean, fast, and easy to reach.',
    tags: ['Search', 'AI Shortcuts', 'Quick Access'],
    footer: 'A calm starting point for your next tab.',
  },
  {
    id: 'shortcuts',
    title: 'Your Favorites',
    subtitle: 'The websites you use most, always close by.',
    description: 'Keep your everyday destinations within reach. bytab helps you open familiar places faster, so the tools and sites you use most are always right where you expect them.',
    tags: ['Fast Access', 'Personal', 'Everyday Use'],
    footer: 'Built for the places you return to every day.',
  },
] as const satisfies readonly SiteIntro[];

export function findSiteIntro(id: string | null | undefined): SiteIntro | undefined {
  return siteIntros.find(intro => intro.id === id);
}
