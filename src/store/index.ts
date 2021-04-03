import Vue from 'vue'
import Vuex from 'vuex'

import { MetricsState } from './MetricsState'
import * as Mutations from './Mutations'
import * as Actions from './Actions'
import { MetricSet } from '@/models/MetricSet'
import { recorder } from '@/recorder/Recorder'
import { TsdVuexPluginFactory } from '@/tsd/TsdVuexPluginFactory'
import { tsd } from '@/tsd/TimeSeriesDatabase'
import { MetricData } from '@/models/MetricData'
import { SelectedMetricsMutation } from './SelectedMetricsMutation'
import { TimePeriod } from '@/models/TimePeriod'
import { PeriodType } from '@/models/PeriodType'
import { PeriodicUpdatePluginFactory } from '@/tsd/PeriodicUpdatePluginFactory'
import { TimeSeriesUtils } from '@/tsd/TimeSeriesUtils'

Vue.use(Vuex)

const tsdPlugin = TsdVuexPluginFactory.createTsdVuexPlugin(tsd);
const periodicUpdatePlugin = PeriodicUpdatePluginFactory.createPeriodicUpdatePlugin();

export default new Vuex.Store<MetricsState>({
  plugins: [
    tsdPlugin,
    periodicUpdatePlugin
  ],

  strict: true,

  state: {
    endpointUrl: "http://demo.robustperception.io:9100/metrics",
    intervalMillis: 1000,
    recordingId: null,
    metricSets: [],
    currentMetricSet: null,
    currentMetricData: [],
    scrapeSuccessCount: 0,
    scrapeFailureCount: 0,
    period: TimeSeriesUtils.getPeriodFromType(PeriodType.LAST_1_MIN, new TimePeriod(null, null)),
    periodType: PeriodType.LAST_1_MIN,
  },

  getters: {
    metricsCount: (state: MetricsState) => {
      return state.metricSets
        .map(metricSet => metricSet.metrics.length)
        .reduce((sum, current) => sum + current, 0);
    },

    /**
     * Returns unsampled data for the current period.
     * Used for export to get data without sampling.
     */
    unsampledDataForCurrentPeriod: (state: MetricsState) => {
      const currentMetricSetName = state.currentMetricSet?.name;
      if (!currentMetricSetName) {
        return [];
      }
      return tsd.getUnsampledMetricSetData(currentMetricSetName, state.period);
    },

    /**
     * Returns unsampled data for the whole period.
     * Used for export to get data without sampling.
     */
    unsampledFullData: (state: MetricsState) => {
      const currentMetricSetName = state.currentMetricSet?.name;
      if (!currentMetricSetName) {
        return [];
      }
      const wholePeriod = TimeSeriesUtils.getPeriodFromType(PeriodType.ALL, new TimePeriod(null, null))
      return tsd.getUnsampledMetricSetData(currentMetricSetName, wholePeriod);
    }
  },

  mutations: {
    [Mutations.UPDATE_METRIC_SETS](state: MetricsState, metricSets: MetricSet[]) {
      state.metricSets = metricSets;
    },
    [Mutations.UPDATE_ENDPOINT_URL](state: MetricsState, endpointUrl: string) {
      state.endpointUrl = endpointUrl;
    },
    [Mutations.UPDATE_INTERVAL](state: MetricsState, intervalMillis: number) {
      state.intervalMillis = intervalMillis;
    },
    [Mutations.SET_RECORDING_ID](state: MetricsState, recordingId: string) {
      state.recordingId = recordingId;
    },
    [Mutations.SET_CURRENT_METRIC_SET](state: MetricsState, currentMetricSet: MetricSet) {
      state.currentMetricSet = currentMetricSet;
    },
    [Mutations.SET_SERIES_TO_CURRENT_METRIC_SET](state: MetricsState, metricData: MetricData) {
      const curMetricData = state.currentMetricData.find(d => d.metricKey === metricData.metricKey);
      if (curMetricData) {
        curMetricData.metricSeries = metricData.metricSeries;
      } else {
        state.currentMetricData.push(metricData);
      }
    },
    [Mutations.SET_CURRENT_METRIC_DATA](state: MetricsState, metricData: MetricData[]) {
      state.currentMetricData = metricData;
    },
    [Mutations.UPDATE_SELECTED_METRICS](state: MetricsState, mutation: SelectedMetricsMutation) {
      if (state.currentMetricSet?.name === mutation.metricSetName) {
        const curMetricData = state.currentMetricData.find(d => d.metricKey === mutation.metricName);
        if (curMetricData) {
          curMetricData.isSelected = mutation.isSelected;
        } else {
          console.error(`Metric not found: ${mutation.metricSetName} -> ${mutation.metricName}`);
        }
      }
    },
    [Mutations.SET_SCRAPE_SUCCESS_COUNT](state: MetricsState, count: number) {
      state.scrapeSuccessCount = count
    },
    [Mutations.SET_SCRAPE_FAILURE_COUNT](state: MetricsState, count: number) {
      state.scrapeFailureCount = count
    },
    [Mutations.SET_CURRENT_TIME_PERIOD](state: MetricsState, period: TimePeriod) {
      state.period = period;
    },
    [Mutations.SET_CURRENT_TIME_PERIOD_TYPE](state: MetricsState, periodType: PeriodType) {
      state.periodType = periodType;
    },
  },

  actions: {
    /**
     * Turn on/off recording session.
     */
    [Actions.TOGGLE_RECORDING]({ commit }) {
      const endpointUrl = this.state.endpointUrl;
      const intervalMillis = this.state.intervalMillis;
      if (this.state.recordingId === null) {
        const recordingId = recorder.startRecording(intervalMillis, endpointUrl);
        commit(Mutations.SET_RECORDING_ID, recordingId);
      } else {
        recorder.stopRecording(this.state.recordingId);
        commit(Mutations.SET_RECORDING_ID, null);
      }
    },

     /**
     * Updare interval and pass new interval to the running recording.
     */
    [Actions.UPDATE_INTERVAL_FOR_RUNNING_RECORDING]({ commit }, intervalMillis: number) {
      commit(Mutations.UPDATE_INTERVAL, intervalMillis);
      if (this.state.recordingId !== null) {
        recorder.updateInterval(this.state.recordingId, intervalMillis);
      }
    },

    /**
     * Called when user selects new metric set in the list.
     */
    [Actions.SELECT_METRIC_SET]({ commit }, currentMetricSet: MetricSet) {
      commit(Mutations.SET_CURRENT_METRIC_SET, currentMetricSet)
      const metricData = tsd.getMetricSetData(currentMetricSet.name, this.state.period)
      commit(Mutations.SET_CURRENT_METRIC_DATA, metricData)
    },

    /**
     * Called when user zooms current metric set on the chart.
     */
    [Actions.ZOOM_METRIC]({ commit }, timePeriod: TimePeriod) {
      const currentMetricSetName = this.state.currentMetricSet?.name;
      if (currentMetricSetName) {
        commit(Mutations.SET_CURRENT_TIME_PERIOD_TYPE, PeriodType.CUSTOM);
        commit(Mutations.SET_CURRENT_TIME_PERIOD, timePeriod);
        const data = tsd.getMetricSetData(currentMetricSetName, timePeriod);
        commit(Mutations.SET_CURRENT_METRIC_DATA, data);
      } else {
        console.error("Zoom cannot be performed if metric set is not selected.");
      }
    },

    /**
     * User selected period type.
     */
    [Actions.UPDATE_PERIOD_TYPE]({ commit }, periodType: PeriodType) {
      const currentMetricSetName = this.state.currentMetricSet?.name;
      if (currentMetricSetName) {
        commit(Mutations.SET_CURRENT_TIME_PERIOD_TYPE, periodType);
        const currentPeriod = TimeSeriesUtils.getPeriodFromType(periodType, this.state.period);
        commit(Mutations.SET_CURRENT_TIME_PERIOD, currentPeriod);
        const data = tsd.getMetricSetData(currentMetricSetName, this.state.period);
        commit(Mutations.SET_CURRENT_METRIC_DATA, data);
      }
    },

    /**
     * Gets called periodically so chart can be updated.
     */
    [Actions.UPDATE_CHART]({ commit }) {
      // Data in the custom period does not change
      if (this.state.periodType === PeriodType.CUSTOM) {
        return;
      }
      const currentMetricSetName = this.state.currentMetricSet?.name;
      if (currentMetricSetName) {
        const currentPeriod = TimeSeriesUtils.getPeriodFromType(this.state.periodType, this.state.period);
        commit(Mutations.SET_CURRENT_TIME_PERIOD, currentPeriod);
        const data = tsd.getMetricSetData(currentMetricSetName, this.state.period);
        commit(Mutations.SET_CURRENT_METRIC_DATA, data);
      }
    },

    // /**
    //  * Apply mutation to the current metric set data. 
    //  * Called when new data is available for the current metric set.
    //  */
    // [Actions.UPDATE_CURRENT_METRIC_SET_DATA]({ commit }) {
    //   const currentMetricSetName = this.state.currentMetricSet?.name;
    //   console.log(currentMetricSetName)
    //   if (currentMetricSetName) {
    //     const data = tsd.getMetricSetData(currentMetricSetName, this.state.period);
    //     commit(Mutations.SET_CURRENT_METRIC_DATA, data);
    //   }
    // }
  },

  modules: {
  }
})
