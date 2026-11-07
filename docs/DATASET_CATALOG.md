# Dataset Catalog

Verified 2026-11-07 from repository/provider pages. “License” refers to the dataset where verified; repository or software licenses are not assumed to license underlying clinical data.

| Dataset | Authority / access | Format and size | Labels / intended ALSense use | License / restriction | Priority |
|---|---|---|---|---|---|
| Efron–Hastie ALS (`CASIdata::als`) | [CRAN package](https://cran.r-project.org/package=CASIdata); package documentation links [ALS.txt](https://hastie.su.domains/CASI_files/DATA/ALS.txt) | 1,822 × 371 whitespace-delimited table; local text file 4.36 MB | `dFRS`; 369 engineered predictors; progression baseline only | CASIdata package GPL-3-or-later. A separate underlying-data license was not stated in the package documentation, so raw data stays uncommitted and redistribution needs review. | 1 — downloaded/inspected |
| ALS Focus | [ALS Association researcher page](https://www.als.org/research/als-focus/information-researchers) | De-identified survey/questionnaire files; exact current archive size unverified | Self-reported longitudinal ALSFRS-R/vital capacity; demographics and topical surveys; monitoring/needs research | Free access, but the official page now routes distribution through NeuroVERSE and requires agreement to data-sharing terms. Historical Harvard Dataverse references exist; no specific current dataset DOI/license was verified. | 2 — blocked on terms/account |
| VOC-ALS | [Synapse project syn53009474](https://www.synapse.org/Synapse:syn53009474); [data descriptor](https://doi.org/10.1038/s41597-024-03597-2) | 1,224 WAV files: five sustained vowels + three syllable-repetition tasks for each of 153 people | 102 ALS, 51 controls; speech ALSFRS-R and dysarthria severity; future impairment monitoring | Synapse account and applicable access terms required. Voice can be identifying; no bypass or download attempted. | 3 |
| Gait in Neurodegenerative Disease | [PhysioNet v1.0.0](https://physionet.org/content/gaitndd/1.0.0/) | 17.9 MB; 64 subjects; binary left/right signals and unfiltered 13-column `.ts` stride series | 13 ALS, 15 Parkinson’s, 20 Huntington’s, 16 controls; exploratory gait features only | Open Data Commons Attribution 1.0; public download and attribution required. | 3 — downloaded/inspected |
| Seattle ALS Patient Profile Database | [Mendeley Data v3](https://doi.org/10.17632/stcztggnnp.3) | Longitudinal tabular/data-dictionary archive; 143 people with ALS, 123 partners, 3-month visits up to 18 months; exact archive size not verified | Severity, FVC, devices, psychosocial health, support, outcomes; accessibility/caregiver research | CC BY-NC 3.0: attribution and noncommercial use only. | 4 |
| bigP3BCI | [PhysioNet / DOI](https://doi.org/10.13026/0byy-ry86); [AWS registry](https://registry.opendata.aws/bigp3bci/) | EDF+ EEG, events, outcomes, optional demographics/ALSFRS-R/eye tracking; exact total size not verified | P300 speller and assistive-communication research | CC BY 4.0; public S3 bucket. Large EEG archive intentionally not downloaded. | 6 |
| EEGET-ALS | [Figshare collection](https://doi.org/10.6084/m9.figshare.c.6910027.v1); [descriptor](https://doi.org/10.1038/s41597-024-03501-y) | EEG + eye tracking; 9 scenarios; 6 people with ALS and 170 controls; exact archive size not verified | Eye-gaze spelling and assistive-input research, not ALS screening | Public Figshare content; the article is CC BY 4.0. The item-specific Figshare license must be rechecked before reuse. Large files intentionally not downloaded. | 7 |

## Compatibility warning

These sources differ in population, consent, collection method, units, time structure, and intended use. They must not be row-concatenated. Any future linkage is conceptual/feature-level and requires explicit harmonization, license compatibility, and independent evaluation.

## Local acquisition record

- `data/raw/casidata/ALS.txt`: downloaded from the source URL documented by CASIdata; 4,364,206 bytes.
- `data/raw/casidata/CASIdata_0.2.1.tar.gz`: CRAN source package preserving documentation and packaged `als.RData`.
- `data/raw/gaitndd/gaitndd-1.0.0.zip`: official PhysioNet S3 archive; extracted alongside the untouched ZIP.
- ALS Focus and VOC-ALS: not downloaded because user acceptance/account steps are required.

