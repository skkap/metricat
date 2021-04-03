import { TimeEvent } from '@/tsd/model/TimeEvent';

export class MetricData {
    constructor(
        public readonly metricKey: string,
        public readonly color: string,
        public isSelected: boolean,
        public metricSeries: TimeEvent[]
    ) {
    }
}
