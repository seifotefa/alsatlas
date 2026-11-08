export type Tri = 'yes' | 'no' | 'unknown';
export type EvidenceSource = 'patient-reported' | 'clinician-observed' | 'document-extracted';
export type Evidence = { type: string; value: Tri | string; date?: string; region?: string; source: EvidenceSource; confirmed?: boolean; sourceDocumentId?: string; originalText?: string };
export type StructuredClinicalIntake = {
  age?: number;
  patientSuspectsAls?: Tri;
  motorSymptoms?: Tri;
  asymmetry?: Tri;
  progression?: Tri;
  speechDifficulty?: Tri;
  swallowingDifficulty?: Tri;
  pseudobulbarAffect?: Tri;
  cognitiveSymptoms?: Tri;
  mobilityImpairment?: Tri;
  motorNeuronSigns?: Tri;
  failureToThrive?: Tri;
  handwriting?: Tri;
  lifting?: Tri;
  everydayTasks?: Tri;
  dressing?: Tri;
  tripping?: Tri;
  stairs?: Tri;
  footDrag?: Tri;
  breathExertion?: Tri;
  orthopnea?: Tri;
  emotionalLability?: Tri;
  slurredSpeech?: Tri;
  swallowing?: Tri;
  excessSaliva?: Tri;
  pain?: Tri;
  sensoryLoss?: Tri;
};

const upperBody = ['handwriting', 'lifting', 'everydayTasks', 'dressing'] as const;
const lowerBody = ['tripping', 'stairs', 'footDrag'] as const;
const respiratory = ['breathExertion', 'orthopnea'] as const;
const featureLabels: Record<string, string> = {
  handwriting: 'Impaired handwriting',
  lifting: 'Difficulty lifting, reaching, or carrying',
  everydayTasks: 'Difficulty with everyday tasks',
  dressing: 'Trouble with dressing or hygiene',
  tripping: 'Frequent tripping',
  stairs: 'Difficulty on stairs, rising, or standing on toes',
  footDrag: 'Foot drag or a shorter walking distance',
  breathExertion: 'Shortness of breath with exertion or daily activities',
  orthopnea: 'Shortness of breath when lying down',
  emotionalLability: 'Emotional lability',
  slurredSpeech: 'Slurred speech',
  swallowing: 'Difficulty swallowing',
  excessSaliva: 'Excess saliva',
  cognitiveSymptoms: 'Cognitive changes with weakness',
  motorNeuronSigns: 'Upper or lower motor neuron signs',
  failureToThrive: 'Failure to thrive',
  patientSuspectsAls: 'The person suspects ALS',
  pain: 'Pain with the weakness',
  sensoryLoss: 'Numbness or loss of feeling',
};

const ref = (id: string, page: number, feature: string) => ({ id, page, feature, version: 'ReferALS v1', audience: 'physician-facing' as const });

function fold(intake: StructuredClinicalIntake, keys: readonly string[], explicit?: Tri): Tri {
  if (explicit === 'yes' || explicit === 'no' || explicit === 'unknown') return explicit;
  const present = keys.filter(key => intake[key as keyof StructuredClinicalIntake] !== undefined);
  if (!present.length) return 'unknown';
  if (present.some(key => intake[key as keyof StructuredClinicalIntake] === 'yes')) return 'yes';
  if (present.every(key => intake[key as keyof StructuredClinicalIntake] === 'no')) return 'no';
  return 'unknown';
}

export function evaluateReferALS(intake: StructuredClinicalIntake, evidence: Evidence[] = []) {
  const motorSymptoms = fold(intake, [...upperBody, ...lowerBody], intake.motorSymptoms);
  const mobilityImpairment = fold(intake, lowerBody, intake.mobilityImpairment);
  const speechDifficulty = fold(intake, ['slurredSpeech'], intake.speechDifficulty);
  const swallowingDifficulty = fold(intake, ['swallowing'], intake.swallowingDifficulty);
  const pseudobulbarAffect = fold(intake, ['emotionalLability'], intake.pseudobulbarAffect);
  const asymmetry = intake.asymmetry ?? 'unknown';
  const progression = intake.progression ?? 'unknown';
  const cognitiveSymptoms = intake.cognitiveSymptoms ?? 'unknown';
  const motorNeuronSigns = intake.motorNeuronSigns ?? 'unknown';
  const failureToThrive = intake.failureToThrive ?? 'unknown';
  const patientSuspectsAls = intake.patientSuspectsAls ?? 'unknown';
  const breathing = fold(intake, respiratory);
  const val = (value: Tri) => value;

  const immediate: any[] = [];
  const consider: any[] = [];
  const partial: any[] = [];
  const review: any[] = [];
  const missing: string[] = [];
  const add = (arr: any[], id: string, label: string, page: number, condition: string) => arr.push({ id, label, condition, sourceReference: ref(id, page, label) });

  if (asymmetry === 'yes' && progression === 'yes' && motorSymptoms === 'yes') add(immediate, 'R01', 'Asymmetry and progression', 1, 'Motor symptoms plus asymmetry plus progression');
  else if ([asymmetry, progression, motorSymptoms].some(item => item === 'yes')) partial.push({ id: 'R01', label: 'Asymmetry and progression', reason: 'Motor symptoms, asymmetry, and progression must be documented together', sourceReference: ref('R01', 1, 'Asymmetry and progression') });

  if ((speechDifficulty === 'yes' || swallowingDifficulty === 'yes') && progression === 'yes') add(immediate, 'R02', 'Progressive speech and/or swallowing difficulties', 1, 'Speech or swallowing difficulty plus progression');
  else if (speechDifficulty === 'yes' || swallowingDifficulty === 'yes') partial.push({ id: 'R02', label: 'Progressive speech and/or swallowing difficulties', reason: 'Progression is not documented', sourceReference: ref('R02', 1, 'Progressive speech and/or swallowing difficulties') });

  if (breathing === 'yes' && progression === 'yes') add(immediate, 'R08', 'Progressive respiratory change', 1, 'Shortness of breath with activity or when lying down, plus progression');
  else if (breathing === 'yes') partial.push({ id: 'R08', label: 'Respiratory change', reason: 'Progression is not documented', sourceReference: ref('R08', 1, 'Respiratory change') });

  if (val(pseudobulbarAffect) === 'yes') {
    if (evidence.some(item => item.type === 'pseudobulbarAffect' && item.source === 'clinician-observed' && item.confirmed)) add(immediate, 'R03', 'Pseudobulbar affect', 1, 'Clinician-confirmed pseudobulbar affect');
    else review.push({ id: 'R03', label: 'Pseudobulbar affect', reason: 'Requires clinician confirmation', sourceReference: ref('R03', 1, 'Pseudobulbar affect') });
  }

  if (intake.excessSaliva === 'yes') add(consider, 'R09', 'Excess saliva', 1, 'Listed bulbar feature');

  if (cognitiveSymptoms === 'yes' && (mobilityImpairment === 'yes' || motorSymptoms === 'yes')) add(consider, 'R04', 'Cognitive symptoms with mobility impairment or weakness', 1, 'Both cognitive symptoms and mobility impairment or weakness');
  else if (cognitiveSymptoms === 'yes') partial.push({ id: 'R04', label: 'Cognitive symptoms with mobility impairment or weakness', reason: 'Both components must be documented', sourceReference: ref('R04', 1, 'Cognitive symptoms with mobility impairment or weakness') });

  if (motorNeuronSigns === 'yes') {
    if (evidence.some(item => item.type === 'motorNeuronSigns' && item.source === 'clinician-observed' && item.confirmed)) add(consider, 'R05', 'Upper and/or lower motor neuron signs', 1, 'Clinician-observed signs');
    else review.push({ id: 'R05', label: 'Upper and/or lower motor neuron signs', reason: 'Patient report alone cannot confirm examination signs', sourceReference: ref('R05', 1, 'Upper and/or lower motor neuron signs') });
  }

  if (failureToThrive === 'yes') add(consider, 'R06', 'Failure to thrive in an elderly patient', 1, 'Clinician-assessed failure to thrive; no age cutoff invented');
  if (patientSuspectsAls === 'yes') add(consider, 'R07', 'Patient suspects ALS', 1, 'Explicit patient concern');

  for (const [key, label] of Object.entries({ motorSymptoms: 'motor symptoms', asymmetry: 'asymmetry', progression: 'progression', speechDifficulty: 'speech difficulty', swallowingDifficulty: 'swallowing difficulty' })) {
    const value = key === 'motorSymptoms' ? motorSymptoms : key === 'speechDifficulty' ? speechDifficulty : key === 'swallowingDifficulty' ? swallowingDifficulty : key === 'asymmetry' ? asymmetry : progression;
    if (value === 'unknown') missing.push(label);
  }

  const reportedChanges = Object.entries(featureLabels)
    .filter(([key]) => intake[key as keyof StructuredClinicalIntake] === 'yes')
    .map(([, label]) => label);
  const cautions = [
    intake.pain === 'yes' ? featureLabels.pain : '',
    intake.sensoryLoss === 'yes' ? featureLabels.sensoryLoss : '',
  ].filter(Boolean);

  return {
    guidelineVersion: 'referals-v1',
    source: 'ALS Canada ReferALS Early Referral Tool',
    matchedImmediateIndicators: immediate,
    matchedConsiderIndicators: consider,
    partiallyDocumentedIndicators: partial,
    clinicianReviewRequired: review,
    reportedChanges,
    cautions,
    supportingObservations: evidence,
    diagnosticPitfallFlags: [],
    missingInformation: missing,
    sourceReferences: [ref('ReferALS', 1, 'Primary referral indicators'), ref('ReferALS', 2, 'Referral before definitive diagnosis')],
    safetyNotices: ['This is referral support, not diagnosis. Severe breathing difficulty, choking, or sudden neurological change requires urgent medical attention.'],
    generatedAt: new Date().toISOString(),
  };
}
