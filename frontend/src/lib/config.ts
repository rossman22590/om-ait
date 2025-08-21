// Environment mode types
export enum EnvMode {
  LOCAL = 'local',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Subscription tier structure
export interface SubscriptionTierData {
  priceId: string;
  name: string;
}

// Subscription tiers structure
export interface SubscriptionTiers {
  FREE: SubscriptionTierData;
  TIER_2_20: SubscriptionTierData;
  TIER_6_50: SubscriptionTierData;
  TIER_12_100: SubscriptionTierData;
  TIER_25_200: SubscriptionTierData;
  TIER_50_400: SubscriptionTierData;
  TIER_125_800: SubscriptionTierData;
  TIER_200_1000: SubscriptionTierData;
}

// Configuration object
interface Config {
  ENV_MODE: EnvMode;
  IS_LOCAL: boolean;
  IS_STAGING: boolean;
  SUBSCRIPTION_TIERS: SubscriptionTiers;
}

// Production tier IDs
const PROD_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'price_1RLwBMG23sSyONuFrhkNh9fe',
    name: 'Free',
  },
  TIER_2_20: {
    priceId: 'price_1RLy9QG23sSyONuFzh2zB9Cj',
    name: '2h/$20',
  },
  TIER_6_50: {
    priceId: 'price_1RLyBWG23sSyONuFwZNIjbgJ',
    name: '9h/$50',
  },
  TIER_12_100: {
    priceId: 'price_1RLyE5G23sSyONuFHJiqvoLo',
    name: '12h/$100',
  },
  TIER_25_200: {
    priceId: 'price_1RLwBgG23sSyONuFCzzo83e6',
    name: '25h/$200',
  },
  TIER_50_400: {
    priceId: 'price_1RLyEhG23sSyONuFioU064nT',
    name: '50h/$400',
  },
  TIER_125_800: {
    priceId: 'price_1RLyEnG23sSyONuFE9wBSfvN',
    name: '125h/$800',
  },
  TIER_200_1000: {
    priceId: 'price_1RLyErG23sSyONuFjGphWKjB',
    name: '200h/$1000',
  },
} as const;

// Staging tier IDs
const STAGING_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'price_1RLwBMG23sSyONuFrhkNh9fe',
    name: 'Free',
  },
  TIER_2_20: {
    priceId: 'price_1RLy9QG23sSyONuFzh2zB9Cj',
    name: '2h/$20',
  },
  TIER_6_50: {
    priceId: 'price_1RLyBWG23sSyONuFwZNIjbgJ',
    name: '9h/$50',
  },
  TIER_12_100: {
    priceId: 'price_1RLyE5G23sSyONuFHJiqvoLo',
    name: '12h/$100',
  },
  TIER_25_200: {
    priceId: 'price_1RLwBgG23sSyONuFCzzo83e6',
    name: '25h/$200',
  },
  TIER_50_400: {
    priceId: 'price_1RLyEhG23sSyONuFioU064nT',
    name: '50h/$400',
  },
  TIER_125_800: {
    priceId: 'price_1RLyEnG23sSyONuFE9wBSfvN',
    name: '125h/$800',
  },
  TIER_200_1000: {
    priceId: 'price_1RLyErG23sSyONuFjGphWKjB',
    name: '200h/$1000',
  },
} as const;

function getEnvironmentMode(): EnvMode {
  const envMode = process.env.NEXT_PUBLIC_ENV_MODE;
  
  // If environment variable is not set, fall back to NODE_ENV
  if (!envMode) {
    if (process.env.NODE_ENV === 'development') {
      return EnvMode.LOCAL;
    } else if (process.env.NODE_ENV === 'production') {
      return EnvMode.PRODUCTION;
    } else {
      // Default fallback
      return EnvMode.LOCAL;
    }
  }
  
  const upperEnvMode = envMode.toUpperCase();
  switch (upperEnvMode) {
    case 'LOCAL':
      return EnvMode.LOCAL;
    case 'STAGING':
      return EnvMode.STAGING;
    case 'PRODUCTION':
      return EnvMode.PRODUCTION;
    default:
      // Fallback based on NODE_ENV if invalid value
      if (process.env.NODE_ENV === 'development') {
        return EnvMode.LOCAL;
      } else {
        return EnvMode.PRODUCTION;
      }
  }
}

const currentEnvMode = getEnvironmentMode();

export const config: Config = {
  ENV_MODE: currentEnvMode,
  IS_LOCAL: currentEnvMode === EnvMode.LOCAL,
  IS_STAGING: currentEnvMode === EnvMode.STAGING,
  SUBSCRIPTION_TIERS:
    currentEnvMode === EnvMode.STAGING ? STAGING_TIERS : PROD_TIERS,
};

export const isLocalMode = (): boolean => {
  return config.IS_LOCAL;
};

export const isStagingMode = (): boolean => {
  return config.IS_STAGING;
};


// Plan type identification functions
export const isMonthlyPlan = (priceId: string): boolean => {
  const allTiers = config.SUBSCRIPTION_TIERS;
  const monthlyTiers = [
    allTiers.TIER_2_20, allTiers.TIER_6_50, allTiers.TIER_12_100,
    allTiers.TIER_25_200, allTiers.TIER_50_400, allTiers.TIER_125_800,
    allTiers.TIER_200_1000
  ];
  return monthlyTiers.some(tier => tier.priceId === priceId);
};

// Tier level mappings for all plan types
const PLAN_TIERS = {
  // Monthly plans
  [PROD_TIERS.TIER_2_20.priceId]: { tier: 1, type: 'monthly', name: '2h/$20' },
  [PROD_TIERS.TIER_6_50.priceId]: { tier: 2, type: 'monthly', name: '6h/$50' },
  [PROD_TIERS.TIER_12_100.priceId]: { tier: 3, type: 'monthly', name: '12h/$100' },
  [PROD_TIERS.TIER_25_200.priceId]: { tier: 4, type: 'monthly', name: '25h/$200' },
  [PROD_TIERS.TIER_50_400.priceId]: { tier: 5, type: 'monthly', name: '50h/$400' },
  [PROD_TIERS.TIER_125_800.priceId]: { tier: 6, type: 'monthly', name: '125h/$800' },
  [PROD_TIERS.TIER_200_1000.priceId]: { tier: 7, type: 'monthly', name: '200h/$1000' },

  // Staging plans
  [STAGING_TIERS.TIER_2_20.priceId]: { tier: 1, type: 'monthly', name: '2h/$20' },
  [STAGING_TIERS.TIER_6_50.priceId]: { tier: 2, type: 'monthly', name: '6h/$50' },
  [STAGING_TIERS.TIER_12_100.priceId]: { tier: 3, type: 'monthly', name: '12h/$100' },
  [STAGING_TIERS.TIER_25_200.priceId]: { tier: 4, type: 'monthly', name: '25h/$200' },
  [STAGING_TIERS.TIER_50_400.priceId]: { tier: 5, type: 'monthly', name: '50h/$400' },
  [STAGING_TIERS.TIER_125_800.priceId]: { tier: 6, type: 'monthly', name: '125h/$800' },
  [STAGING_TIERS.TIER_200_1000.priceId]: { tier: 7, type: 'monthly', name: '200h/$1000' },
 
} as const;

export const getPlanInfo = (priceId: string) => {
  return PLAN_TIERS[priceId as keyof typeof PLAN_TIERS] || { tier: 0, type: 'unknown', name: 'Unknown' };
};

// Plan change validation function
export const isPlanChangeAllowed = (currentPriceId: string, newPriceId: string): { allowed: boolean; reason?: string } => {
  const currentPlan = getPlanInfo(currentPriceId);
  const newPlan = getPlanInfo(newPriceId);

  // Allow if same plan
  if (currentPriceId === newPriceId) {
    return { allowed: true };
  }

  // Restriction: Don't allow downgrade from monthly to lower monthly
  if (currentPlan.type === 'monthly' && newPlan.type === 'monthly' && newPlan.tier < currentPlan.tier) {
    return { 
      allowed: false, 
      reason: 'Downgrading to a lower monthly plan is not allowed. You can only upgrade to a higher tier.' 
    };
  }

  // Allow all other changes (upgrades)
  return { allowed: true };
};

// Export subscription tier type for typing elsewhere
export type SubscriptionTier = keyof typeof PROD_TIERS;
