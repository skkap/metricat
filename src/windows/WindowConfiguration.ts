import { BrowserWindow } from 'electron'

export class WindowConfiguration {
    readonly title: string
    readonly width: number
    readonly height: number
    readonly path: string
    readonly confirmClosing: boolean
    readonly confirmClosingString?: string
    readonly resizable?: boolean

    constructor({
        title,
        width,
        height,
        path,
        confirmClosing,
        confirmClosingString = undefined,
        resizable = true
    }: {
        readonly title: string,
        readonly width: number,
        readonly height: number,
        readonly path: string,
        readonly confirmClosing: boolean,
        readonly confirmClosingString?: string,
        readonly resizable?: boolean
    }
    ) {
        this.title = title
        this.width = width
        this.height = height
        this.path = path
        this.confirmClosing = confirmClosing
        this.confirmClosingString = confirmClosingString
        this.resizable = resizable
    }
}

export enum WindowKind {
    CONNECTION,
    RECORDING
}

export const windowConfigurations: Map<WindowKind, WindowConfiguration> = new Map([
    [WindowKind.CONNECTION, new WindowConfiguration({
        title: "New recording - Metricat",
        width: 500,
        height: 340,
        path: "connection",
        confirmClosing: false,
        resizable: false
    })],
    [WindowKind.RECORDING, new WindowConfiguration({
        title: "Recording - Metricat",
        width: 1000,
        height: 800,
        path: "recording",
        confirmClosing: true,
        confirmClosingString: "All redording data will be lost if you close the recording session.\nAre you sure you want to close?"
    })]
])

export class WindowInstance {
    readonly id: string
    readonly windowKind: WindowKind
    readonly instance: BrowserWindow

    constructor({
        id,
        windowKind,
        instance
    }: {
        readonly id: string,
        readonly windowKind: WindowKind,
        readonly instance: BrowserWindow
    }
    ) {
        this.id = id
        this.windowKind = windowKind
        this.instance = instance
    }
}
