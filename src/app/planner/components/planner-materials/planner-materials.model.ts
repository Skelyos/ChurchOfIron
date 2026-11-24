import { GAMES, MaterialRequirement } from '../../models/planner.model';
import { ExperienceCharacter } from '../../data/character-experience';

export interface MaterialGroup {
  game: (typeof GAMES)[number];
  sections: MaterialSection[];
}

export interface MaterialSection {
  id: string;
  label: string;
  rows: MaterialRow[];
}

export interface MaterialRow extends MaterialRequirement {
  characters: ExperienceCharacter[];
  breakdown?: { sectionId: string; sectionLabel: string; required: number }[];
}

