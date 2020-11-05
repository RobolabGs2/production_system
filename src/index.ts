import { fetchTxt } from "./http_helpers";
import "./style.scss"

console.log("Hello world");
document.querySelector("header")!.innerText = "Hello world!";

Promise.all(
    ["Substances", "Chemistry"].
        map(x => `/resources/${x}.txt`).
        map(fetchTxt)
).then(([substances, reactions]) => {
    const names = new Map<string, string>();
    const notFound = new Set<string>();
    substances.split('\n').
        filter(x => x.trim() != "").
        map(s => s.split(" -> ")).
        forEach(pair => names.set(pair[0].trim(), pair[1].trim()));
    document.querySelector("section")!.innerText = reactions.replace(/[A-Za-zС0-9()]+/g, (substr) => {
        const name = names.get(substr);
        if (!name) notFound.add(substr);
        return name ? name : substr;
    }
    );
    console.log(Array.from(notFound.keys()).join("\n"));
});