export interface NvdCvssV3Data {
  version: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  baseScore?: number;
  baseSeverity?: string;
}

export interface NvdCvssV2Data {
  version: string;
  accessVector?: string;
  accessComplexity?: string;
  authentication?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  baseScore?: number;
}

export interface NvdCvssMetric {
  cvssData: NvdCvssV3Data | NvdCvssV2Data;
  exploitabilityScore?: number;
  impactScore?: number;
  baseSeverity?: string;
  userInteractionRequired?: boolean;
}

export interface NvdReference {
  url: string;
  source?: string;
  tags?: string[];
}

export interface NvdDescription {
  lang: string;
  value: string;
}

export interface NvdCve {
  id: string;
  lastModified?: string;
  vulnStatus?: string;
  descriptions: NvdDescription[];
  references: NvdReference[];
  metrics?: {
    cvssMetricV30?: NvdCvssMetric[];
    cvssMetricV31?: NvdCvssMetric[];
    cvssMetricV2?: NvdCvssMetric[];
  };
}

export interface NvdVulnerabilityItem {
  cve: NvdCve;
}

export interface NvdResponse {
  vulnerabilities: NvdVulnerabilityItem[];
}
