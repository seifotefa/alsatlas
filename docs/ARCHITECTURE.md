# Architecture

## Near-term shape

One Python package owns ingestion, validation, provenance, preprocessing, training, and evaluation. Raw sources are immutable and ignored by Git; processed tables are reproducible derivatives. Model artifacts bundle their ordered feature list. Machine-readable JSON accompanies human-readable Markdown.

## Long-term modules

- **Patient intake:** profiles, dated symptoms, accessibility preferences, caregiver delegation, separate product/research consent, and resumable assessments.
- **Clinical document processing (planned Gemini):** source-linked candidate extractions with confidence and mandatory user review; never silently overwrite data.
- **Longitudinal measurements (planned PostgreSQL/Tiger Data):** append-only, timestamped observations with units, source, verification state, and corrections.
- **Prediction service:** versioned feature contracts, inference provenance, uncertainty, intended-use label, and separation of research from validated tools. It must not depend on Gemini medical judgments.
- **Research contribution:** consent version, eligibility, validation, de-identification, permitted purposes, withdrawal, and immutable provenance. Product access remains independent.
- **Rewards (planned Solana devnet):** contribution receipt IDs only; no identifiers or clinical metadata on-chain.
- **Accessible audio (planned ElevenLabs):** optional playback with equivalent text, without assuming clear speech input.
- **Infrastructure (planned Vultr):** API, workers, private object storage, database, observability, and secrets management; no deployment in this phase.

## Core longitudinal record

Every measurement should carry `patient_id`, `type`, `value`, `unit`, `observed_at`, `source_type`, `source_id`, `verification_status`, `entered_by`, and correction lineage. Clinical and research identities must use separate pseudonymous keys. Uploaded files and extracted fields remain linked so a reviewer can audit every value.

## Safety controls

Purpose limitation, least privilege, encryption, audit logs, retention/withdrawal workflows, explicit model versions, fail-closed schema validation, and dataset-level license/provenance metadata are architectural requirements—not later UI additions.

