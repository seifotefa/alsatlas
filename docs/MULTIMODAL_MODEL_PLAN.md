# Multimodal Dataset Strategy

The accessible datasets are combined as separate evidence modules, not concatenated into one table. They have different participants, labels, instruments, and intended uses; there is no defensible patient-level key joining them.

## Module 1: progression

CASIdata supplies 1,822 people with ALS and a predefined held-out split. Its model estimates the challenge `dFRS` progression-rate target. The conservative production baseline uses static/intake-like fields while the complete first-three-month feature window is audited.

## Module 2: gait research signal

PhysioNet supplies 64 subjects, including only 13 with ALS. Each stride time series is reduced to subject-level mean, standard deviation, median, interquartile range, and left-right asymmetry features. Evaluation uses six stratified subject-disjoint folds, so no strides from a held-out person enter training.

This gait result is an exploratory research signal only. It must not display an ALS probability, diagnose ALS, or override referral guidance. The cohort is too small and its negative class mixes controls, Parkinson's disease, and Huntington's disease.

## Module 3: fictional demonstration

Alex Chen exercises the longitudinal schema and dashboard queries. It is permanently excluded from all fitting and evaluation.

## Platform combination

The dashboard may show these outputs in separate cards:

1. Observed functional trajectory.
2. Experimental nine-month progression-rate estimate for an already diagnosed patient.
3. Gait-change trend compared with that same user's earlier recordings, once enough personal observations exist.
4. Structured symptom/referral report with no diagnostic probability.

Outputs are not averaged into a single "ALS score." Future fusion requires a cohort where the same consented participants have matched survey, clinical, gait, speech, and video measurements plus specialist-confirmed outcomes.

