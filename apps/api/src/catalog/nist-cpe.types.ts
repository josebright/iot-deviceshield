export interface NvdCpeMatch {
  cpe: {
    cpeName: string;
    cpeNameId: string;
    deprecated?: boolean;
    lastModified?: string;
    titles?: Array<{ title: string; lang: string }>;
  };
}

export interface NvdCpeResponse {
  totalResults: number;
  products: NvdCpeMatch[];
}
