import { Store } from "vuex";
import { TimeSeriesDatabase } from './TimeSeriesDatabase'
import * as Mutations from "../store/Mutations"
import { MetricSetInfo } from '@/models/MetricSetInfo'
import { MetricsState } from '@/store/MetricsState'
import { TimeSeries } from './model/TimeSeries';

export class TsdVuexPluginFactory {
    public static createTsdVuexPlugin(tsd: TimeSeriesDatabase) {
        return (store: Store<MetricsState>) => {
            tsd.onMetricSetInfoListUpdate((metricSetInfoList: MetricSetInfo[]) => {
                store.commit(Mutations.UPDATE_METRIC_SETS, metricSetInfoList);
            }),

            tsd.onMetricDataUpdate((metricSetName: string, metricSetData: Map<string, TimeSeries>) => {
                // not used
            }),

            tsd.onMetricStatsUpdate((successCount: number, failureCount:number) => {
                store.commit(Mutations.SET_SCRAPE_SUCCESS_COUNT, successCount);
                store.commit(Mutations.SET_SCRAPE_FAILURE_COUNT, failureCount);
            })
        }
    }
}
