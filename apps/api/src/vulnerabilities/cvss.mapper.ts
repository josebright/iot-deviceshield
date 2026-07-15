import type { CvssMetrics } from '@iot-deviceshield/types';
import type { NvdCvssMetric, NvdCvssV2Data, NvdCvssV3Data } from './nist.types';

const NONE = 'NONE';

const DEFAULT_METRIC: CvssMetrics = {
  baseSeverity: 'NONE',
  baseScore: 0,
  exploitabilityScore: 0,
  impactScore: 0,
  availabilityImpact: 'NONE',
  integrityImpact: 'NONE',
};

function isV3(data: NvdCvssV3Data | NvdCvssV2Data): data is NvdCvssV3Data {
  return data.version.startsWith('3');
}

export function mapCvssMetric(metric: NvdCvssMetric): CvssMetrics {
  const data = metric.cvssData;
  if (isV3(data)) {
    return {
      baseSeverity: (data.baseSeverity ?? NONE) as CvssMetrics['baseSeverity'],
      baseScore: data.baseScore ?? 0,
      exploitabilityScore: metric.exploitabilityScore ?? 0,
      impactScore: metric.impactScore ?? 0,
      availabilityImpact: (data.availabilityImpact ?? NONE) as CvssMetrics['availabilityImpact'],
      integrityImpact: (data.integrityImpact ?? NONE) as CvssMetrics['integrityImpact'],
    };
  }
  if (data.version.startsWith('2')) {
    return {
      baseSeverity: (metric.baseSeverity ?? NONE) as CvssMetrics['baseSeverity'],
      baseScore: data.baseScore ?? 0,
      exploitabilityScore: metric.exploitabilityScore ?? 0,
      impactScore: metric.impactScore ?? 0,
      availabilityImpact: (data.availabilityImpact ?? NONE) as CvssMetrics['availabilityImpact'],
      integrityImpact: (data.integrityImpact ?? NONE) as CvssMetrics['integrityImpact'],
    };
  }
  return { ...DEFAULT_METRIC };
}
