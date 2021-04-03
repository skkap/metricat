import { Store } from "vuex";
import * as Actions from "../store/Actions"
import { MetricsState } from '@/store/MetricsState'

export class PeriodicUpdatePluginFactory {
    public static createPeriodicUpdatePlugin() {
        return (store: Store<MetricsState>) => {
            (function periodicUpdate() {
                store.dispatch(Actions.UPDATE_CHART);
                setTimeout(periodicUpdate, 1000);
            })();
        }
    }
}
