export class HistogramMetric {
    constructor(
        readonly labels: Map<string, string>,
        readonly buckets: Map<string, string>,
        readonly count: string,
        readonly sum: string
    ) { }

    get name(): String{
        // TODO: Fix name
        return "histogram" //Array.from(this.labels).map(entry => entry[0] + ":" + entry[1]).join(";")
    }
}
