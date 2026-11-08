import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateReferALS } from './referals.js';

test('upper-body weakness on one side that is progressing is an immediate referral', () => {
  const review = evaluateReferALS({
    handwriting: 'yes', lifting: 'no', everydayTasks: 'no', dressing: 'no',
    tripping: 'no', stairs: 'no', footDrag: 'no',
    asymmetry: 'yes', progression: 'yes',
    slurredSpeech: 'no', swallowing: 'no', excessSaliva: 'no', emotionalLability: 'no',
    breathExertion: 'no', orthopnea: 'no',
    cognitiveSymptoms: 'no', motorNeuronSigns: 'no', failureToThrive: 'no', patientSuspectsAls: 'no',
    pain: 'no', sensoryLoss: 'no',
  });
  assert.equal(review.matchedImmediateIndicators[0].label, 'Asymmetry and progression');
  assert.deepEqual(review.reportedChanges, ['Impaired handwriting']);
});

test('slurred speech that is progressing is an immediate referral', () => {
  const review = evaluateReferALS({ slurredSpeech: 'yes', progression: 'yes', swallowing: 'no' });
  assert.equal(review.matchedImmediateIndicators.some(item => item.id === 'R02'), true);
});

test('a complete set of no answers does not suggest a referral', () => {
  const no = 'no' as const;
  const review = evaluateReferALS({
    handwriting: no, lifting: no, everydayTasks: no, dressing: no,
    tripping: no, stairs: no, footDrag: no,
    asymmetry: no, progression: no,
    slurredSpeech: no, swallowing: no, excessSaliva: no, emotionalLability: no,
    breathExertion: no, orthopnea: no,
    cognitiveSymptoms: no, motorNeuronSigns: no, failureToThrive: no, patientSuspectsAls: no,
  });
  assert.equal(review.matchedImmediateIndicators.length, 0);
  assert.equal(review.matchedConsiderIndicators.length, 0);
  assert.equal(review.partiallyDocumentedIndicators.length, 0);
});
