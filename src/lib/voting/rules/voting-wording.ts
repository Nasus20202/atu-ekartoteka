import { formatCountPl, pluralizePl } from '@/lib/shared/utils/pluralize';

const VOTING_FORMS = {
  one: 'głosowanie',
  few: 'głosowania',
  many: 'głosowań',
};
const WAITS_FORMS = { one: 'czeka', few: 'czekają', many: 'czeka' };
// After "dla", so in the genitive
const FOR_APARTMENT_FORMS = { one: 'lokalu', few: 'lokali', many: 'lokali' };

/** "2 głosowania czekają na Twój głos" */
export const awaitingVotesSentence = (count: number) =>
  `${formatCountPl(count, VOTING_FORMS)} ${pluralizePl(count, WAITS_FORMS)} na Twój głos`;

/** "Zapisaliśmy Twój głos dla 2 lokali." */
export const savedVoteSentence = (apartments: number) =>
  `Zapisaliśmy Twój głos dla ${formatCountPl(apartments, FOR_APARTMENT_FORMS)}.`;
