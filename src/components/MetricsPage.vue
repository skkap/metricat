<template>
  <div class="main-container">
    <div class="main-body">
      <div class="metrics-side-bar">
        <MetricSetMenu></MetricSetMenu>
      </div>
      <div class="main-area" v-if="currentMetricSet !== null">
        <MetricSetInfoArea class="metric-set-info-area"></MetricSetInfoArea>
        <div class="main-area-chart-settings">
          <form>
            <div class="form-row align-items-center">
              <div class="col-auto">
                <b-form-select v-model="periodType" size="sm">
                  <b-form-select-option
                    v-for="type in periodTypes"
                    :key="type.value"
                    :value="type.value"
                    :disabled="type.disabled"
                  >{{type.label}}</b-form-select-option>
                </b-form-select>
              </div>
              <div class="period-start font-weight-lighter" v-if="periodStart">
                <strong>From:</strong>
                {{periodStart}}
              </div>
              <div class="period-end font-weight-lighter" v-if="periodEnd">
                <strong>To:</strong>
                {{periodEnd}}
              </div>
            </div>
          </form>
        </div>
        <div class="main-area-chart">
          <MetricLineChart></MetricLineChart>
        </div>
      </div>
    </div>
    <footer class="main-footer">
      <span
        id="interval-status-bar"
        class="interval-status-bar status-bar-element"
        title="Interval between requests. Click to change."
      >
        <b-icon icon="clock-history"></b-icon>
        {{intervalSeconds}} sec.
      </span>

      <span class="url-status-bar status-bar-element" title="Exporter URL">
        <b-icon icon="link45deg"></b-icon>
        {{endpoint.url}}
      </span>

      <div class="left-status-bar">
        <span class="size-status-bar status-bar-element" title="Amount of metrics in measurement">
          <b-icon icon="files"></b-icon>
          &nbsp;
          {{metricsCount}}
        </span>

        <span class="measurements-status-bar status-bar-element">
          <span title="Successful requests">
            <b-icon icon="check-circle"></b-icon>
            {{endpoint.successCount}}
          </span>

          <span class="error-status" title="Failed requests">
            <b-icon icon="exclamation-triangle"></b-icon>
            {{endpoint.failureCount}}
          </span>
        </span>

        <div
          class="recording-status-bar recording-running"
          @click="toggleRecording"
          v-if="isRecording"
        >
          <b-icon icon="arrow-clockwise" animation="spin"></b-icon>&nbsp;
          Recording
        </div>

        <div
          class="recording-status-bar recording-stopped"
          @click="toggleRecording"
          v-if="!isRecording"
        >
          <b-icon icon="play-fill"></b-icon>&nbsp;
          Start
        </div>
      </div>
    </footer>
    <b-popover
      custom-class="interval-editor-popover"
      target="interval-status-bar"
      triggers="click"
      placement="top"
    >
      <template v-slot:title>Change request interval</template>
      <IntervalPicker v-model="intervalSeconds"></IntervalPicker>
    </b-popover>
  </div>
</template>

<script lang="ts">
import { Store } from "vuex";
import { Vue, Component, Prop } from "vue-property-decorator";

import MetricLineChart from "@/components/MetricLineChart.vue";
import MetricSetMenu from "@/components/MetricSetMenu.vue";
import MetricSetInfoArea from "@/components/MetricSetInfoArea.vue";
import IntervalPicker from "@/components/IntervalPicker.vue";

import * as Mutations from "@/store/Mutations";
import * as Actions from "@/store/Actions";
import { MetricSet } from "@/models/MetricSet";
import { MetricsState } from "@/store/MetricsState";
import { MetricData } from "@/models/MetricData";
import { PeriodType, periodTypeLabels } from "@/models/PeriodType";
import { TimePeriod } from "@/models/TimePeriod";

@Component({
  components: {
    MetricLineChart,
    MetricSetMenu,
    MetricSetInfoArea,
    IntervalPicker
  }
})
export default class MetricsPage extends Vue {
  @Prop() readonly intervalMillis!: number;
  @Prop() readonly url!: string;

  private currentTab: string = "metrics";

  get currentMetricData(): MetricData[] {
    const state: MetricsState = this["$store"].state;
    return state.currentMetricData;
  }

  get endpointUrl(): string {
    this.$route.query;
    const state: MetricsState = this["$store"].state;
    return state.endpointUrl;
  }

  set endpointUrl(value: string) {
    this["$store"].commit(Mutations.UPDATE_ENDPOINT_URL, value);
  }

  get intervalSeconds(): number {
    const state: MetricsState = this["$store"].state;
    return state.intervalMillis / 1000;
  }

  set intervalSeconds(value: number) {
    this["$store"].dispatch(
      Actions.UPDATE_INTERVAL_FOR_RUNNING_RECORDING,
      value * 1000
    );
  }

  get currentMetricSet(): MetricSet | null {
    const state: MetricsState = this["$store"].state;
    return state.currentMetricSet;
  }

  get isRecording() {
    const state: MetricsState = this["$store"].state;
    return state.recordingId !== null;
  }

  get endpoint() {
    const state: MetricsState = this["$store"].state;
    return {
      url: state.endpointUrl,
      interval: state.intervalMillis / 1000,
      successCount: state.scrapeSuccessCount,
      failureCount: state.scrapeFailureCount
    };
  }

  get periodTypes(): any[] {
    return Object.keys(PeriodType).map(periodTypeString => {
      const periodTypeEnum: string =
        PeriodType[periodTypeString as keyof PeriodType];
      return {
        value: periodTypeString,
        label: periodTypeEnum,
        disabled: periodTypeEnum === PeriodType.CUSTOM
      };
    });
  }

  get periodType(): string {
    const store: Store<MetricsState> = this.$store;
    return periodTypeLabels.get(store.state.periodType.toString());
  }

  get metricsCount(): string {
    const store: Store<MetricsState> = this.$store;
    return store.getters.metricsCount;
  }

  set periodType(selected: string) {
    const store: Store<MetricsState> = this.$store;
    const periodType: PeriodType = PeriodType[selected as keyof PeriodType];
    store.dispatch(Actions.UPDATE_PERIOD_TYPE, periodType);
  }

  get periodStart(): string | null {
    const store: Store<MetricsState> = this.$store;
    return store.state.period.start?.format("YYYY.MM.DD HH:mm:ss") || null;
  }

  get periodEnd(): string | null {
    const store: Store<MetricsState> = this.$store;
    return store.state.period.end?.format("YYYY.MM.DD HH:mm:ss") || null;
  }

  public toggleRecording(): void {
    this["$store"].dispatch(Actions.TOGGLE_RECORDING);
  }

  public handlemetricSetSelected(selection) {
    if (selection !== null) {
      const state: MetricsState = this["$store"].state;
      const currentMetricSet = state.metricSets[selection.index];
      this["$store"].dispatch(Actions.SELECT_METRIC_SET, currentMetricSet);
    }
  }

  public handleMenuSelect(menuIndex: string) {
    this.currentTab = menuIndex;
  }

  mounted() {
    this["$store"].commit(Mutations.UPDATE_ENDPOINT_URL, this.url);
    this["$store"].commit(Mutations.UPDATE_INTERVAL, this.intervalMillis);
    this["$store"].dispatch(Actions.TOGGLE_RECORDING);
  }
}
</script>

<style lang="scss">
.interval-editor-popover {
  h3 {
    font-size: 0.85em;
  }
}
</style>

<style scoped lang="scss">
.main-container {
  display: flex;
  flex-flow: column;
  max-height: 100%;
  min-height: 100vh;

  .main-body {
    display: flex;
    flex-flow: row;
    flex: 1;
    height: 100%;
    width: 100%;
    overflow: hidden;

    .metrics-side-bar {
      background: #1c1c1d;
      width: 300px;
      min-height: 100%;
      max-height: 100%;
      overflow: hidden;
    }

    .main-area {
      display: flex;
      flex-direction: column;

      padding: 10px 10px 10px 10px;
      min-height: 100%;
      max-height: 100%;
      flex: 1;
      overflow: hidden;

      .metric-set-info-area {
        padding-bottom: 15px;
      }

      .main-area-chart-settings {
        padding-bottom: 15px;
      }

      .main-area-chart {
        flex: 1;
        height: 100%;
      }
    }
  }

  .main-footer {
    height: 22px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    user-select: none;
    cursor: default;

    background: #008f6b;
    color: rgb(223, 223, 223);
    font-size: 0.75em;

    padding-left: 10px;
  }
}

.status-bar-element {
  white-space: nowrap;
  margin: 0 5px 0 5px;
}

.url-status-bar {
  text-overflow: ellipsis;
  overflow: hidden;
  min-width: 50px;
  max-width: 500px;
}

.left-status-bar {
  height: 100%;
  margin-left: auto;
  line-height: 22px;

  .measurements-status-bar {
    .error-status {
      margin-left: 5px;
    }
  }

  .recording-status-bar {
    display: inline-block;
    cursor: pointer;
    margin-left: auto;
    width: 90px;
    text-align: center;
    border: 0;
    font-size: 0.95em;
    height: 100%;
    box-shadow: none;
  }
  .recording-running {
    background: #1fceb5;
  }
  .recording-running:hover {
    background: darken(#1fceb5, 5);
  }
  .recording-stopped {
    background: #ff8352;
  }
  .recording-stopped:hover {
    background: darken(#ff8352, 5);
  }
}

.period-start {
  font-size: 0.85em;
  margin-left: 10px;
  width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.period-end {
  font-size: 0.85em;
  margin-left: 10px;
  width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
