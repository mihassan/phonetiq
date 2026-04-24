export function getPairHeadingSizeClass(word: string, partnerWord?: string) {
  const maxLength = Math.max(word.length, partnerWord?.length ?? 0);

  if (maxLength >= 10) return 'text-[40px] md:text-[56px]';
  if (maxLength >= 5) return 'text-[48px] md:text-[68px]';
  return 'text-[52px] md:text-[80px]';
}

export function getPracticeHeadingSizeClass(word: string, partnerWord?: string) {
  const maxLength = Math.max(word.length, partnerWord?.length ?? 0);

  if (maxLength >= 10) return 'text-[34px] md:text-[48px]';
  if (maxLength >= 5) return 'text-[40px] md:text-[56px]';
  return 'text-[46px] md:text-[64px]';
}
