import moment from "moment";

export class TimePeriod {
    constructor(
        /**
         * Start of custom period.
         */
        readonly start: moment.Moment | null,

        /**
         * End of custom period.
         */
        readonly end: moment.Moment  | null,
    ) { }
}