import crypto from 'crypto';
import { db } from './db.ts';

export interface ProviderValidationResult {
  valid: boolean;
  error?: string;
  trackingToken?: string;
  userId?: number;
  offerId?: number;
  conversionId?: string;
  payoutUsd?: number;
}

export interface ICpaProvider {
  name: string;
  generateTrackingUrl(offerId: number, trackingToken: string, userId: number): string;
  verifyPostback(query: Record<string, any>, headers: Record<string, any>, ip: string): ProviderValidationResult;
}

/**
 * CPAGrip Official Network Adapter
 * Documentation & Parameter mapping:
 * - {subid} = our unique tracking session token
 * - {subid2} = user ID
 * - {offer_id} = network offer id
 * - {payout} = affiliate payout in USD
 * - {ip} = user conversion IP
 * - {key} / {sig} = postback verification secret / signature
 */
export class CPAGripProvider implements ICpaProvider {
  name = 'cpagrip';

  private cleanToDirectUrl(rawInput: string, pubId: string): string {
    if (!rawInput) return '';
    let cleaned = rawInput.trim();

    // If HTML script tag e.g. <script src="...script_include.php?id=1916788"></script>
    const scriptMatch = cleaned.match(/src=["']([^"']+)["']/i);
    if (scriptMatch && scriptMatch[1]) {
      cleaned = scriptMatch[1];
    }

    // If script_include.php?id=123456 -> convert to show.php?l=0&u=PUB&id=123456
    const idMatch = cleaned.match(/[?&]id=(\d+)/i);
    if (cleaned.includes('script_include.php') && idMatch && idMatch[1]) {
      return `https://playabledownloads.com/show.php?l=0&u=${pubId}&id=${idMatch[1]}`;
    }

    // If it's a URL, return it stripped of HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '').trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }

    // If just a numeric ID e.g. 1916896
    if (/^\d+$/.test(cleaned)) {
      return `https://playabledownloads.com/show.php?l=0&u=${pubId}&id=${cleaned}`;
    }

    return cleaned;
  }

  generateTrackingUrl(offerId: number, trackingToken: string, userId: number): string {
    const provSettings = db.getProviderSettings().find((p) => p.provider_name === 'cpagrip');
    const pubId = provSettings?.publisher_id || process.env.CPAGRIP_PUBLISHER_ID || '2559473';
    const offer = db.getOfferById(offerId);

    let targetBaseUrl = '';

    // 1. Check if offer has its own custom tracking template
    if (offer?.tracking_url_template) {
      targetBaseUrl = this.cleanToDirectUrl(offer.tracking_url_template, pubId);
    }

    // 2. If not, map to Denish's 3 campaign slots:
    if (!targetBaseUrl) {
      if (offer?.category === 'VIDEO_AD') {
        // Alternating / Slot 1 or Slot 2
        if (offer.id % 2 === 0 && provSettings?.video_slot_2_url) {
          targetBaseUrl = this.cleanToDirectUrl(provSettings.video_slot_2_url, pubId);
        } else if (provSettings?.video_slot_1_url) {
          targetBaseUrl = this.cleanToDirectUrl(provSettings.video_slot_1_url, pubId);
        }
      } else {
        // High-payout offer slot 3 for Surveys, Installs, Signups, Quizzes
        if (provSettings?.offer_slot_3_url) {
          targetBaseUrl = this.cleanToDirectUrl(provSettings.offer_slot_3_url, pubId);
        }
      }
    }

    // 3. Fallback to video locker URL
    if (!targetBaseUrl) {
      targetBaseUrl = this.cleanToDirectUrl(
        provSettings?.video_locker_url || 'https://araplhn.org/4/60d87c455c0d9ddec214637ae5cbfaed',
        pubId
      );
    }

    // Replace placeholder tokens if present
    let finalUrl = targetBaseUrl
      .replace(/\{trackingToken\}/g, trackingToken)
      .replace(/\{userId\}/g, String(userId))
      .replace(/\{subid\}/g, trackingToken)
      .replace(/\{subid2\}/g, String(userId));

    // If subid not yet in URL, append query parameters cleanly
    if (!finalUrl.includes('subid=') && !finalUrl.includes('tracking_id=')) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${sep}tracking_id=${userId}&subid=${trackingToken}`;
    }

    return finalUrl;
  }

  verifyPostback(query: Record<string, any>, _headers: Record<string, any>, _ip: string): ProviderValidationResult {
    const provSettings = db.getProviderSettings().find((p) => p.provider_name === 'cpagrip');
    const secret = provSettings?.postback_secret || process.env.CPAGRIP_POSTBACK_SECRET || 'secret_postback_hash_key';

    // Required fields from CPAGrip postback:
    // Parameters standard in CPAGrip Postback URL:
    // e.g.: ?subid={subid}&subid2={subid2}&offer_id={offer_id}&payout={payout}&key={key}&id={id}
    const trackingToken = query.subid || query.tracking_token;
    const userId = Number(query.subid2 || query.user_id);
    const offerId = Number(query.offer_id);
    const payoutUsd = parseFloat(query.payout || query.amount || '0.25');
    const conversionId = query.id || query.conversion_id || query.lead_id || `cg_${crypto.randomBytes(8).toString('hex')}`;
    const receivedKey = query.key || query.secret || query.signature;

    if (!trackingToken) {
      return { valid: false, error: 'Missing subid / tracking token' };
    }

    // Secret validation check
    const isDemoMode = process.env.DEMO_MODE === 'true';
    if (!isDemoMode && secret && secret !== 'demo_secret') {
      if (receivedKey !== secret) {
        return { valid: false, error: 'Unauthorized postback signature/key' };
      }
    }

    return {
      valid: true,
      trackingToken,
      userId,
      offerId,
      conversionId,
      payoutUsd: isNaN(payoutUsd) ? 0.25 : payoutUsd,
    };
  }
}

// Provider Registry for modularity
class CpaProviderRegistry {
  private providers: Map<string, ICpaProvider> = new Map();

  constructor() {
    this.register(new CPAGripProvider());
  }

  register(provider: ICpaProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): ICpaProvider {
    return this.providers.get(name.toLowerCase()) || this.providers.get('cpagrip')!;
  }
}

export const cpaRegistry = new CpaProviderRegistry();
