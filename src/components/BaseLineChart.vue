<script lang="ts">
import { ChartData, ChartOptions } from "chart.js";
import { Line, mixins } from "vue-chartjs";
import { Vue, Component, Prop, Mixins, Watch } from "vue-property-decorator";
import crosshairPlugin from "chartjs-plugin-crosshair";

@Component
export default class BaseLineChart extends Mixins(Line, mixins.reactiveProp) {
  @Prop() readonly options!: ChartOptions;

  @Watch("options", { deep: true })
  optionChanges(newOption, oldOption) {
    // https://www.chartjs.org/docs/latest/developers/updates.html

    // update only x axis.
    this.$data._chart.options.scales.xAxes[0] = newOption.scales.xAxes[0];
    this.$data._chart.update();

    // Updating all options by rebuilding whole graph
    //this.$data._chart.destroy();
    //this.renderChart(this.chartData, this.options);
  }

  mounted() {
    this.addPlugin(crosshairPlugin);
    this.renderChart(this.chartData, this.options);
  }
}
</script>
