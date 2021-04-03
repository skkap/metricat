import { ValueMetric } from './ValueMetric'
import { MetricSetType } from './MetricSetType'
import { SummaryMetric } from './SummaryMetric'
import { HistogramMetric } from './HistogramMetric'
import { MetricSetInfo } from './MetricSetInfo'

export class MetricSet extends MetricSetInfo {
    constructor(
        name: string,
        help: string,
        type: MetricSetType,
        readonly metrics: ValueMetric[] | SummaryMetric[] | HistogramMetric[]
    ) {
        super(name, help, type)
    }
}
