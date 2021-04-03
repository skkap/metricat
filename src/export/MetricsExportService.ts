import * as jetpack from "fs-jetpack";
import { dialog, SaveDialogReturnValue, BrowserWindow } from "electron";

import { MetricData } from "@/models/MetricData";

export class MetricsExportService {
    public async record(
        currentWindow: BrowserWindow,
        metricData: MetricData[]
    ): Promise<void> {
        const dialogResult = await this.getSaveFilePath(currentWindow);
        if (!dialogResult.canceled && dialogResult.filePath != undefined) {
            const aggregatedData = this.aggregateMetricsByTime(metricData);
            const csvStrings: string[] = [];

            // add title string
            const csvTitle: string[] = [];
            csvTitle.push("Timestamp");
            aggregatedData.metricsSet.forEach(metricName => csvTitle.push(metricName));
            csvStrings.push(csvTitle.join(","));

            // add data
            aggregatedData.timeMap.forEach((metricValues, time) => {
                const csvStringValues: string[] = [];
                csvStringValues.push(`"${time}"`);
                aggregatedData.metricsSet.forEach(metricName => {
                    const value = metricValues.get(metricName);
                    if (value) {
                        csvStringValues.push(value.toString());
                    } else {
                        csvStringValues.push("");
                    }
                });
                csvStrings.push(csvStringValues.join(","));
            });
            const csvData = csvStrings.join("\n");
            return await jetpack.writeAsync(dialogResult.filePath, csvData);
        }
    }

    private async getSaveFilePath(currentWindow: BrowserWindow): Promise<SaveDialogReturnValue> {
        let options = {
            title: "Export metric data",
            filters: [
                { name: ".csv files", extensions: ["csv"] },
                { name: "All files", extensions: ["*"] }
            ]
        };
        return await dialog.showSaveDialog(currentWindow, options);
    }

    private aggregateMetricsByTime(metricData: MetricData[]) {
        const timeMap: Map<string, Map<string, number>> = new Map();
        const metricsSet: Set<string> = new Set();

        metricData.forEach(data => {
            metricsSet.add(data.metricKey);
            data.metricSeries.forEach(series => {
                const timestamp = series.time.toISOString();
                const metricsForTime = timeMap.get(timestamp);
                if (metricsForTime === undefined) {
                    const newMetricMap: Map<string, number> = new Map();
                    newMetricMap.set(data.metricKey, series.value);
                    timeMap.set(timestamp, newMetricMap)
                } else {
                    metricsForTime.set(data.metricKey, series.value);
                }
            });
        });

        return {
            timeMap: timeMap,
            metricsSet: metricsSet
        };
    }
}
