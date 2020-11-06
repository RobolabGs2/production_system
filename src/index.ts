import { fetchTxt } from "./http_helpers";
import "./style.scss"

class Rule {
    constructor(
        public readonly premises: string[],
        public readonly conslusion: string,
        public readonly origin: string) { }
    public applicable(facts: Set<string>): boolean {
        return this.premises.every((premise) => facts.has(premise));
    }
    public toString(withRaw = false, names?: Map<string, string>): string {
        return `${this.premises.map(x=>names?names.get(x):x).join(" + ")} -> ${names?names.get(this.conslusion):this.conslusion}` + (withRaw ? ` (${this.origin})` : "");
    }
}

Promise.all(
    ["Substances", "Chemistry"].
        map(x => `./resources/${x}.txt`).
        map(fetchTxt)
).then(([substances, reactions]) => {
    const facts = new Map<string, string>();
    const notFound = new Set<string>();
    substances.split('\n').
        filter(x => x.trim() != "").
        map(s => s.split(" -> ")).
        forEach(pair => facts.set(pair[0].trim(), pair[1].trim()));
    reactions.match(/[A-Za-zС0-9А-Яа-я()]+/g)?.forEach((substr) => {
        const name = facts.get(substr);
        if (!name) {
            notFound.add(substr);
            facts.set(substr, substr);
        }
    });
    const rules = reactions.split('\n').map(x => x.trim()).filter(x => x != "").map((rawRule) => {
        const [premises, conclusions] = rawRule.split(" -> ").map(x => x.split("+").map(x => x.trim()));
        return conclusions.map(c => new Rule(premises, c, rawRule));
    }).reduce((acc, x) => acc.concat(x), []);
    const output = document.createElement("article");
    const chooseItems = createFactsSelector(facts, (dir, initial, target) => {
        if (dir == Direction.Backward) { output.innerText = "Не реализовано"; return; }
        const result = dir == Direction.Forward ? ForwardDeduce(rules, initial, target) : undefined;
        if (result)
            output.innerText = result.map(r => r.toString(true, facts)).join("\n");
        else
            output.innerText = "Не выводимо";
    });
    output.innerText = rules.map(x => x.toString()).join("\n");
    document.querySelector("article")!.append(output, chooseItems);
    if (notFound.size)
        console.warn(Array.from(notFound.keys()).join("\n"));
});

function ForwardDeduce(rules: Rule[], initial: string[], target: string): Rule[] | undefined {
    const processed = new Array<Rule>();
    const unprocessed = new Set(rules);
    const conclusions = new Set(initial);
    while (!conclusions.has(target)) {
        const rule = Array.from(unprocessed.keys()).find(r => r.applicable(conclusions)&&!conclusions.has(r.conslusion));
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

// function BackwardDeduce(rules: Rule[], initial: string[], target: string): Rule[] | undefined {
//     const started = new Set<string>();
//     const finished = new Set<Rule>();
//     const facts = new Map<string, Rule|null>(initial.map(fact=>[fact, null]));
//     const elementsStack = [target];
//     while(elementsStack.length) {
//         const cur = elementsStack.pop()!;
//         if(facts.has(cur))
//             continue;
//         let next = Array.from(new Set(rules.filter(rule => rule.conslusion == cur).map(x => x.premises).reduce((acc, x) => acc.concat(x), []).filter(x=>!facts.has(x))))
//     }
// }

enum Direction { Forward, Backward }

function createFactsSelector(names: Map<string, string>, choosed: (dir: Direction, initialFacts: Array<string>, targetFact: string) => void) {
    const chooseItems = document.createElement("form");
    chooseItems.addEventListener("submit", (ev) => ev.preventDefault());
    const header = document.createElement("header");
    header.innerText = "Выберите факты"
    header.title = "(ЛКМ - как начальный факт, ПКМ - как искомый)";
    const items = document.createElement("article");
    items.classList.add("selectable-list");
    const initialInputs = new Array<HTMLInputElement>();
    const targetInputs = new Array<HTMLInputElement>();
    items.append(...Array.from(names.entries()).map(([id, name]) => {
        const line = document.createElement("section");
        line.classList.add('selectable-line');
        line.title = id;
        const isInitial = document.createElement("input");
        isInitial.value = id;
        isInitial.name = "isInitial";
        isInitial.type = "checkbox";
        const isTarget = document.createElement("input");
        isTarget.value = id;
        isTarget.name = "isTarget";
        isTarget.type = "radio";
        line.append(isInitial, name, isTarget);
        initialInputs.push(isInitial);
        targetInputs.push(isTarget);
        line.addEventListener("mouseup", (ev: MouseEvent) => {
            if (ev.target != line) return
            switch (ev.button) {
                case 0:
                    if (isInitial.checked = !isInitial.checked)
                        isTarget.checked = false;
                    break;
                case 2:
                    if (isTarget.checked = !isTarget.checked)
                        isInitial.checked = false;
                    break;
            }
        });
        line.addEventListener("contextmenu", (ev) => ev.preventDefault());
        return line;
    }));
    const createEvent = (dir: Direction) => {
        return (ev: MouseEvent) => {
            const targetFact = targetInputs.find((input) => input.checked);
            if (targetFact == null) {
                alert("Выберите целевой факт");
                return;
            }
            const initialFacts = initialInputs.filter((input) => input.checked);
            if (initialFacts.length == 0) {
                alert("Выберите начальные факты");
                return;
            }
            choosed(dir, initialFacts.map(i => i.value), targetFact.value);
        }
    }
    const footer = document.createElement("footer");
    footer.append(...[["Прямой", Direction.Forward], ["Обратный", Direction.Backward]].map(([name, dir]) => {
        const button = document.createElement("button");
        button.innerText = name as string;
        button.addEventListener("click", createEvent(dir as Direction));
        return button;
    }));
    chooseItems.append(header, items, footer);
    return chooseItems;
}
