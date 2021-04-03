import { MetricSetType } from './MetricSetType'

export class MetricSetInfo {
    constructor(
        readonly name: string,
        readonly help: string,
        readonly type: MetricSetType
    ) { }
}
