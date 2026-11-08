# The Atlas Network

The Atlas Network is an accessibility-first platform connecting early ALS recognition, ongoing care, and patient-powered research.

## Inspiration

For people living with Amyotrophic Lateral Sclerosis (ALS), time matters. Early symptoms such as weakness, speech changes, and difficulty with everyday movement can be difficult to recognize. Patients and caregivers also need to track mobility, speech, breathing, and daily functioning across disconnected appointments and healthcare systems.

We built The Atlas Network around one question:

> What if the entire ALS journey, from the first concerning symptom to long-term monitoring and research participation, could be connected in one platform?

At BioHacks 2026, a representative from the ALS Society of Canada encouraged us to use the ReferALS Early Referral Tool as the clinical foundation for our project.

## What it does

### Early recognition and referral support

The Atlas Network uses ReferALS-informed logic to organize symptoms, progression, and effects on daily activities. It distinguishes patient-reported observations from clinician-confirmed findings and prepares clinician-readable referral summaries.

The platform does not diagnose ALS. It helps patients and clinicians recognize, organize, and communicate relevant information earlier.

### Continuous patient monitoring

Patients and caregivers can track changes between appointments through:

- Daily movement and voice check-ins
- ALSFRS-R functional assessments
- Respiratory measurements such as FVC
- Speech observations
- Longitudinal progression charts
- Caregiver notes and symptom timelines
- Clinical report preparation
- Care-team coordination

Our fictional demonstration patient, Alex Chen, shows how observations recorded across months become a structured and accessible patient history.

### Patient-powered ALS research

Patients can opt in to contribute eligible, de-identified longitudinal information. They can manage consent, choose data categories, review contribution history, and track accepted and pending contributions.

Researchers can explore approved datasets, request governed access, and contribute consultation time. Our prototype models a consultation-based exchange where completed professional office hours contribute access credits toward synthetic research metrics.

## How we built it

**ReferALS — Clinical referral foundation**

The ALS Society of Canada's ReferALS Early Referral Tool provides the foundation for structured symptom documentation and explainable referral-support logic.

**Solana — Research participation receipts**

The Atlas Network uses Solana devnet as a transparent receipt layer for governed research contributions. Patients can see submitted, accepted, pending, and reward-eligible contributions, while health data remains off-chain. The application verifies live Solana devnet connectivity through RPC and is designed to issue de-identified contribution receipts when a reward wallet is configured.

**Google Gemini and Backboard — AI assistance**

AI supports conversational interactions, symptom narrative organization, document understanding, and summarization. AI-generated interpretations remain separate from deterministic clinical referral rules and are grounded in the patient record.

**ElevenLabs — Voice accessibility**

ElevenLabs powers the natural-language voice experience, reducing dependence on typing for people whose motor function or speech may change over time.

**Tiger Data — Longitudinal records**

Tiger Data/PostgreSQL stores longitudinal observations, caregiver check-ins, research consent, media metadata, and time-series progress data. We added read-after-write verification so records are queried back before they appear in the dashboard.

## Challenges

### Building clinically responsible AI

A generative model can summarize symptoms, but it should not independently decide whether someone has ALS. We separated AI assistance from ReferALS-based referral logic and emphasized traceable evidence, uncertainty, and clinician review.

### Designing for accessibility

Voice interactions, simplified check-ins, readable progression displays, camera capture, and caregiver-supported workflows reduce interaction friction.

### Connecting multiple technologies

The project combines clinical referral guidance, AI, voice, time-series infrastructure, research consent, consultations, and blockchain experimentation into one coherent workflow.

### Making research participation meaningful

We designed separate patient and researcher experiences around consent, access permissions, researcher contributions, and responsible handling of sensitive information.

## Accomplishments

- Built a unified patient and caregiver dashboard around a longitudinal care timeline.
- Used an established Canadian ALS referral resource instead of inventing an AI diagnostic score.
- Added daily movement and voice check-in workflows.
- Added functional, respiratory, and speech-related longitudinal observations.
- Created clinician-oriented referral preparation and PDF report workflows.
- Added patient-controlled research consent and contribution tracking.
- Added a researcher workspace with consultations and governed access concepts.
- Integrated Tiger Data persistence and Solana devnet connectivity.
- Designed accessibility into the product architecture.

## What's next

- Complete and clinically review the ReferALS-informed workflow.
- Strengthen movement and voice capture and longitudinal monitoring.
- Complete backend integration and end-to-end testing.
- Add production researcher authorization and dataset governance.
- Explore partnerships with ALS clinics, researchers, and patient organizations.
- Evaluate usability and feasibility before making effectiveness claims.

## Disclaimer

The Atlas Network is a research prototype using fictional demonstration data. It does not diagnose ALS, replace a clinician, or provide medical advice. Research participation is optional, and sensitive health data is not intended to be stored on-chain.

**The Atlas Network isn't about replacing clinicians. It's about connecting the information, people, and research that support the ALS journey.**
