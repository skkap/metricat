import { MetricSet } from '../../models/MetricSet';

export class ScrapeResult {
    constructor(
        readonly time: Date,
        readonly isSuccessful: boolean,
        readonly rawData?: string,
        readonly metricSets?: MetricSet[],
        readonly failureReason?: string
    ) { }
}
