enum GuildRank {
  Founder = 40,
  Leader = 30,
  Officer = 20,
  Member = 10,
  Initiate = 0
}

export function getGuildRank(rank: number): string {
  return GuildRank[rank];
}
