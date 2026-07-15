import { mapCvssMetric } from './cvss.mapper';

describe('mapCvssMetric', () => {
  it('maps a CVSS v3.1 metric with all fields', () => {
    const result = mapCvssMetric({
      cvssData: {
        version: '3.1',
        baseScore: 9.8,
        baseSeverity: 'CRITICAL',
        availabilityImpact: 'HIGH',
        integrityImpact: 'HIGH',
      },
      exploitabilityScore: 3.9,
      impactScore: 5.9,
    });

    expect(result).toEqual({
      baseSeverity: 'CRITICAL',
      baseScore: 9.8,
      exploitabilityScore: 3.9,
      impactScore: 5.9,
      availabilityImpact: 'HIGH',
      integrityImpact: 'HIGH',
    });
  });

  it('reads baseSeverity from the metric level for CVSS v2', () => {
    const result = mapCvssMetric({
      cvssData: {
        version: '2.0',
        baseScore: 7.5,
        availabilityImpact: 'PARTIAL',
        integrityImpact: 'NONE',
      },
      exploitabilityScore: 10,
      impactScore: 6.4,
      baseSeverity: 'HIGH',
    });

    expect(result.baseSeverity).toBe('HIGH');
    expect(result.baseScore).toBe(7.5);
  });

  it('falls back to a NONE-defaulted metric for unknown CVSS versions', () => {
    const result = mapCvssMetric({
      cvssData: { version: '4.0' },
    });

    expect(result.baseSeverity).toBe('NONE');
    expect(result.baseScore).toBe(0);
  });
});
