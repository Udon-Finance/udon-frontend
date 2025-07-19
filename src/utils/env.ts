/**
 * Environment utility for safely accessing environment variables
 */

export type Environment = 'development' | 'production';
export type Network = 'local' | 'testnet' | 'mainnet';

// Safely access environment variables with defaults
export const getEnv = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined') {
    // Client-side: only access NEXT_PUBLIC_ variables
    if (!key.startsWith('NEXT_PUBLIC_')) {
      console.warn(`Trying to access non-public env var '${key}' on the client side`);
      return defaultValue;
    }
  }

  // Access process.env directly with the specific key
  switch (key) {
    case 'NEXT_PUBLIC_NODE_URL_POOL':
      return process.env.NEXT_PUBLIC_NODE_URL_POOL || defaultValue;
    case 'NEXT_PUBLIC_BRID':
      return process.env.NEXT_PUBLIC_BRID || defaultValue;
    case 'NEXT_PUBLIC_APP_NAME':
      return process.env.NEXT_PUBLIC_APP_NAME || defaultValue;
    case 'NEXT_PUBLIC_SITE_URL':
      return process.env.NEXT_PUBLIC_SITE_URL || defaultValue;
    case 'NEXT_PUBLIC_GA_TRACKING_ID':
      return process.env.NEXT_PUBLIC_GA_TRACKING_ID || defaultValue;
    case 'NEXT_PUBLIC_REPORT_BUG_FORM_URL':
      return process.env.NEXT_PUBLIC_REPORT_BUG_FORM_URL || defaultValue;
    case 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID':
      return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || defaultValue;
    default:
      return defaultValue;
  }
};

// Detect network from node URL
const detectNetwork = (nodeUrl: string): Network => {
  if (nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1')) {
    return 'local';
  }
  if (nodeUrl.includes('testnet')) {
    return 'testnet';
  }
  if (nodeUrl.includes('mainnet')) {
    return 'mainnet';
  }
  return 'local'; // default to local if can't detect
};

// Convert comma-separated string to array of URLs or single URL string
export const getNodeUrlPool = (): string | string[] => {
  const defaultNodes = [
    'https://node0.testnet.chromia.com:7740',
    'https://node1.testnet.chromia.com:7740',
    'https://node2.testnet.chromia.com:7740',
    'https://node3.testnet.chromia.com:7740',
  ].join(',');

  const nodeUrls = getEnv('NEXT_PUBLIC_NODE_URL_POOL', defaultNodes);
  const nodes = nodeUrls
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  return nodes.length === 1 ? nodes[0] : nodes;
};

// Get network from node URL pool
export const getNetwork = (): Network => {
  const nodePool = getNodeUrlPool();
  const firstNode = Array.isArray(nodePool) ? nodePool[0] : nodePool;
  return detectNetwork(firstNode);
};

// Network specific checks
export const isLocal = getNetwork() === 'local';
export const isTestnet = getNetwork() === 'testnet';
export const isMainnet = getNetwork() === 'mainnet';

// App configuration
export const APP_NAME = getEnv('NEXT_PUBLIC_APP_NAME', 'Udon Finance');
export const SITE_URL = getEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
export const GA_TRACKING_ID = getEnv('NEXT_PUBLIC_GA_TRACKING_ID', '');
export const BRID = getEnv('NEXT_PUBLIC_BRID', '');
export const REPORT_BUG_FORM_URL = getEnv('NEXT_PUBLIC_REPORT_BUG_FORM_URL', '');
export const WALLETCONNECT_PROJECT_ID = getEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', '');
export const DOCS = getEnv('NEXT_PUBLIC_DOCS', '');

// Export all environment variables in a single object
export const env = {
  nodeUrlPool: getNodeUrlPool(),
  network: getNetwork(),
  isLocal,
  isTestnet,
  isMainnet,
  appName: APP_NAME,
  siteUrl: SITE_URL,
  gaTrackingId: GA_TRACKING_ID,
  brid: BRID,
  reportBugFormUrl: REPORT_BUG_FORM_URL,
  walletconnectProjectId: WALLETCONNECT_PROJECT_ID,
  docs: DOCS,
} as const;
