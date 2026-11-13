import { BaseSqliteRepository } from './BaseSqliteRepository';
import { PromoCode } from '../domain/promo/PromoCode';
import { IDatabase } from '../db/database';

interface PromoDbRow {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  max_discount: number | null;
  min_fare: number;
  is_active: number;
  usage_count: number;
  max_usage: number;
  expires_at: string | null;
  created_at: string;
}

/** OOP: Inheritance
 *  WHY: Specializes BaseSqliteRepository for promotional coupon codes. */
export class PromoCodeRepository extends BaseSqliteRepository<PromoCode> {
  constructor(db?: IDatabase) {
    super('promo_codes', db);
  }

  public findByCode(code: string): PromoCode | null {
    const row = this._db
      .prepare('SELECT * FROM promo_codes WHERE code = ?')
      .get(code.trim().toUpperCase()) as PromoDbRow | undefined;

    return row ? this.mapRowToEntity(row) : null;
  }

  protected mapEntityToRow(promo: PromoCode): Record<string, unknown> {
    return {
      id: promo.getId(),
      code: promo.getCode(),
      discount_type: 'PERCENTAGE',
      discount_value: promo.getDiscountPercentage(),
      max_discount: promo.getMaxDiscount(),
      min_fare: promo.getMinFare(),
      is_active: promo.isActive() ? 1 : 0,
      usage_count: promo.getUsageCount(),
      max_usage: promo.getMaxUsage(),
      expires_at: promo.getExpiresAt().toISOString()
    };
  }

  protected mapRowToEntity(row: unknown): PromoCode {
    const r = row as PromoDbRow;
    return new PromoCode(
      r.id,
      r.code,
      r.discount_value,
      r.max_discount || 100.0,
      r.min_fare || 0.0,
      r.expires_at ? new Date(r.expires_at) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
      r.max_usage || 100,
      r.usage_count || 0,
      r.is_active === 1
    );
  }
}

