<template>
  <div class="metric-set-info-main">
    <div class="metric-set-info-title">
      <code class="title-element">{{currentMetricSet.name}}</code>
      <span class="metric-type">{{currentMetricSet.type}}</span>
      <b-dropdown
        class="metric-set-props"
        size="sm"
        variant="link"
        toggle-class="text-decoration-none"
        no-caret
      >
        <template v-slot:button-content>
          <b-icon class="metric-set-props-icon" icon="file-earmark-arrow-down"></b-icon>
        </template>
        <b-dropdown-item @click="exportCurrentPeriod">Export current period</b-dropdown-item>
        <b-dropdown-item @click="exportAll">Export all data</b-dropdown-item>
      </b-dropdown>
    </div>
    <div class="metric-set-info-footer">
      <span class="font-weight-lighter metric-set-help">{{currentMetricSet.help}}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { MetricsState } from "../store/MetricsState";
import { Vue, Component } from "vue-property-decorator";
import { MetricSet } from "../models/MetricSet";
import { MetricsExportService } from "../export/MetricsExportService";
import { remote, SaveDialogReturnValue } from "electron";
import { MetricData } from "../models/MetricData";

@Component
export default class MetricSetInfoArea extends Vue {
  private metricsExportService: MetricsExportService = remote.getGlobal(
    "metricsExportService"
  );

  get currentMetricSet(): MetricSet | null {
    const state: MetricsState = this["$store"].state;
    return state.currentMetricSet;
  }

  public async exportAll() {
    const window = remote.getCurrentWindow();
    const data: MetricData[] = this["$store"].getters.unsampledFullData;
    await this.metricsExportService.record(window, data);
  }

  public async exportCurrentPeriod() {
    const window = remote.getCurrentWindow();
    const data: MetricData[] = this["$store"].getters
      .unsampledDataForCurrentPeriod;
    await this.metricsExportService.record(window, data);
  }
}
</script>

<style lang="scss">
.metric-set-info-main {
  color: #ccc;
}

.metric-set-info-title {
  .title-element {
    margin-right: 7px;
  }

  .metric-type {
    color: #0acf97;
    border: 1px solid #0acf97;
    background-color: transparent;
    padding-right: 0.6em;
    padding-left: 0.6em;
    border-radius: 10rem;
    display: inline-block;
    padding: 0.25em 0.4em;
    font-size: 60%;
    font-weight: 700;
    line-height: 1;
    user-select: none;
  }

  .metric-set-props {
    padding: 0;

    :hover {
      color: darken(#0acf97, 5);
    }

    &.show .btn {
      color: darken(#0acf97, 5);
    }

    .btn:focus {
      -webkit-box-shadow: none;
      box-shadow: none;
    }

    .btn {
      color: #ccc;
    }

    .dropdown-menu {
      padding: 0;
      li {
        font-size: 0.85em;
        a {
          padding: 0 1.5rem;
        }
      }
    }

    .metric-set-props-icon {
      font-size: 1.1em !important;
    }
  }
}

.metric-set-info-footer {
  .metric-set-help {
    font-size: 0.85em;
  }
}
</style>
