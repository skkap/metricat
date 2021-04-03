import ua from "universal-analytics";
import { v4 as uuid } from "uuid";
import { JSONStorage } from "node-localstorage";

export class Tracking {
    private readonly GA_CODE: string = "UA-164284389-2";
    private readonly CLIENT_ID_KEY: string = "clientId";
    private clientId: string;
    private visitor;

    constructor(userDataPath: string, appVersion: String) {
        const nodeStorage = new JSONStorage(userDataPath);
        this.clientId = nodeStorage.getItem(this.CLIENT_ID_KEY) || uuid();
        this.visitor = ua(this.GA_CODE, this.clientId);
        this.visitor.set("ds", "app"); // set data source to "app"
        const appVersionString = "metricat-" + appVersion;
        console.log(`Client ID: ${this.clientId}. Version: ${appVersionString}`);
        this.visitor.set("ua", appVersionString);
        nodeStorage.setItem(this.CLIENT_ID_KEY, this.clientId);
    }

    public pageView(page: string) {
        this.visitor.pageview(page).send();
    }

    public timing(category: string, variable: string, durationMillis: number) {
        this.visitor.timing(category, variable, durationMillis).send();
    }
}
