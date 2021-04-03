export class ColorSource {
    private currentColor: number = 0
    private readonly colors: string[] = [
        "#2080F7",
        "#f6c2c2",
        "#4b3ecf",
        "#e7b293",
        "#74d2b3",
        "#9966cc",
        "#61b8d2",
        "#bada55",
        "#40e0d0",
        "#fff68f",
        "#ccff00",
        "#a6b3fc",
        "#6551fd",
        "#a0d390",
        "#f7cac9",
        "#92a8d1",
        "#955251",
        "#b565a7",
        "#009b77",
        "#dd4124",
        "#d65076",
        "#45b8ac",
        "#efc050",
        "#5b5ea6",
        "#9b2335",
        "#dfcfbe",
        "#55b4b0",
        "#e15d44",
        "#7fcdcd",
        "#bc243c",
        "#c3447a",
        "#98b4d4",
        "#ff6f61",
        "#f5d6c6",
        "#fa9a85",
        "#ce5b78",
        "#e08119",
        "#577284",
        "#f96714",
        "#264e36"
    ];

    public getNextColor(): string {
        if (this.currentColor >= this.colors.length) return "#000";
        const color = this.colors[this.currentColor];
        this.currentColor++;
        return color;
    }
}
