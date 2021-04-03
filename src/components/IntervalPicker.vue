<template>
  <b-form-spinbutton
    id="sb-small"
    size="sm"
    v-bind:value="value"
    @input="input"
    min="1"
    max="60"
    class="interval-control"
  ></b-form-spinbutton>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class IntervalPicker extends Vue {
  @Prop({ required: true }) readonly value!: number;

  public input(newValue: number) {
    this.$emit("input", newValue);
  }
}
</script>

<style scoped lang="scss">
.interval-control {
  width: 150px;
}
</style>