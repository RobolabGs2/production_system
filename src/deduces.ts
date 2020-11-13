export class Rule {
    constructor(
        public readonly premises: string[],
        public readonly conslusion: string,
        public readonly origin: string) { }
    public applicable(facts: Set<string>): boolean {
        return this.premises.every((premise) => facts.has(premise));
    }
}

export function ForwardDeduce(rules: Rule[], initial: string[], target: string): Rule[] | undefined {
    const processed = new Array<Rule>();
    const unprocessed = new Set(rules);
    const agenta = new Set(initial);
    while (!agenta.has(target)) {
        const rule = Array.from(unprocessed.keys()).find(r => r.applicable(agenta) && !agenta.has(r.conslusion));
        if (!rule) {
            return undefined;
        }
        processed.push(rule);
        unprocessed.delete(rule);
        agenta.add(rule.conslusion);
    }
    return processed;
}

export function BackwardDeduce(rules: Rule[], initial: string[], target: string): Rule[] | undefined {
    const agenta = new Map<string, Rule|null>(initial.map(f=>[f, null]));
    return backwardDeduce(rules, agenta, target) ? restoreResult(agenta, target) : undefined;
}

function restoreResult(agenta: Map<string, Rule|null>, target: string, cache = new Set<string>()): Rule[] {
    const rule = agenta.get(target);
    if(!rule || cache.has(target))
        return [];
    cache.add(target);
    return rule.premises.map(p=>restoreResult(agenta, p, cache)).reduce((acc, x) => acc.concat(x), []).concat([rule]);
}

function backwardDeduce(rules: Rule[], agenta: Map<string, Rule|null>, target: string, search: Set<string> = new Set()): boolean {
    if (agenta.has(target))
        return true;
    if (search.has(target))
        return false;
    search.add(target);
    const candidates = rules.filter(rule => rule.conslusion === target);
    nextRule: for (let i = 0; i < candidates.length; i++) {
        const candidateRule = candidates[i];
        for (let j = 0; j < candidateRule.premises.length; j++) {
            if (!backwardDeduce(rules, agenta, candidateRule.premises[j], search)) {
                continue nextRule;
            }
        }
        agenta.set(target, candidateRule);
        search.delete(target);
        return true;
    }
    search.delete(target);
    return false;
}
