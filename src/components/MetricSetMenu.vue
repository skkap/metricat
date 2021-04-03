<template>
  <div class="metric-set-container">
    <div class="metric-set-filter">
      <b-form-input
        v-model="metricSetFilter"
        @input="filterChange"
        class="form-control-sm"
        placeholder="Filter"
      ></b-form-input>
    </div>
    <div class="metric-set-table">
      <b-table
        id="metricTable"
        ref="metricTable"
        hover
        small
        select-mode="single"
        selectable
        thead-class="hidden_header"
        :items="metricList"
        :fields="fields"
        @row-selected="rowSelected"
        primary-key="name"
      >
        <template v-slot:cell()="data">
          <i :title="data.value">{{ data.value }}</i>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script lang="ts">
import * as Actions from "../store/Actions";
import { MetricSetType } from "../models/MetricSetType";
import { MetricsState } from "../store/MetricsState";
import { Vue, Component, Prop } from "vue-property-decorator";
import { MetricSet } from "../models/MetricSet";

@Component
export default class MetricSetMenu extends Vue {
  private metricSetFilter: string = "";

  private currentRowKey: string = "";

  get metricList() {
    const state: MetricsState = this["$store"].state;
    return state.metricSets.filter(row => {
      return (
        this.metricSetFilter === "" ||
        row.name.toLowerCase().includes(this.metricSetFilter.toLowerCase())
      );
    });
  }

  get fields() {
    return [
      // A regular column
      "name"
    ];
  }

  get filteredMetricSets(): MetricSet[] {
    const state: MetricsState = this["$store"].state;
    return state.metricSets.filter(row => {
      return (
        this.metricSetFilter === "" ||
        row.name.toLowerCase().includes(this.metricSetFilter.toLowerCase())
      );
    });
  }

  public rowSelected(selected: MetricSet[]) {
    if (selected.length > 0) {
      const selection = selected[0];
      const currentMetricSet = this.filteredMetricSets.find(
        row => row.name === selection.name
      );
      this["$store"].dispatch(Actions.SELECT_METRIC_SET, currentMetricSet);
    }
  }

  public handlemetricSetSelected(selection: MetricSet | null) {
    if (selection !== null) {
      const currentMetricSet = this.filteredMetricSets.find(
        row => row.name === selection.name
      );
      this["$store"].dispatch(Actions.SELECT_METRIC_SET, currentMetricSet);
    }
  }

  public filterChange(input: string) {
    this.reselectCurrentRow();
  }

  mounted() {
    this.reselectCurrentRow();
  }

  private reselectCurrentRow() {
    const state: MetricsState = this["$store"].state;
    const currentMetricSetName = state.currentMetricSet?.name;
    if (currentMetricSetName) {
      const currentMetricSet = this.filteredMetricSets.find(
        row => row.name === currentMetricSetName
      );
      if (currentMetricSet) {
        // TODO: Select row programmatically
      }
    }
  }
}
</script>

<style lang="scss">
.hidden_header {
  display: none;
}

tr:focus {
  outline: none;
}

.metric-set-container {
  display: flex;
  flex-flow: column;
  min-height: 100%;
  max-height: 100%;
  user-select: none;

  i {
    font-style: normal;
    font-size: 0.8em;
  }

  .metric-set-filter {
    flex-shrink: 0;
  }

  .metric-set-table {
    overflow-x: hidden;
    overflow-y: scroll;
  }

  .metric-set-table::-webkit-scrollbar {     
    background-color: rgb(134, 134, 134);
    width: .8em
  }

  .metric-set-table::-webkit-scrollbar-thumb:window-inactive {
    background: rgb(27, 27, 27);
  }
  .metric-set-table::-webkit-scrollbar-thumb {
    background: rgb(27, 27, 27);
  }
}
</style>

<style scoped lang="scss">
</style>
