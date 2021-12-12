import { BackwardDeduce, ForwardDeduce, Rule } from "./deduces";
import { createFactsSelector, Direction } from "./facts_selector";
import { fetchTxt } from "./http_helpers";
import "./style.scss"

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
    rules.sort((a, b)=>a.premises.length-b.premises.length);
    const styleSheet = document.createElement("style");
    document.body.appendChild(styleSheet);
    const outputArticle = document.createElement("article");
    const output = document.createElement("article");
    const outputHeader = document.createElement("header");
    const outputFooter = document.createElement("section");
    const footer = document.createElement("footer");
    const seeRules = document.createElement("button");
    seeRules.textContent = "Все правила";
    seeRules.addEventListener("click", () => printRules(facts, rules, output, outputFooter, styleSheet))
    footer.append(outputFooter, seeRules);
    outputHeader.textContent = "Вывод:";
    outputArticle.append(outputHeader, output, footer)
    outputArticle.id = "output";
    const chooseItems = createFactsSelector(facts, (dir, initial, target) => {
        try {
            output.innerHTML = "";
            const result = dir == Direction.Forward ? ForwardDeduce(rules, initial, target) : BackwardDeduce(rules, initial, target);
            if (result)
                printRules(facts, result, output, outputFooter, styleSheet, new Set(initial));
            else
                outputFooter.textContent = "Не выводимо";
        } catch (e) {
            outputFooter.textContent = e as any;
        }
    });
    output.innerHTML = `<div style="text-align: center;">Справа можно выбрать начальные факты и конечный факт (с помощью чекбоксов или ЛКМ и ПКМ по строчке).<div>`;
    document.querySelector("article")!.append(outputArticle, chooseItems);
});

function printRules(facts: Map<string, string>, result: Rule[], output: HTMLElement, outputFooter: HTMLElement, styleSheet: HTMLStyleElement, initialSet?: Set<string>) {
    output.innerHTML = "";
    const factToSpan = (factId: string) => {
        const wrapper = document.createElement("span");
        wrapper.textContent = facts.get(factId)!;
        const serializedId = factId.replace(/[)(]/g, '_')
        wrapper.classList.add(serializedId);
        if (initialSet?.has(factId)) wrapper.classList.add("initial-fact");
        wrapper.addEventListener("mouseenter", () => styleSheet.textContent = `.${serializedId} { background-color: #383a42; font-weight: 700; } .reaction > .${serializedId} { outline: dashed 2px lime; }`);
        // wrapper.addEventListener("mouseleave", () => { if (styleSheet.textContent?.match(serializedId)) styleSheet.textContent = ""; });
        return wrapper;
    }
    output.append(...result.map(r => {
        const reaction = document.createElement("div");
        reaction.title = r.origin;
        reaction.classList.add("reaction");
        reaction.append(...r.premises.map(factToSpan).reduce((acc, next) => acc.length ? acc.concat(" + ", next) : [next], new Array<Node | string>()))
        reaction.append(" → ", factToSpan(r.conslusion))
        reaction.classList.add(r.conslusion.replace(/[)(]/g, '_'));
        return reaction;
    }))
    outputFooter.textContent = `Правил: ${result.length}`
}