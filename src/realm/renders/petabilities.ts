export enum PetAbilityID {
  AttackClose = 402,
  AttackMid = 404,
  AttackFar = 405,
  Electric = 406,
  Heal = 407,
  MagicHeal = 408,
  Savage = 409,
  Decoy = 410,
  RisingFury = 411
}

// type: "id"
export const petAbilities = {
  [PetAbilityID.AttackClose]: 'Attack Close',
  [PetAbilityID.AttackMid]: 'Attack Mid',
  [PetAbilityID.AttackFar]: 'Attack Far',
  [PetAbilityID.Electric]: 'Electric',
  [PetAbilityID.Heal]: 'Heal',
  [PetAbilityID.MagicHeal]: 'Magic Heal',
  [PetAbilityID.Savage]: 'Savage',
  [PetAbilityID.Decoy]: 'Decoy',
  [PetAbilityID.RisingFury]: 'Rising Fury'
};
