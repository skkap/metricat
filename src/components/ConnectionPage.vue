<template>
  <div class="card connection-card">
    <div class="card-header">
      <img class="prometheus-logo" src="../assets/prom_logo.png" />
      <span>Create New Recording</span>
    </div>
    <div class="card-body">
      <b-form @submit.stop.prevent>
        <div class="form-group">
          <label for="feedback-user">Prometheus exporter URL</label>
          <b-input-group size="sm">
            <template v-slot:append>
              <b-input-group-text v-if="testingStatus == 'testing'">
                <strong class="text-success">
                  <b-icon icon="arrow-clockwise" animation="spin"></b-icon>
                </strong>
              </b-input-group-text>

              <b-input-group-text v-if="testingStatus == 'success'">
                <strong class="text-success">
                  <b-icon icon="check"></b-icon>
                </strong>
              </b-input-group-text>

              <b-input-group-text v-if="testingStatus == 'fail'">
                <strong class="text-danger">
                  <b-icon id="failed-test" icon="x"></b-icon>
                  <b-tooltip
                    :show.sync="isErrorTooltipVisible"
                    target="failed-test"
                    triggers="hover"
                    variant="danger"
                  >{{lastError}}</b-tooltip>
                </strong>
              </b-input-group-text>
            </template>

            <b-form-input
              v-model="url"
              id="feedback-user"
              class="form-control-sm"
              placeholder="http://..."
            ></b-form-input>
          </b-input-group>
        </div>

        
        <div class="form-group">
          <label for="sb-small">Request interval (sec.)</label>
          <IntervalPicker v-model="intervalSeconds"></IntervalPicker>
        </div>

        <div class="float-right">
          <b-button size="sm" variant="info" @click="testUrl" class="bottom-button">Test</b-button>

          <b-button
            size="sm"
            variant="success"
            @click="startRecording"
            class="bottom-button"
          >Start recording</b-button>
        </div>
      </b-form>
    </div>
    <div class="card-footer text-muted">
      <div class="info-container">
        <div class="icon-column">
          <b-icon icon="info-circle"></b-icon>
        </div>
        <div class="text-column">
          You can enter url of any Prometheus-compatible exporter.
          <br />Use "Test" button to check if the exporter is accesible.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { v4 as uuid } from "uuid";
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { WindowKind } from "../windows/WindowConfiguration";
import { MetricsScraper } from "@/recorder/scraper/MetricsScraper";

import IntervalPicker from "@/components/IntervalPicker.vue";

@Component({
  components: { IntervalPicker }
})
export default class ConnectionPage extends Vue {
  private url: string = "http://demo.robustperception.io:9100/metrics";
  private intervalSeconds: number = 3;

  private testingStatus: string = "none";
  private isErrorTooltipVisible: boolean = false;
  private lastError: string | undefined = undefined;

  public async startRecording() {
    const endpointIsValid = await this.testUrl();
    if (endpointIsValid) {
      this.openRecordingWindow();
    }
  }

  private openRecordingWindow() {
    const intervalMillis = this.intervalSeconds * 1000;
    const parameters = new Map([
      ["intervalMillis", intervalMillis.toString()],
      ["url", this.url]
    ]);
    const paramString = Array.from(parameters)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const recordingId = uuid();
    ipcRenderer.send(
      "open-window",
      recordingId,
      WindowKind.RECORDING,
      paramString
    );
    ipcRenderer.send("close-connection-window");
  }

  public async testUrl(): Promise<boolean> {
    this.testingStatus = "testing";
    const result = await MetricsScraper.scrapeOne(this.url);

    if (result.isSuccessful) {
      this.testingStatus = "success";
      this.lastError = undefined;
      return true;
    } else {
      this.testingStatus = "fail";
      this.lastError = result.failureReason || "Request failed";
      this.showErrorTooltip();
      return false;
    }
  }

  private showErrorTooltip() {
    this.isErrorTooltipVisible = true;
    setTimeout(() => {
      this.isErrorTooltipVisible = false;
    }, 2000);
  }
}
</script>

<style scoped lang="scss">
@import "src/styles/theme.scss";
@import "src/styles/common.scss";

.prometheus-logo {
  height: 30px;
  padding-right: 10px;
}

.card-header {
  padding: 0.6rem 1.25rem;
  color: $gray-300;
}

.card-body {
  padding: 0.7rem 1.25rem;
}

.card-footer {
  padding: 0.3rem 1.25rem;
}

.connection-card {
  height: 100%;
  border: 0;
}

.bottom-button {
  padding: 10px;
  margin-left: 20px;
  min-width: 80px;
}

.info-container {
  display: flex;
  font-size: 75%;
  font-weight: 400;
  color: rgb(180, 180, 180);

  .icon-column {
    width: 20px;
  }
}

.input-group-text {
  background: #2e2e2e;
}
</style>
