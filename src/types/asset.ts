export interface AssetPillars {
  identity: string;
  exchange?: string;
  currency?: string;
}

export interface ClarificationOption {
  label: string;
  value: {
    exchange: string;
    currency: string;
    ticker?: string;
  };
  description: string;
  promptSuffix?: string;
}

export interface AssetRegistryItem {
  keywords: string[];
  defaultIdentity: string;
  options: ClarificationOption[];
  bypassKeywords?: string[]; // keywords that satisfy exchange/currency disambiguation
}

export interface ClarificationPayload {
  detected_identity: string;
  prompt_text: string;
  suggested_options: Array<{
    label: string;
    exchange: string;
    currency: string;
    ticker?: string;
    description?: string;
  }>;
}

export type AssetAmbiguityResult =
  | {
      status: 'CLEAR_TO_PROCEED';
      pillars?: AssetPillars;
      resolvedTicker?: string;
    }
  | {
      status: 'NEED_CLARIFICATION';
      reason: string;
      payload: ClarificationPayload;
    };
