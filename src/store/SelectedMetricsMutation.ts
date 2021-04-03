export class SelectedMetricsMutation {
    constructor(
        readonly metricSetName: string,
        readonly metricName: string,
        readonly isSelected: boolean
    ) { }
}
