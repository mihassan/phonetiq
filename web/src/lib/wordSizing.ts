export function getPairHeadingSizeClass(word: string, partnerWord?: string) {
  const maxLength = Math.max(word.length, partnerWord?.length ?? 0);

  if (maxLength >= 10) return 'text-[44px] md:text-[64px]';
  if (maxLength >= 5) return 'text-[52px] md:text-[76px]';
  return 'text-[58px] md:text-[92px]';
}

export function getPracticeHeadingSizeClass(word: string, partnerWord?: string) {
  const maxLength = Math.max(word.length, partnerWord?.length ?? 0);

  if (maxLength >= 10) return 'text-[38px] md:text-[52px]';
  if (maxLength >= 5) return 'text-[44px] md:text-[60px]';
  return 'text-[50px] md:text-[68px]';
}
