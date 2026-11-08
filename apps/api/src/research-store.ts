import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export type Categories = { questions: boolean; movement: boolean; voice: boolean };
export type StorageKind = 'memory' | 'file' | 'tiger-data';

export type ConsentRecord = {
  id: string;
  userRef: string;
  status: 'granted' | 'withdrawn';
  categories: Categories;
  createdAt: string;
};

export type Contribution = {
  id: string;
  userRef: string;
  categories: Categories;
  consentStatus: 'granted';
  consentAt: string;
  reviewStatus: 'submitted' | 'approved';
  synthetic: true;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type Reward = {
  id: string;
  contributionId: string;
  userRef: string;
  recipientAddress: string | null;
  amountLamports: number;
  network: 'devnet';
  txSignature: string | null;
  signedTransaction: string | null;
  txStatus: 'submitted' | 'confirmed' | 'failed';
  blockhash: string | null;
  lastValidBlockHeight: number | null;
  error: string | null;
  createdAt: string;
  confirmedAt: string | null;
  updatedAt: string;
};

export interface ResearchRepository {
  readonly storage: StorageKind;
  addConsent(row: ConsentRecord): Promise<void>;
  latestConsent(userRef: string): Promise<ConsentRecord | null>;
  insertContribution(row: Contribution): Promise<void>;
  contributionsForUser(userRef: string): Promise<Contribution[]>;
  getContribution(id: string): Promise<Contribution | null>;
  saveContribution(row: Contribution): Promise<void>;
  getReward(contributionId: string): Promise<Reward | null>;
  insertReward(row: Reward): Promise<'inserted' | 'exists'>;
  saveReward(row: Reward): Promise<void>;
}

type FileShape = { consents: ConsentRecord[]; contributions: Contribution[]; rewards: Reward[] };

const emptyDb = (): FileShape => ({ consents: [], contributions: [], rewards: [] });

export class MemoryResearchRepository implements ResearchRepository {
  readonly storage = 'memory' as const;
  private db: FileShape = emptyDb();

  async addConsent(row: ConsentRecord) { this.db.consents.push(row); }
  async latestConsent(userRef: string) {
    return [...this.db.consents].reverse().find((row) => row.userRef === userRef) ?? null;
  }
  async insertContribution(row: Contribution) { this.db.contributions.push(row); }
  async contributionsForUser(userRef: string) {
    return this.db.contributions.filter((row) => row.userRef === userRef).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getContribution(id: string) { return this.db.contributions.find((row) => row.id === id) ?? null; }
  async saveContribution(row: Contribution) {
    const index = this.db.contributions.findIndex((item) => item.id === row.id);
    if (index >= 0) this.db.contributions[index] = row;
  }
  async getReward(contributionId: string) { return this.db.rewards.find((row) => row.contributionId === contributionId) ?? null; }
  async insertReward(row: Reward) {
    if (this.db.rewards.some((item) => item.contributionId === row.contributionId)) return 'exists';
    this.db.rewards.push(row);
    return 'inserted';
  }
  async saveReward(row: Reward) {
    const index = this.db.rewards.findIndex((item) => item.contributionId === row.contributionId);
    if (index >= 0) this.db.rewards[index] = row;
    else this.db.rewards.push(row);
  }
}

export class FileResearchRepository implements ResearchRepository {
  readonly storage = 'file' as const;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async withDb<T>(mutate: boolean, fn: (db: FileShape) => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      if (mutate) await this.write(db);
      return result;
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }

  private async read(): Promise<FileShape> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as FileShape;
      return {
        consents: parsed.consents ?? [],
        contributions: parsed.contributions ?? [],
        rewards: parsed.rewards ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyDb();
      throw error;
    }
  }

  private async write(db: FileShape) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(db, null, 2));
    await rename(temporary, this.filePath);
  }

  addConsent(row: ConsentRecord) { return this.withDb(true, (db) => { db.consents.push(row); }); }
  latestConsent(userRef: string) { return this.withDb(false, (db) => [...db.consents].reverse().find((row) => row.userRef === userRef) ?? null); }
  insertContribution(row: Contribution) { return this.withDb(true, (db) => { db.contributions.push(row); }); }
  contributionsForUser(userRef: string) {
    return this.withDb(false, (db) => db.contributions.filter((row) => row.userRef === userRef).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  getContribution(id: string) { return this.withDb(false, (db) => db.contributions.find((row) => row.id === id) ?? null); }
  saveContribution(row: Contribution) {
    return this.withDb(true, (db) => {
      const index = db.contributions.findIndex((item) => item.id === row.id);
      if (index >= 0) db.contributions[index] = row;
    });
  }
  getReward(contributionId: string) { return this.withDb(false, (db) => db.rewards.find((row) => row.contributionId === contributionId) ?? null); }
  insertReward(row: Reward) {
    return this.withDb(true, (db) => {
      if (db.rewards.some((item) => item.contributionId === row.contributionId)) return 'exists' as const;
      db.rewards.push(row);
      return 'inserted' as const;
    });
  }
  saveReward(row: Reward) {
    return this.withDb(true, (db) => {
      const index = db.rewards.findIndex((item) => item.contributionId === row.contributionId);
      if (index >= 0) db.rewards[index] = row;
      else db.rewards.push(row);
    });
  }
}

const schema = `
CREATE TABLE IF NOT EXISTS alsense_research_consent (
  id text PRIMARY KEY,
  user_ref text NOT NULL,
  status text NOT NULL,
  categories jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS alsense_research_consent_user_idx ON alsense_research_consent (user_ref, created_at DESC);
CREATE TABLE IF NOT EXISTS alsense_research_contributions (
  id text PRIMARY KEY,
  user_ref text NOT NULL,
  categories jsonb NOT NULL,
  consent_status text NOT NULL,
  consent_at timestamptz NOT NULL,
  review_status text NOT NULL,
  synthetic boolean NOT NULL,
  created_at timestamptz NOT NULL,
  reviewed_at timestamptz,
  review_note text
);
CREATE INDEX IF NOT EXISTS alsense_research_contrib_user_idx ON alsense_research_contributions (user_ref, created_at DESC);
CREATE TABLE IF NOT EXISTS alsense_research_rewards (
  contribution_id text PRIMARY KEY,
  id text NOT NULL UNIQUE,
  user_ref text NOT NULL,
  recipient_address text,
  amount_lamports bigint NOT NULL,
  network text NOT NULL,
  tx_signature text,
  signed_tx text,
  tx_status text NOT NULL,
  blockhash text,
  last_valid_block_height bigint,
  error text,
  created_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL
);`;

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export class PgResearchRepository implements ResearchRepository {
  readonly storage = 'tiger-data' as const;
  private readonly pool: pg.Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    const connection = connectionString.replace(/([?&])sslmode=[^&]*/g, '').replace(/[?&]$/, '');
    this.pool = new pg.Pool({ connectionString: connection, ssl: local ? undefined : { rejectUnauthorized: false } });
  }

  private async ensure() {
    this.ready ??= this.pool.query(schema).then(() => undefined);
    return this.ready;
  }

  async addConsent(row: ConsentRecord) {
    await this.ensure();
    await this.pool.query(
      'INSERT INTO alsense_research_consent (id, user_ref, status, categories, created_at) VALUES ($1,$2,$3,$4,$5)',
      [row.id, row.userRef, row.status, JSON.stringify(row.categories), row.createdAt],
    );
  }

  async latestConsent(userRef: string) {
    await this.ensure();
    const result = await this.pool.query('SELECT * FROM alsense_research_consent WHERE user_ref=$1 ORDER BY created_at DESC LIMIT 1', [userRef]);
    const row = result.rows[0];
    if (!row) return null;
    return { id: row.id, userRef: row.user_ref, status: row.status, categories: row.categories, createdAt: iso(row.created_at)! };
  }

  async insertContribution(row: Contribution) {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO alsense_research_contributions
        (id, user_ref, categories, consent_status, consent_at, review_status, synthetic, created_at, reviewed_at, review_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.id, row.userRef, JSON.stringify(row.categories), row.consentStatus, row.consentAt, row.reviewStatus, row.synthetic, row.createdAt, row.reviewedAt, row.reviewNote],
    );
  }

  async contributionsForUser(userRef: string) {
    await this.ensure();
    const result = await this.pool.query('SELECT * FROM alsense_research_contributions WHERE user_ref=$1 ORDER BY created_at DESC', [userRef]);
    return result.rows.map(mapContribution);
  }

  async getContribution(id: string) {
    await this.ensure();
    const result = await this.pool.query('SELECT * FROM alsense_research_contributions WHERE id=$1', [id]);
    return result.rows[0] ? mapContribution(result.rows[0]) : null;
  }

  async saveContribution(row: Contribution) {
    await this.ensure();
    await this.pool.query(
      `UPDATE alsense_research_contributions
       SET review_status=$2, reviewed_at=$3, review_note=$4
       WHERE id=$1`,
      [row.id, row.reviewStatus, row.reviewedAt, row.reviewNote],
    );
  }

  async getReward(contributionId: string) {
    await this.ensure();
    const result = await this.pool.query('SELECT * FROM alsense_research_rewards WHERE contribution_id=$1', [contributionId]);
    return result.rows[0] ? mapReward(result.rows[0]) : null;
  }

  async insertReward(row: Reward) {
    await this.ensure();
    const result = await this.pool.query(
      `INSERT INTO alsense_research_rewards
        (contribution_id, id, user_ref, recipient_address, amount_lamports, network, tx_signature, signed_tx, tx_status, blockhash, last_valid_block_height, error, created_at, confirmed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (contribution_id) DO NOTHING`,
      rewardValues(row),
    );
    return result.rowCount ? 'inserted' : 'exists';
  }

  async saveReward(row: Reward) {
    await this.ensure();
    await this.pool.query(
      `UPDATE alsense_research_rewards SET
        recipient_address=$4, amount_lamports=$5, network=$6, tx_signature=$7, signed_tx=$8, tx_status=$9,
        blockhash=$10, last_valid_block_height=$11, error=$12, confirmed_at=$14, updated_at=$15
       WHERE contribution_id=$1`,
      rewardValues(row),
    );
  }
}

function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: String(row.id),
    userRef: String(row.user_ref),
    categories: row.categories as Categories,
    consentStatus: 'granted',
    consentAt: iso(row.consent_at as string)!,
    reviewStatus: row.review_status as Contribution['reviewStatus'],
    synthetic: true,
    createdAt: iso(row.created_at as string)!,
    reviewedAt: iso(row.reviewed_at as string | null),
    reviewNote: row.review_note ? String(row.review_note) : null,
  };
}

function mapReward(row: Record<string, unknown>): Reward {
  return {
    id: String(row.id),
    contributionId: String(row.contribution_id),
    userRef: String(row.user_ref),
    recipientAddress: row.recipient_address ? String(row.recipient_address) : null,
    amountLamports: Number(row.amount_lamports),
    network: 'devnet',
    txSignature: row.tx_signature ? String(row.tx_signature) : null,
    signedTransaction: row.signed_tx ? String(row.signed_tx) : null,
    txStatus: row.tx_status as Reward['txStatus'],
    blockhash: row.blockhash ? String(row.blockhash) : null,
    lastValidBlockHeight: row.last_valid_block_height == null ? null : Number(row.last_valid_block_height),
    error: row.error ? String(row.error) : null,
    createdAt: iso(row.created_at as string)!,
    confirmedAt: iso(row.confirmed_at as string | null),
    updatedAt: iso(row.updated_at as string)!,
  };
}

function rewardValues(row: Reward) {
  return [
    row.contributionId, row.id, row.userRef, row.recipientAddress, row.amountLamports, row.network,
    row.txSignature, row.signedTransaction, row.txStatus, row.blockhash, row.lastValidBlockHeight,
    row.error, row.createdAt, row.confirmedAt, row.updatedAt,
  ];
}

export function defaultStorePath() {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  return path.join(root, 'data', 'runtime', 'research-rewards.json');
}

export function createRepository(env: NodeJS.ProcessEnv = process.env): ResearchRepository {
  const databaseUrl = env.TIGERDATA_DATABASE_URL?.trim();
  if (databaseUrl) return new PgResearchRepository(databaseUrl);
  return new FileResearchRepository(env.RESEARCH_STORE_PATH?.trim() || defaultStorePath());
}
