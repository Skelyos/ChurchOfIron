export interface GuildMember {
  CharClass: string;
  CharLevel: number;
  FamilyName: string;
  IGN: string;
  AP: number;
  AWAP: number;
  DP: number;
  RenownScore: number;
  Username?: string;
}

export interface NodewarInfo {
  NodewarName: string;
  DateOfActivity: string;
  PeopleAttending: GuildMember[];
}
