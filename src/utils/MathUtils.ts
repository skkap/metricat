export function round(value, decimals): number {
    const num: any = value + "e" + decimals;
    return Number(Math.round(num) + "e-" + decimals);
}
