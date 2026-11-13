import { BaseRepository } from './BaseRepository';
import { Wallet } from '../domain/Wallet';
import { IDatabase } from '../db/database';

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

/** OOP: Inheritance, Encapsulation
 *  WHY: Specializes BaseRepository for user wallets, persisting financial ledgers and rehydrating encapsulated Wallet domain entities. */
export class WalletRepository extends BaseRepository<Wallet> {
  constructor(db?: IDatabase) {
    super(db);
  }

  public findById(id: string): Wallet | null {
    const row = this._db
      .prepare('SELECT * FROM wallets WHERE id = ?')
      .get(id) as WalletRow | undefined;

    return row ? this.rehydrateWallet(row) : null;
  }

  public findByUserId(userId: string): Wallet | null {
    const row = this._db
      .prepare('SELECT * FROM wallets WHERE user_id = ?')
      .get(userId) as WalletRow | undefined;

    return row ? this.rehydrateWallet(row) : null;
  }

  public findAll(): Wallet[] {
    const rows = this._db.prepare('SELECT * FROM wallets').all() as WalletRow[];
    return rows.map((r) => this.rehydrateWallet(r));
  }

  public save(wallet: Wallet): void {
    // 1. Upsert wallet balance
    const upsertStmt = this._db.prepare(`
      INSERT INTO wallets (id, user_id, balance, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        balance = excluded.balance,
        updated_at = datetime('now')
    `);
    upsertStmt.run(wallet.getId(), wallet.getUserId(), wallet.getBalance());

    // 2. Persist new transactions
    const txStmt = this._db.prepare(`
      INSERT OR IGNORE INTO wallet_transactions (id, wallet_id, amount, type, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const tx of wallet.getTransactions()) {
      txStmt.run(
        tx.id,
        tx.walletId,
        tx.amount,
        tx.type,
        tx.description,
        tx.createdAt.toISOString()
      );
    }
  }

  public delete(id: string): void {
    this._db.prepare('DELETE FROM wallets WHERE id = ?').run(id);
  }

  /**
   * Rehydrates an encapsulated Wallet domain entity from database rows
   */
  private rehydrateWallet(row: WalletRow): Wallet {
    try {
      const txRows = this._db
        .prepare(
          'SELECT id, wallet_id, amount, type, description, created_at FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC'
        )
        .all(row.id) as Array<{
          id: string;
          wallet_id: string;
          amount: number;
          type: 'CREDIT' | 'DEBIT';
          description: string;
          created_at: string;
        }>;

      const txs = txRows.map((t) => ({
        id: t.id,
        walletId: t.wallet_id,
        amount: t.amount,
        type: t.type,
        description: t.description || 'Wallet transaction',
        createdAt: new Date(t.created_at)
      }));

      return new Wallet(row.id, row.user_id, row.balance, txs.length > 0 ? txs : undefined);
    } catch {
      return new Wallet(row.id, row.user_id, row.balance);
    }
  }
}
