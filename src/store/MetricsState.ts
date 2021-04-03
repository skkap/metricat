import { MetricSet } from '@/models/MetricSet';
import { MetricData } from '@/models/MetricData';
import { TimePeriod } from '@/models/TimePeriod';
import { PeriodType } from '@/models/PeriodType';

export interface MetricsState {
    endpointUrl: string,
    intervalMillis: number,
    recordingId: string | null,
    metricSets: MetricSet[]
    currentMetricSet: MetricSet | null,
    currentMetricData: MetricData[],
    scrapeSuccessCount: number,
    scrapeFailureCount: number,
    period: TimePeriod,
    periodType: PeriodType
}
