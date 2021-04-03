export enum PeriodType {
    CUSTOM = "Custom",
    LAST_1_MIN = "Last 1 minute",
    LAST_5_MIN = "Last 5 minutes",
    LAST_10_MIN = "Last 10 minutes",
    LAST_30_MIN = "Last 30 minutes",
    LAST_1_H = "Last 1 hour",
    LAST_3_H = "Last 3 hours",
    ALL = "All data"
}

const labels = new Map();
labels.set(PeriodType.CUSTOM, "CUSTOM");
labels.set(PeriodType.LAST_1_MIN, "LAST_1_MIN");
labels.set(PeriodType.LAST_5_MIN, "LAST_5_MIN");
labels.set(PeriodType.LAST_10_MIN, "LAST_10_MIN");
labels.set(PeriodType.LAST_30_MIN, "LAST_30_MIN");
labels.set(PeriodType.LAST_1_H, "LAST_1_H");
labels.set(PeriodType.LAST_3_H, "LAST_3_H");
labels.set(PeriodType.ALL, "ALL");

export const periodTypeLabels = labels;