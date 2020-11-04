export function must<T>(value: T|null|undefined): T {
    if (!value)
        throw new TypeError("Must");
    return value;
}