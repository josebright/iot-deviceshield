export interface FetchVulnerabilitiesQuery {
  keywordSearch: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface CatalogStatus {
  lastRefreshAt: string | null;
  sourceVersion: string | null;
  errorCount: number;
  lastError: string | null;
  categoriesCount: number;
  devicesCount: number;
  cpeResolvedCount: number;
  cpeUnresolvedCount: number;
}

export type ClientStatus = 'active' | 'throttled' | 'blacklisted';

export interface ClientRecord {
  id: string;
  clientIdHeader: string | null;
  ipLast: string | null;
  userAgentLast: string | null;
  acceptLanguage: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  requestCount: number;
  status: ClientStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
}

export interface BlacklistClientBody {
  reason: string;
}
