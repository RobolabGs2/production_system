import { fetchTxt } from "./http_helpers";
import "./style.scss"

Promise.all(
    ["Substances", "Chemistry"].
        map(x => `./resources/${x}.txt`).
        map(fetchTxt)
).then(([substances, reactions]) => {
    const names = new Map<string, string>();
    const notFound = new Set<string>();
    substances.split('\n').
        filter(x => x.trim() != "").
        map(s => s.split(" -> ")).
        forEach(pair => names.set(pair[0].trim(), pair[1].trim()));
    reactions.match(/[A-Za-zС0-9()]+/g)?.forEach((substr) => {
        const name = names.get(substr);
        if (!name) {
            notFound.add(substr);
            names.set(substr, substr);
        }
        // return name ? name : substr;
    });
    document.querySelector("article")!.innerHTML = `<form>${Array.from(names.entries()).map(([id, name]) => {
        return `<label><input type="checkbox" name="facts" value="${id}"/>${name}</label>`
    }).join("\n")}</form>`;
    console.log(Array.from(notFound.keys()).join("\n"));
});