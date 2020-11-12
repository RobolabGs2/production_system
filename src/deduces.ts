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
    const conclusions = new Set(initial);
    while (!conclusions.has(target)) {
        const rule = Array.from(unprocessed.keys()).find(r => r.applicable(conclusions) && !conclusions.has(r.conslusion));
        if (!rule) {
            return undefined;
        }
        processed.push(rule);
        unprocessed.delete(rule);
        conclusions.add(rule.conslusion);
    }
    return processed;
}

// function BackwardDeduce(rules: Rule[], initial: string[], target: string): Rule[] | undefined {
//     const processed = new Array<Rule>();
//     const unprocessed = new Set(rules);
//     const conclusions = new Set(initial);
//     class TreeNode {constructor(public readonly fact: string, public readonly rule: Rule, public readonly parent?: TreeNode){}}
//     const buffer = rules.filter(r => r.conslusion == target).map(r => new TreeNode(target, r));
//     while (buffer.length) {
//         const current = buffer.shift();
//         buffer.push(...Array.from(unprocessed.keys()).filter(r => r.conslusion === current?.fact).map());
//         processed.push(rule);
//         unprocessed.delete(rule);
//         conclusions.add(rule.conslusion);
//     }
//     return processed;
// }

export function BackwardDeduce(rules: Rule[], initial: Set<string>, target: string): Rule[] | undefined {
    if (initial.has(target)) {
        return [];
    }
    const candidates = rules.filter(rule => rule.conslusion === target);
    nextRule: for (let i = 0; i < candidates.length; i++) {
        const candidateRule = candidates[i];
        let answer = [candidateRule];
        for (let j = 0; j < candidateRule.premises.length; j++) {
            const partialAnsw = BackwardDeduce(rules, initial, candidateRule.premises[j]);
            if (partialAnsw === undefined) {
                continue nextRule;
            }
            answer = partialAnsw.concat(answer);
        }
        return answer;
    }
    return;
}