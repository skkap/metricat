import axios, { AxiosResponse } from "axios"

import { ScrapeResult } from "./ScrapeResult"
import { MetricSet } from '@/models/MetricSet'
import { MetricSetType } from '@/models/MetricSetType'
import { SummaryMetric } from '@/models/SummaryMetric'
import { HistogramMetric } from '@/models/HistogramMetric'
import { ValueMetric } from '@/models/ValueMetric'
import parsePrometheusTextFormat from "@/recorder/parser/prometheusParser"

export class MetricsScraper {
    public static async scrapeOne(url: string): Promise<ScrapeResult> {
        const scrapeTime = new Date()
        try {
            const response: AxiosResponse<string> = await MetricsScraper.request(url)
            if (response.status === 200) {
                const responseData: string = response.data
                const parsedMetrics: MetricSet[] = MetricsScraper.parseMetrics(responseData)
                return new ScrapeResult(scrapeTime, true, responseData, parsedMetrics)
            } else {
                return new ScrapeResult(
                    scrapeTime,
                    false,
                    undefined,
                    undefined,
                    `Server returned error response: '${response.statusText}'.`
                )
            }
        } catch (error) {
            console.log(error)
            return new ScrapeResult(
                scrapeTime,
                false,
                undefined,
                undefined,
                `Could not reach the remote server.`
            )
        }
    }

    private static parseMetrics(metricsData: string): MetricSet[] {
        const parsedMetricsRaw: object[] = parsePrometheusTextFormat(metricsData)
        return parsedMetricsRaw.map(metricSetRaw => {
            const name = metricSetRaw["name"]
            const help = metricSetRaw["help"]
            const type: MetricSetType = (<any>MetricSetType)[metricSetRaw["type"]]
            const metricsRaw: object[] = metricSetRaw["metrics"]
            var metrics: SummaryMetric[] | HistogramMetric[] | ValueMetric[]
            switch (type) {
                case MetricSetType.SUMMARY:
                    metrics = metricsRaw.map(metricRaw => {
                        return new SummaryMetric(
                            new Map(Object.entries(metricRaw["labels"] || {})),
                            new Map(Object.entries(metricRaw["quantiles"] || {})),
                            metricRaw["count"],
                            metricRaw["sum"]
                        )
                    })
                    break
                case MetricSetType.HISTOGRAM:
                    metrics = metricsRaw.map(metricRaw => {
                        return new HistogramMetric(
                            new Map(Object.entries(metricRaw["labels"] || {})),
                            new Map(Object.entries(metricRaw["buckets"] || {})),
                            metricRaw["count"],
                            metricRaw["sum"]
                        )
                    })
                    break
                case MetricSetType.COUNTER:
                case MetricSetType.GAUGE:
                case MetricSetType.UNTYPED:
                    metrics = metricsRaw.map(metricRaw => {
                        return new ValueMetric(
                            new Map(Object.entries(metricRaw["labels"] || {})),
                            metricRaw["value"]
                        )
                    })
                    break
                default:
                    // TODO: log error
                    metrics = []
                    break
            }

            return new MetricSet(name, help, type, metrics)
        })
    }

    private static async request(url: string): Promise<AxiosResponse<string>> {
        return await axios.get<string>(
            url,
            { headers: { "accept": "text/plain" } }
        )
    }
}
