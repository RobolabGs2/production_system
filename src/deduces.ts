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
    if(backwardDeduce(rules, agenta, target)) {
        let result = new Array<Rule>();
        let stack = [target];
        let founded = new Set<string>(initial);
        for(;stack.length;) {
            let top = stack.pop()!;
            let rule = agenta.get(top);
            if(!rule)
                continue;
            result.push(rule);
            founded.add(top);
            const next = rule.premises.filter(x => !founded.has(x));
            next.forEach(x=>founded.add(x));
            stack.push(...next);
        }
        return result.reverse();
    }
    return;
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
