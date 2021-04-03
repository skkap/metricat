<template>
    <BaseLineChart class="line-chart" :chart-data="metricData" :options="options"></BaseLineChart>
</template>

<script lang="ts">
import { Store } from "vuex";
import moment from "moment";
import * as Actions from "../store/Actions";
import BaseLineChart from "./BaseLineChart.vue";
import { Vue, Component, Prop, Mixins } from "vue-property-decorator";
import { MetricsState } from "@/store/MetricsState";
import { MetricData } from "@/models/MetricData";
import { round } from "@/utils/MathUtils";
import { TimePeriod } from "@/models/TimePeriod";
import { PeriodType } from "@/models/PeriodType";

@Component({
  components: { BaseLineChart }
})
export default class MetricLineChart extends Vue {
  get options() {
    const store: Store<MetricsState> = this.$store;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      scales: {
        xAxes: [
          {
            type: "time",
            time: {
              displayFormats: {
                millisecond: "HH:mm:ss.SSS",
                second: "HH:mm:ss",
                minute: "HH:mm",
                hour: "HH"
              },
              tooltipFormat: "YYYY-MM-DD HH:mm:ss.SSS"
            },
            ticks: {
              min: store.state.period.start?.toDate(),
              max: store.state.period.end?.toDate()
            }
          }
        ]
      },
      legend: {
        display: true,
        position: "bottom",
        align: "start",
        labels: {
          boxWidth: 15,
          usePointStyle: false
        }
      },
      elements: {
        line: {
          tension: 0 // disables bezier curves
        }
      },
      tooltips: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          title: function(a, d) {
            return a[0].xLabel;
          },
          label: function(i, d) {
            const rawValue = i.yLabel;
            return d.datasets[i.datasetIndex].label + ": " + round(rawValue, 5);
          }
        }
      },
      plugins: {
        crosshair: {
          line: {
            color: "#7f3333", // crosshair line color
            width: 1, // crosshair line width
            dashPattern: [5, 5] // crosshair line dash pattern
          },
          sync: {
            enabled: true, // enable trace line syncing with other charts
            group: 1, // chart group
            suppressTooltips: false // suppress tooltips when showing a synced tracer
          },
          zoom: {
            enabled: true, // enable zooming
            zoomboxBackgroundColor: "rgba(66,133,244,0.2)", // background color of zoom box
            zoomboxBorderColor: "#48F", // border color of zoom box
            zoomButtonText: "Reset Zoom", // reset zoom button text
            zoomButtonClass: "reset-zoom" // reset zoom button class
          },
          callbacks: {
            beforeZoom: function(start: moment.Moment, end: moment.Moment) {
              store.dispatch(Actions.ZOOM_METRIC, new TimePeriod(start, end));
              return false; // return false to prevent zoom by chartjszoom
            },
            afterZoom: function(start: moment.Moment, end: moment.Moment) {
              // called after zoom
            }
          }
        }
      }
    };
  }

  get metricData() {
    const store: Store<MetricsState> = this.$store;
    const datasets = store.state.currentMetricData.map(data => {
      return {
        fill: false,
        label: data.metricKey,
        borderColor: data.color,
        backgroundColor: data.color,
        borderWidth: 1,
        pointRadius: 1,
        data: data.metricSeries.map(metricPoint => {
          return { t: metricPoint.time, y: metricPoint.value };
        })
      };
    });
    return { datasets: datasets };
  }
}
</script>

<style scoped lang="scss">
.line-chart {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
