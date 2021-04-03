import moment from 'moment';

import { TimeEvent } from './TimeEvent'

export class TimeSeries {
    /**
     * Values of the time series.
     */
    private values: number[];
    
    /**
     * Time indices for each value located in the same position in the array.
     */
    private timeIndices: Date[];

    constructor(values?: number[], timeIndices?: Date[]) {
        this.values = values || [];
        this.timeIndices = timeIndices || [];
    }

    public getSize(): number {
        return this.timeIndices.length;
    }

    public getFirst(): TimeEvent {
        const size = this.getSize();
        if (size === 0) throw Error("Time series is empty.");
        return new TimeEvent(this.timeIndices[0], this.values[0]);
    }

    public getLast(): TimeEvent {
        const size = this.getSize();
        if (size === 0) throw Error("Time series is empty.");
        return new TimeEvent(this.timeIndices[size - 1], this.values[size - 1]);
    }

    public getEventList(): TimeEvent[] {
        const events: TimeEvent[] = [];
        for (let i = 0; i < this.timeIndices.length; i++) {
            events.push(new TimeEvent(this.timeIndices[i], this.values[i]));
        }
        return events;
    }

    public addEvent(event: TimeEvent): void {
        if (this.getSize() > 0) {
            const lastTime = this.timeIndices[this.timeIndices.length - 1];
            if (lastTime.getTime() > event.time.getTime()) {
                throw Error(`Attempt to add non chronological value to the time series. Last time: ${lastTime}. Current time: ${event.time}.`);
            }
        }
        this.values.push(event.value);
        this.timeIndices.push(event.time);
    }

    /**
     * Returns part of the time series within provided time period.
     */
    public slice(start?: Date, end?: Date): TimeSeries {
        if (this.getSize() < 3) return this;
        const leftIndex = start === undefined ? 0 : this.findTimeIndexLeft(start);
        const rightIndex = end === undefined ? this.getSize() - 1 : this.findTimeIndexRight(end);
        const newValues = this.values.slice(leftIndex, rightIndex + 1);
        const newTimeIndices = this.timeIndices.slice(leftIndex, rightIndex + 1);
        return new TimeSeries(newValues, newTimeIndices);
    }

    /**
     * Finds the closest index to the specified time in the time series
     * and returns index on the right.
     */
    public findTimeIndexRight(time: Date): number {
        const size = this.getSize();
        if (size === 0) throw Error("Time series is empty.");
        if (size === 1) return 0;
        if (size === 2) return 1; // return right point out of two

        const goal = time.getTime();
        const found = this.dihotomy(time)

        // found last point
        if (found === size - 1) { 
            return found; // return last point (right)
        }
        // found first point
        if (found === 0) {
            return found + 1;
        }
        const foundTime = this.timeIndices[found].getTime();
        return foundTime > goal ? found : found + 1;
    }

    /**
     * Finds the closest index to the specified time in the time series
     * and returns index on the left.
     */
    public findTimeIndexLeft(time: Date): number {
        const size = this.getSize();
        if (size === 0) throw Error("Time series is empty.");
        if (size === 1) return 0;
        if (size === 2) return 0; // return lest point out of two

        const goal = time.getTime();
        const found = this.dihotomy(time)

        // found last point
        if (found === size - 1) { 
            return found - 1; // return last point (right)
        }
        // found first point
        if (found === 0) {
            return found;
        }
        const foundTime = this.timeIndices[found].getTime();
        return foundTime < goal ? found : found - 1;
    }

    /**
     * Returns downsampled time series.
     */
    public downsample(windowSize: moment.Duration): TimeSeries {
        const size = this.getSize();
        if (size < 2) return this;

        const downsampledTs = new TimeSeries();

        let windowStart = this.timeIndices[0].getTime();
        let windowEnd = windowStart + windowSize.asMilliseconds();

        let currentWindowEvents: TimeEvent[] = [];

        for (let i = 0; i < size; i++) {
            const time = this.timeIndices[i];
            const value = this.values[i];
            
            if (time.getTime() <= windowEnd) {
                // current window
                currentWindowEvents.push(new TimeEvent(time, value));
            } else {
                // next window just started
                const meanEvent: TimeEvent | undefined = this.getMeanEvent(currentWindowEvents);
                if (meanEvent) {
                    downsampledTs.addEvent(meanEvent);
                }
                windowEnd = windowEnd + windowSize.asMilliseconds();
                currentWindowEvents = [new TimeEvent(time, value)];
            }
        }
        return downsampledTs;
    }

    private getMeanEvent(events: TimeEvent[]): TimeEvent | undefined {
        if (events.length === 0) return undefined;
        if (events.length === 1) return events[0];
        events.sort(event => event.value);
        const medianEvent = events[Math.floor(events.length / 2)];
        return medianEvent;
    }

    /**
     * Finds index neighboring (on right or left) specified time.
     */
    private dihotomy(time: Date): number {
        const goal = time.getTime();
        let first = 0;
        let last = this.timeIndices.length - 1;
        let mid = 0;
        while(first <= last) {
            mid = Math.floor((last + first) / 2);
            const midTime = this.timeIndices[mid].getTime();
            if (midTime > goal) {
                last = mid - 1;
            } else if (midTime < goal) {
                first = mid + 1;
            } else { // ==
                return mid;
            }
        }
        return mid;
    }
}
