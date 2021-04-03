import moment from 'moment';
import { PeriodType } from '@/models/PeriodType';
import { TimePeriod } from '@/models/TimePeriod';
import { TimeSeries } from './model/TimeSeries';

export class TimeSeriesUtils {
    private static readonly MINIMUM_EVENTS_TO_DOWNSAMPLE: number = 120;

    private static readonly PERIODS = [
        moment.duration(1, "s"),
        moment.duration(5, "s"),
        moment.duration(10, "s"),
        moment.duration(30, "s"),
        moment.duration(1, "minute"),
        moment.duration(5, "minute"),
        moment.duration(10, "minute"),
        moment.duration(30, "minute"),
        moment.duration(1, "hour"),
        moment.duration(6, "hour"),
        moment.duration(12, "hour"),
        moment.duration(1, "day"),
        moment.duration(5, "day"),
        moment.duration(10, "day"),
        moment.duration(20, "day"),
        moment.duration(1, "month")
    ]

    public static sliceAndDownsample(timeSeries: TimeSeries, start?: Date, end?: Date): TimeSeries {
        const periodData = timeSeries.slice(start, end);

        if (periodData.getSize() <= this.MINIMUM_EVENTS_TO_DOWNSAMPLE) {
            return periodData;
        }

        const windowSize: moment.Duration = this.getDownscaleBatchDuration(
            periodData.getFirst().time,
            periodData.getLast().time
        );
        return periodData.downsample(windowSize);
    }

    private static getDownscaleBatchDuration(start: Date, end: Date): moment.Duration {
        var diffInMs = Math.abs(start.getTime() - end.getTime());
        for (let i = 0; i < this.PERIODS.length; i++) {
            const period = this.PERIODS[i];
            if (diffInMs / period.asMilliseconds() <= this.MINIMUM_EVENTS_TO_DOWNSAMPLE) {
                return period;
            }
        }
        return moment.duration(1, "month");
    }

    public static getPeriodFromType(periodType: PeriodType, lastPeriod: TimePeriod): TimePeriod {
        let startTime: moment.Moment | null;
        let endTime: moment.Moment | null;
        switch (periodType) {
            case PeriodType.CUSTOM:
                startTime = lastPeriod.start;
                endTime = lastPeriod.end;
                break;
            case PeriodType.LAST_1_MIN:
                startTime = moment().subtract(1, 'minutes');
                endTime = moment();
                break;
            case PeriodType.LAST_5_MIN:
                startTime = moment().subtract(5, 'minutes');
                endTime = moment();
                break;
            case PeriodType.LAST_10_MIN:
                startTime = moment().subtract(10, 'minutes');
                endTime = moment();
                break;
            case PeriodType.LAST_30_MIN:
                startTime = moment().subtract(30, 'minutes');
                endTime = moment();
                break;
            case PeriodType.LAST_1_H:
                startTime = moment().subtract(1, 'hours');
                endTime = moment();
                break;
            case PeriodType.LAST_3_H:
                startTime = moment().subtract(3, 'hours');
                endTime = moment();
                break;
            default:
            case PeriodType.ALL:
                startTime = null;
                endTime = null;
                break;
        }
        return new TimePeriod(startTime, endTime);
    }
}
