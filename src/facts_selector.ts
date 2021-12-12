import { ClickableSVGButton, SVGPictures } from "./svg";

export enum Direction { Forward, Backward }

export function createFactsSelector(names: Map<string, string>, choosed: (dir: Direction, initialFacts: Array<string>, targetFact: string) => void) {
    const chooseItems = document.createElement("form");
    chooseItems.addEventListener("submit", (ev) => ev.preventDefault());
    const header = document.createElement("header");
    header.innerText = "Факты"
    header.title = "(ЛКМ - как начальный факт, ПКМ - как искомый)";
    const items = document.createElement("article");
    items.classList.add("selectable-list");
    const initialInputs = new Array<HTMLInputElement>();
    const targetInputs = new Array<HTMLInputElement>();
    new ClickableSVGButton(header, SVGPictures.Delete, () => Array<HTMLInputElement>().concat(initialInputs, targetInputs).forEach(input => input.checked = false))
    items.append(...Array.from(names.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => {
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
            const initialFactsIds = initialFacts.map(i => i.value);
            const targetFactId = targetFact.value;
            const jsonSnapshot = JSON.stringify({ initial: initialFactsIds, target: targetFactId });
            console.log(jsonSnapshot)
            window.localStorage.setItem("last", jsonSnapshot)
            const url = new URL(window.location.href)
            url.searchParams.set("data", utf8_to_b64(jsonSnapshot))
            history.pushState(null, "", url.toString())
            choosed(dir, initialFactsIds, targetFactId);
        }
    }
    fetchLocalStorage("last").then(({ initial, target }: { initial: string[], target: string }) => {
        const savedInitial = new Set(initial);
        initialInputs.filter(f => savedInitial.has(f.value)).forEach(input => input.checked = true);
        targetInputs.filter(f => f.value === target).forEach(input => input.checked = true);
    })
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

function fetchLocalStorage(key: string): Promise<any> {
    return new Promise(function (resolve, reject) {
        const url = new URL(window.location.href)
        const param = url.searchParams.get("data")
        if(param) {
            try {
                const json = b64_to_utf8(param)
                console.log(json)
                return resolve(JSON.parse(json))
            } catch(e) {
                console.log(e)
            }
        }
        const value = window.localStorage.getItem(key);
        if (value)
            resolve(JSON.parse(value));
    });
}

function utf8_to_b64(str: string): string {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str: string): string {
	return decodeURIComponent(escape(window.atob(str)));
}