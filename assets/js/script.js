class Libro {
    letto = false;
    constructor(titolo, autore, anno) {
        this.titolo = titolo;
        this.autore = autore;
        this.anno = anno;
        this.id = crypto.randomUUID();
    }
    segnaComeLetto() {
        this.letto = true;
    }
    formato() {
        return "cartaceo";
    }

    static fromJSON(d) {
        return Object.assign(new this(d.titolo, d.autore, d.anno), d);
    }

    static daStringa(s) {
        const [titolo, autore, anno] = s.split("|");
        return new Libro(titolo, autore, Number(anno));
    }
}

class LibroDigitale extends Libro {
    constructor(titolo, autore, anno, dimensioneMb) {
        super(titolo, autore, anno);
        this.dimensioneMb = dimensioneMb;
    }
    formato() {
        return `digitale (${this.dimensioneMb} MB)`;
    }
}

class LibroAudio extends Libro {
    constructor(titolo, autore, anno, durataMinuti) {
        super(titolo, autore, anno);
        this.durataMinuti = durataMinuti;
    }
    formato() {
        return `audio (${this.durataMinuti} min)`;
    }
}

const STORAGE_KEY = "libri";

let libri = caricaLibri();

let filtroAttivo = "tutti";

function salvaLibri() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

function caricaLibri() {
    const dati = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return dati.map(d => {
        if (d.dimensioneMb !== undefined) return LibroDigitale.fromJSON(d);
        if (d.durataMinuti !== undefined) return LibroAudio.fromJSON(d);
        return Libro.fromJSON(d);
    });
}

function renderLibri() {
    const visibili = libri.filter(l => {
        if (filtroAttivo === "letti") return l.letto;
        if (filtroAttivo === "da-leggere") return !l.letto;
        return true;
    });

    const righe = visibili.map(libro => {
        const li = document.createElement("li");
        if (libro.letto) li.classList.add("letto");
        li.dataset.id = libro.id;

        const divBox = document.createElement("div");
        divBox.className = "info";
        li.appendChild(divBox);

        const spanTitolo = document.createElement("span");
        spanTitolo.className = "titolo";
        spanTitolo.textContent = libro.titolo;
        divBox.appendChild(spanTitolo)

        const spanBadge = document.createElement("span");
        spanBadge.className = "badge";
        spanBadge.textContent = libro.formato();
        divBox.appendChild(spanBadge);

        const spanMeta = document.createElement("span");
        spanMeta.className = "meta";
        spanMeta.textContent = libro.autore + " - " + libro.anno;
        divBox.appendChild(spanMeta);

        const azioni = document.createElement("div");
        azioni.className = "azioni";
        if (libro.letto) {
            const testo = document.createElement("span");
            testo.textContent = "✓ letto";
            azioni.appendChild(testo);
        } else {
            const button = document.createElement("button");
            button.textContent = "Segna come letto";
            button.dataset.azione = "leggi";
            azioni.appendChild(button);
        }

        const bottoneRimuovi = document.createElement("button");
        bottoneRimuovi.textContent = "Rimuovi";
        bottoneRimuovi.dataset.azione = "rimuovi";
        azioni.appendChild(bottoneRimuovi);

        li.appendChild(azioni);

        return li;
    });

    document.getElementById("lista-libri").replaceChildren(...righe);

    document.getElementById("contatore").textContent = libri.length;
}

const selectFormato = document.getElementById("formato");
const divCampo = document.getElementById("campo-dimensione");

const divDurata = document.getElementById("campo-durata");

selectFormato.addEventListener("change", (e) => {
    divCampo.hidden = e.target.value !== "digitale";

    divDurata.hidden = e.target.value !== "audio";
});

const form = document.getElementById("aggiungi-libro");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dati = Object.fromEntries(new FormData(e.target));

    let nuovo;
    if (dati.formato === "digitale") {
        nuovo = new LibroDigitale(dati.titolo, dati.autore, Number(dati.anno), Number(dati.dimensione));
    } else if (dati.formato === "audio") {
        nuovo = new LibroAudio(dati.titolo, dati.autore, Number(dati.anno), Number(dati.durata));
    } else {
        nuovo = new Libro(dati.titolo, dati.autore, Number(dati.anno));
    }
    libri.push(nuovo);
    salvaLibri();
    renderLibri();
    e.target.reset();
    divCampo.hidden = true;

    divDurata.hidden = true;
});

const listaLibri = document.getElementById("lista-libri");

listaLibri.addEventListener("click", (e) => {
    const bottone = e.target.closest("button[data-azione]");
    if (!bottone) return;

    const id = bottone.closest("li").dataset.id;

    if (bottone.dataset.azione === "leggi") {
        const libro = libri.find(l => l.id === id);
        libro.segnaComeLetto();
    }

    if (bottone.dataset.azione === "rimuovi") {
        libri = libri.filter(l => l.id !== id);
    }

    salvaLibri();
    renderLibri();
});

document.getElementById("svuota-tutto").addEventListener("click", () => {
    libri = [];
    localStorage.removeItem(STORAGE_KEY);
    renderLibri();
});

document.getElementById("esporta").addEventListener("click", () => {
    window.open("data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(libri, null, 2)));
});

document.getElementById("filtri").addEventListener("click", (e) => {
    const bottone = e.target.closest("button[data-filtro]");
    if (!bottone) return;

    filtroAttivo = bottone.dataset.filtro;
    document.querySelectorAll("#filtri button").forEach(b => {
        b.classList.toggle("attivo", b === bottone);
    });
    renderLibri();
});

document.getElementById("ordina").addEventListener("change", (e) => {
    if (e.target.value === "titolo") {
        libri.sort((a, b) => a.titolo.localeCompare(b.titolo));
    } else if (e.target.value === "anno") {
        libri.sort((a, b) => a.anno - b.anno);
    }
    salvaLibri();
    renderLibri();
});

const inputCerca = document.getElementById("cerca");
const spinner = document.getElementById("spinner");
const boxErrore = document.getElementById("errore");
const listaRisultati = document.getElementById("risultati");

function mostraSpinner() {
    spinner.hidden = false;
    boxErrore.hidden = true;
}

function nascondiSpinner() {
    spinner.hidden = true;
}

function mostraErrore(msg) {
    boxErrore.textContent = msg;
    boxErrore.hidden = false;
}

let controller;
let timeoutId;

function cerca(query) {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    mostraSpinner();

    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", 10);

    fetch(url, { signal })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(dati => renderRisultati(dati.docs))
        .catch(err => {
            if (err.name === "AbortError") return;
            mostraErrore("Ricerca non riuscita: " + err.message);
        })
        .finally(() => {
            if (!signal.aborted) nascondiSpinner();
        });
}

function renderRisultati(docs) {
    const conAutore = docs.filter(d => d.author_name);

    if (conAutore.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nessun risultato.";
        listaRisultati.replaceChildren(li);
        return;
    }

    const righe = conAutore.map(d => {
        const autore = d.author_name?.[0] ?? "Autore sconosciuto";
        const anno = d.first_publish_year ?? "?";

        const li = document.createElement("li");

        const info = document.createElement("div");
        info.className = "info";

        const spanTitolo = document.createElement("span");
        spanTitolo.className = "titolo";
        spanTitolo.textContent = d.title;
        info.appendChild(spanTitolo);

        const spanMeta = document.createElement("span");
        spanMeta.className = "meta";
        spanMeta.textContent = autore + " - " + anno;
        info.appendChild(spanMeta);

        li.appendChild(info);

        const bottoni = document.createElement("div");
        bottoni.className = "bottoni";

        const bottone = document.createElement("button");
        bottone.textContent = "Aggiungi";
        bottone.dataset.titolo = d.title;
        bottone.dataset.autore = autore;
        bottone.dataset.anno = anno;
        bottoni.appendChild(bottone);

        const bottoneDettagli = document.createElement("button");
        bottoneDettagli.textContent = "Dettagli";
        bottoneDettagli.dataset.key = d.key;
        bottoni.appendChild(bottoneDettagli);

        li.appendChild(bottoni);

        return li;
    });

    listaRisultati.replaceChildren(...righe);
}

inputCerca.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    localStorage.setItem("ultimaQuery", query);

    clearTimeout(timeoutId);

    if (query.length < 3) {
        controller?.abort();
        nascondiSpinner();
        listaRisultati.innerHTML = "";
        return;
    }

    timeoutId = setTimeout(() => cerca(query), 400);
});

listaRisultati.addEventListener("click", (e) => {
    const bottoneDettagli = e.target.closest("button[data-key]");
    if (bottoneDettagli) {
        fetch(`https://openlibrary.org${bottoneDettagli.dataset.key}.json`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                const desc = typeof d.description === "string" ? d.description : d.description?.value;
                alert(desc ?? "nessuna descrizione");
            })
            .catch(err => mostraErrore("Dettagli non disponibili: " + err.message));
        return;
    }

    const bottone = e.target.closest("button[data-titolo]");
    if (!bottone) return;

    const { titolo, autore, anno } = bottone.dataset;
    libri.push(new Libro(titolo, autore, Number(anno) || 0));
    salvaLibri();
    renderLibri();

    bottone.textContent = "✓ Aggiunto";
    bottone.disabled = true;
});

const querySalvata = localStorage.getItem("ultimaQuery");
if (querySalvata) {
    inputCerca.value = querySalvata;
    if (querySalvata.length >= 3) cerca(querySalvata);
}

renderLibri();

console.log(Libro.daStringa("1984|Orwell|1949"));

