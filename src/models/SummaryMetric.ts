import { Quantile } from './Quantile'

export class SummaryMetric {
    constructor(
        readonly labels: Map<string, string>,
        readonly quantiles: Map<string, string>,
        readonly count: string,
        readonly sum: string
    ) { }

    get labelsString(): String {
        if (this.labels.size === 0) {
            return "No labels"
        } else {
            return Array.from(this.labels).map(entry => entry[0] + ":" + entry[1]).join("; ")
        }
    }

    get quantilesList() {
        return Array.from(this.quantiles).map(entry => new Quantile(entry[0], entry[1]))
    }
}
