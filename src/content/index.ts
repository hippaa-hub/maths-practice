import type { SkillMeta } from '../engine/types';
import { comparingOffers } from './skills/comparing-offers';
import { decimalsX10 } from './skills/decimals-x10';
import { divisibility } from './skills/divisibility';
import { factorsMultiples } from './skills/factors-multiples';
import { factorsPrimes } from './skills/factors-primes';
import { anglesAlgebra } from './skills/angles-algebra';
import { anglesLinePoint } from './skills/angles-line-point';
import { anglesParallel } from './skills/angles-parallel';
import { anglesTriangle } from './skills/angles-triangle';
import { areaTriangle } from './skills/area-triangle';
import { likeTerms } from './skills/like-terms';
import { multiplyTerms } from './skills/multiply-terms';
import { expandBrackets } from './skills/expand-brackets';
import { surfaceArea } from './skills/surface-area';
import { fractionsAddSub } from './skills/fractions-add-sub';
import { fractionsMulDiv } from './skills/fractions-mul-div';
import { profitLoss } from './skills/profit-loss';
import { orderFdp } from './skills/order-fdp';
import { pctShaded } from './skills/pct-shaded';
import { successiveChanges } from './skills/successive-changes';
import { compareRatios } from './skills/compare-ratios';
import { percentagePoints } from './skills/percentage-points';
import { workingTogether } from './skills/working-together';
import { coefficientConstant } from './skills/coefficient-constant';
import { explainRule } from './skills/explain-rule';
import { formulaFromTable } from './skills/formula-from-table';
import { nthTerm } from './skills/nth-term';
import { sequenceType } from './skills/sequence-type';
import { sequencesContinue } from './skills/sequences-continue';
import { squaresOfNegatives } from './skills/squares-of-negatives';
import { substitutionNegative } from './skills/substitution-negative';
import { substitutionPositive } from './skills/substitution-positive';
import { tableFromFormula } from './skills/table-from-formula';
import { visualPatterns } from './skills/visual-patterns';
import { convertingRates } from './skills/converting-rates';
import { convertingUnits } from './skills/converting-units';
import { ratioEquivalent } from './skills/ratio-equivalent';
import { ratioShare } from './skills/ratio-share';
import { ratioWriteSimplify } from './skills/ratio-write-simplify';
import { recipesProportion } from './skills/recipes-proportion';
import { scaleDrawings } from './skills/scale-drawings';
import { speedDistanceTime } from './skills/speed-distance-time';
import { unitRatesBestBuy } from './skills/unit-rates-best-buy';
import { fractionOfAmount } from './skills/fraction-of-amount';
import { fractionsSimplify } from './skills/fractions-simplify';
import { negAddSub } from './skills/neg-add-sub';
import { negMulDiv } from './skills/neg-mul-div';
import { orderOfOps } from './skills/order-of-ops';
import { fdpConversions } from './skills/fdp-conversions';
import { pctChange } from './skills/pct-change';
import { pctDecrease } from './skills/pct-decrease';
import { pctIncrease } from './skills/pct-increase';
import { pctOfAmount } from './skills/pct-of-amount';
import { pctOneOfAnother } from './skills/pct-one-of-another';
import { reversePct } from './skills/reverse-pct';
import { metaOf, type Skill } from './types';

/**
 * Skills in the order they are introduced. Percentages come first (confidence is lowest there),
 * foundations are slotted in just before the skills that need them. `order` is set from this list.
 */
const INTRO_ORDER: Skill[] = [
  fdpConversions,
  pctShaded,
  orderFdp,
  pctOfAmount,
  pctOneOfAnother,
  pctIncrease,
  pctDecrease,
  pctChange,
  reversePct,
  comparingOffers,
  profitLoss,
  successiveChanges,
  ratioWriteSimplify,
  ratioEquivalent,
  ratioShare,
  compareRatios,
  percentagePoints,
  recipesProportion,
  unitRatesBestBuy,
  speedDistanceTime,
  workingTogether,
  convertingUnits,
  convertingRates,
  scaleDrawings,
  // Unit 2, in the teacher's order (9-13 Nov). Foundations slot in just before the skills that need them.
  sequencesContinue,
  sequenceType,
  visualPatterns,
  orderOfOps,
  tableFromFormula,
  formulaFromTable,
  coefficientConstant,
  substitutionPositive,
  negAddSub,
  negMulDiv,
  substitutionNegative,
  squaresOfNegatives,
  nthTerm,
  explainRule,
  // Class topic from 20 Nov: "Operations with algebraic expressions" (classwork due 27 Nov).
  // Like terms were taught in September; the next two practise the topic (teacher's pages not posted).
  likeTerms,
  multiplyTerms,
  expandBrackets,
  fractionsSimplify,
  fractionOfAmount,
  fractionsAddSub,
  fractionsMulDiv,
  decimalsX10,
  factorsMultiples,
  divisibility,
  factorsPrimes,
  // September geometry (taught): quick checks, after Unit 1 and the foundations
  anglesLinePoint,
  anglesTriangle,
  anglesParallel,
  anglesAlgebra,
  areaTriangle,
  surfaceArea,
];

export const SKILLS: Skill[] = INTRO_ORDER.map((s, i) => ({ ...s, order: i + 1 }));

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const SKILL_METAS: SkillMeta[] = SKILLS.map(metaOf);

export const UNIT_NAMES: Record<number, string> = {
  0: 'Foundations',
  1: 'Percentages, ratio and rates',
  2: 'Patterns and algebra',
  3: 'Number plane and linear graphs',
  4: 'Reasoning and geometry',
  5: 'Statistics and probability',
};

export * from './types';
