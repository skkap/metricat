import { MetricData } from '@/models/MetricData';

export class MetricDataMutation {
    constructor(
        readonly metricSetName: string,
        readonly metricData: MetricData[]
    ) { }
}
