// The tutor's worked examples, one fixed exercise each, in the order of the objectives: the two
// forces of an interaction are equally large, the partner of a force, and why the weight and the
// normal force are no pair. The frames come from the exercise's own worked solution (app.js). Each
// is a topic of practice (topics.js): its stages list exercise types as 'topic/generator'.
// The learning objectives of the check (check.js): what the student can do, the question kinds
// that test it ('type:question key', see FC.checkQuestion), its worked example and practice topic.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: { en: 'Collision', de: 'Zusammenstoss' },
      idea: {
        en: 'Two bodies that interact push on each other equally hard, whatever their masses, charges or motion. The lighter one is affected more, because the same force changes its velocity more.',
        de: 'Zwei Körper, die wechselwirken, drücken gleich stark aufeinander, egal wie gross ihre Massen oder Ladungen sind und wie sie sich bewegen. Der leichtere wird stärker beeinflusst, weil dieselbe Kraft seine Geschwindigkeit stärker ändert.',
      },
      gen: 'collision', params: { case: 'parkedTruck', mC: 1.2, k: 10 },
      practice: [{ types: ['interact/collision'] }, { types: ['interact/push-apart', 'interact/push-car'] }, { types: ['interact/magnets', 'interact/tf-interact'] }],
    },
    {
      name: { en: 'Find the partner', de: 'Die Gegenkraft finden' },
      idea: {
        en: 'Name the two bodies of a force, then swap them: the partner of “A acts on B” is “B acts on A”. A tiny mosquito pushes the windscreen just as hard as the windscreen pushes it.',
        de: 'Nenne die beiden Körper einer Kraft und vertausche sie: Die Gegenkraft zu „A wirkt auf B“ ist „B wirkt auf A“. Eine winzige Mücke drückt genauso stark auf die Windschutzscheibe wie die Scheibe auf sie.',
      },
      gen: 'partner', params: { scene: 'mosquito' },
      practice: [{ types: ['interact/partner'] }, { types: ['interact/match-partners'] }],
    },
    {
      name: { en: 'Weight and its partner', de: 'Gewichtskraft und Gegenkraft' },
      idea: {
        en: 'The weight and the normal force balance on the same body, so they are no pair. The partner of the weight is the pull of the body on the Earth.',
        de: 'Gewichtskraft und Normalkraft heben sich am selben Körper auf, also sind sie kein Paar. Die Gegenkraft zur Gewichtskraft ist die Kraft, mit der der Körper die Erde anzieht.',
      },
      gen: 'support', params: { variant: 'rest', pair: ['book', 'table'], ask: 'weight' },
      practice: [{ types: ['interact/support'] }, { types: ['interact/find-error'] }],
    },
  ];

  const OBJECTIVES = [
    { id: 'equal', kinds: ['interact/collision:force', 'interact/partner:size', 'interact/push-apart:force', 'interact/magnets:force-reason', 'interact/push-car:pair', 'interact/tf-interact:statements'], tutor: 0, topic: 0,
      name: { en: 'State that the two forces of an interaction are equally large and opposite and act on different bodies, whatever their masses, charges or motion.',
        de: 'Angeben, dass die beiden Kräfte einer Wechselwirkung gleich gross und entgegengesetzt sind und auf verschiedene Körper wirken, egal wie gross ihre Massen oder Ladungen sind und wie sie sich bewegen.' } },
    { id: 'partner', kinds: ['interact/partner:partner', 'interact/match-partners:partners'], tutor: 1, topic: 1,
      name: { en: 'Identify the partner of each force in a situation, such as mosquito and windscreen, nucleus and electron, or ice dancer and Earth.',
        de: 'Die Gegenkraft jeder Kraft in einer Situation finden, etwa bei Mücke und Windschutzscheibe, Kern und Elektron oder Eistänzerin und Erde.' } },
    { id: 'normal', kinds: ['interact/support:partner', 'interact/find-error:wrong', 'interact/find-error:why'], tutor: 2, topic: 2,
      name: { en: 'Explain why the normal force is not the partner of the weight, and find a wrong pair in a list of force pairs.',
        de: 'Erklären, warum die Normalkraft nicht die Gegenkraft der Gewichtskraft ist, und ein falsches Paar in einer Liste von Kraftpaaren finden.' } },
  ];

  root.Lessons = { EXAMPLES, OBJECTIVES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES, OBJECTIVES };
})(typeof window !== 'undefined' ? window : globalThis);
