import { v4 as uuid } from "uuid";

import { tsd } from "@/tsd/TimeSeriesDatabase";
import { MetricsScraper } from "./scraper/MetricsScraper";

export class RecordingSession {
    public readonly id: string;

    private intervalId: NodeJS.Timeout | null = null;

    constructor(
        private intervalMillis: number,
        private readonly url: string
    ) {
        this.id = uuid();
    }

    public start() {
        // first time record immidiatly
        this.scrape();
        // and then in interval
        this.intervalId = setInterval(async () => this.scrape(), this.intervalMillis);
    }

    public stop() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        } else {
            throw Error("Recording did not start. Cannot stop.");
        }
    }

    public setInterval(intervalMillis: number) {
        this.intervalMillis = intervalMillis;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(async () => this.scrape(), this.intervalMillis);
        }
    }

    public isRecording() {
        return this.intervalId !== null;
    }

    private async scrape() {
        const scrapeResult = await MetricsScraper.scrapeOne(this.url);
        if (scrapeResult.isSuccessful) {
            tsd.record(scrapeResult.time, scrapeResult.metricSets || []);
        } else {
            tsd.recordFailure(scrapeResult.failureReason);
        }
    }
}
