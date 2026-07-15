export interface CreateCategoryDto {
  name: string;
}

export interface CreateDeviceDto {
  name: string;
  categoryId: number;
}

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
