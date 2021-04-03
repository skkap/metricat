export class ValueMetric {
    constructor(
        readonly labels: Map<string, string>,
        readonly value: string
    ) { }

    get labelsString(): String {
        if (this.labels.size === 0) {
            return "No labels"
        } else {
            return Array.from(this.labels).map(entry => entry[0] + ":" + entry[1]).join("; ")
        }
    }
}
