import { MetricSet } from "@/models/MetricSet";
import { ValueMetric } from "@/models/ValueMetric";
import { HistogramMetric } from "@/models/HistogramMetric";
import { SummaryMetric } from "@/models/SummaryMetric";
import { MetricSetInfo } from "@/models/MetricSetInfo";
import { MetricData } from "@/models/MetricData";
import { TimePeriod } from "@/models/TimePeriod";
import { ColorSource } from '@/utils/ColorSource';
import { TimeSeries } from '@/tsd/model/TimeSeries';
import { TimeEvent } from '@/tsd/model/TimeEvent';
import { TimeSeriesUtils } from './TimeSeriesUtils';

interface metricSetInfoSubscription { (metricSetInfoList: MetricSetInfo[]): void }

interface metricDataSubscription { (metricSetName: string, metricSetData: Map<string, TimeSeries>): void }

interface metricStatsSubscription { (successCount: number, failureCount: number): void }

export class TimeSeriesDatabase {
    /**
     * Map for storing all time series:
     * MetricSetName -> (metricKey -> Collection) 
     */
    private measurementStorage: Map<string, Map<string, TimeSeries>> = new Map();

    private metricSetInfoStorage: Map<string, MetricSetInfo> = new Map();

    private metricSetSubscribers: metricSetInfoSubscription[] = [];

    private metricDataSubscribers: metricDataSubscription[] = [];

    private metricStatsSubscribers: metricStatsSubscription[] = [];

    private successCounter: number = 0;

    private failureCounter: number = 0;

    /**
     * Record new metrics in the database.
     * 
     * @param time Time when metric was scraped.
     * @param metricSets Metric sets that was scraped.
     */
    public record(time: Date, metricSets: MetricSet[]) {
        metricSets.forEach((metricSet: MetricSet) => {
            this.recordMetricSet(time, metricSet);
        })
        this.successCounter++;
        this.metricStatsSubscribers.forEach(callback => callback(this.successCounter, this.failureCounter));
    }

    recordFailure(failureReason: string | undefined) {
        this.failureCounter++;
        this.metricStatsSubscribers.forEach(callback => callback(this.successCounter, this.failureCounter));
    }

    public onMetricSetInfoListUpdate(callback: metricSetInfoSubscription) {
        this.metricSetSubscribers.push(callback);
    }

    public onMetricDataUpdate(callback: metricDataSubscription) {
        this.metricDataSubscribers.push(callback);
    }

    public onMetricStatsUpdate(callback: metricStatsSubscription) {
        this.metricStatsSubscribers.push(callback);
    }

    /**
     * Records one metric set to the database.
     * 
     * @param time Time when metric set was taken.
     * @param metricSet One metric set to be recorded.
     */
    private recordMetricSet(time: Date, metricSet: MetricSet) {
        const flattenMetrics: Map<string, TimeEvent> = this.flattenMetrics(time, metricSet.metrics)
        const metricSetMap = this.measurementStorage.get(metricSet.name)
        if (metricSetMap) {
            Array.from(flattenMetrics).map(([metricKey, event]) => {
                const collection = metricSetMap.get(metricKey)
                if (collection) {
                    collection.addEvent(event);
                } else {
                    const newTimeSeries = new TimeSeries();
                    newTimeSeries.addEvent(event);
                    metricSetMap.set(metricKey, newTimeSeries);
                }
            })
            this.metricDataSubscribers.forEach(callback => callback(metricSet.name, metricSetMap));
        } else {
            const newMetricSetMap = new Map<string, TimeSeries>()
            Array.from(flattenMetrics).map(([metricKey, event]) => {
                const newTimeSeries = new TimeSeries();
                newTimeSeries.addEvent(event);
                newMetricSetMap.set(metricKey, newTimeSeries);
            });
            this.measurementStorage.set(metricSet.name, newMetricSetMap);
            this.metricSetInfoStorage.set(metricSet.name, metricSet);
            this.metricSetSubscribers.forEach(callback => callback(this.metricSetInfoList));
            this.metricDataSubscribers.forEach(callback => callback(metricSet.name, newMetricSetMap));
        }
    }

    public get metricSetInfoList(): MetricSetInfo[] {
        return Array.from(this.metricSetInfoStorage.values());
    }

    public getMetricSetByName(name: string): MetricSetInfo | null {
        return this.metricSetInfoStorage.get(name) || null;
    }

    public getMetricSetData(name: string, period: TimePeriod): MetricData[] {
        const metricSetMetrics: Map<string, TimeSeries> | undefined = this.measurementStorage.get(name)
        if (!metricSetMetrics) return [];

        let startTime: Date | undefined = period.start?.toDate();
        let endTime: Date | undefined = period.end?.toDate();

        const colorSource = new ColorSource();
        return Array.from(metricSetMetrics).map(([metricKey, timeSeries]) => {
            const visibleTimeSeries = TimeSeriesUtils.sliceAndDownsample(timeSeries, startTime, endTime);
            return new MetricData(metricKey, colorSource.getNextColor(), true, visibleTimeSeries.getEventList());
        });
    }

    public getUnsampledMetricSetData(name: string, period: TimePeriod): MetricData[] {
        const metricSetMetrics: Map<string, TimeSeries> | undefined = this.measurementStorage.get(name)
        if (!metricSetMetrics) return [];

        let startTime: Date | undefined = period.start?.toDate();
        let endTime: Date | undefined = period.end?.toDate();

        const colorSource = new ColorSource();
        return Array.from(metricSetMetrics).map(([metricKey, timeSeries]) => {
            const visibleTimeSeries = timeSeries.slice(startTime, endTime);
            return new MetricData(metricKey, colorSource.getNextColor(), true, visibleTimeSeries.getEventList());
        });
    }

    private flattenMetrics(
        time: Date,
        metrics: ValueMetric[] | SummaryMetric[] | HistogramMetric[]
    ): Map<string, TimeEvent> {
        const flattenMap = new Map<string, TimeEvent>();
        metrics.forEach((metric: ValueMetric | SummaryMetric | HistogramMetric) => {
            const labesString = this.getMetricLabelsString(metric.labels);
            if (metric instanceof ValueMetric) {
                const value = this.stringToMetricValue(metric.value);
                flattenMap.set(labesString, new TimeEvent(time, value));
            } else if (metric instanceof SummaryMetric) {
                metric.quantiles.forEach((value, key) => {
                    const eventKey = labesString + "-#summary_" + key;
                    flattenMap.set(eventKey, new TimeEvent(time, this.stringToMetricValue(value)));
                });
                const sumKey = labesString + "-#summary_sum";
                flattenMap.set(sumKey, new TimeEvent(time, this.stringToMetricValue(metric.sum)));
                const countKey = labesString + "-#summary_count";
                flattenMap.set(countKey, new TimeEvent(time, this.stringToMetricValue(metric.count)));
            } else if (metric instanceof HistogramMetric) {
                metric.buckets.forEach((value, key) => {
                    const eventKey = labesString + "-#histogram_" + key;
                    flattenMap.set(eventKey, new TimeEvent(time, this.stringToMetricValue(value)));
                });
                const sumKey = labesString + "-#histogram_sum";
                flattenMap.set(sumKey, new TimeEvent(time, this.stringToMetricValue(metric.sum)));
                const countKey = labesString + "-#histogram_count";
                flattenMap.set(countKey, new TimeEvent(time, this.stringToMetricValue(metric.count)));
            } else {
                throw Error(`Unknown type of metric: "${metric}".`);
            }
        })
        return flattenMap;
    }

    /**
     * Turns list of labes to the string:
     * ```
     * labelName_Value__labenName_Value__...
     * ```
     */
    private getMetricLabelsString(metricLabels: Map<string, string>): string {
        const labelString = Array.from(metricLabels).map(([val, key]) => {
            return val + "_" + key;
        }).join("-");
        return labelString === "" ? "metric" : labelString;
    }

    private stringToMetricValue(value: string): number {
        const number = parseFloat(value);
        if (isNaN(number)) {
            return 0;
        }
        return number;
    }
}

export let tsd = new TimeSeriesDatabase();
