// Mini-libreria — Settimana VII Giorno I
//
// Devi fare 4 cose:
// 1. Definire una classe Libro (titolo, autore, anno, letto)
// 2. Definire una classe LibroDigitale che estende Libro (aggiunge formato, dimensioneMb)
// 3. Aggiungere un listener al form che crea una nuova istanza e la aggiunge all'array
// 4. Renderizzare la lista nel <ul id="lista-libri"> via innerHTML
//
// Bonus: bottone "Segna come letto" su ogni elemento, gestito con event delegation.


// === Classi ===

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

    /*-------------------- EXTRA 17: static daStringa --------------------*/
    static daStringa(s) {
        const [titolo, autore, anno] = s.split("|");
        return new Libro(titolo, autore, Number(anno));
    }
    /*-------------------- FINE EXTRA 17 --------------------*/
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

/*-------------------- EXTRA 15: classe LibroAudio --------------------*/
class LibroAudio extends Libro {
    constructor(titolo, autore, anno, durataMinuti) {
        super(titolo, autore, anno);
        this.durataMinuti = durataMinuti;
    }
    formato() {
        return `audio (${this.durataMinuti} min)`;
    }
}
/*-------- FINE EXTRA 15 ----------*/

const STORAGE_KEY = "libri";

// === Stato (array di libri) ===

/*----- EXTRA 16: let al posto di const (per riassegnare con filter) ---------*/

let libri = caricaLibri();
/*------- FINE EXTRA 16 ----------*/

/*-------------------- EXTRA W7D2-17: filtro letti / da leggere --------------------*/
let filtroAttivo = "tutti";
/*-------------------- FINE EXTRA W7D2-17 --------------------*/

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

// === Render ===

function renderLibri() {

    /*-------------------- EXTRA W7D2-17: filtro --------------------*/
    const visibili = libri.filter(l => {
        if (filtroAttivo === "letti") return l.letto;
        if (filtroAttivo === "da-leggere") return !l.letto;
        return true;
    });
    /*-------------------- FINE EXTRA W7D2-17 --------------------*/

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

        /*-------------------- EXTRA 16: bottone Rimuovi --------------------*/
        const bottoneRimuovi = document.createElement("button");
        bottoneRimuovi.textContent = "Rimuovi";
        bottoneRimuovi.dataset.azione = "rimuovi";
        azioni.appendChild(bottoneRimuovi);
        /*-------------------- FINE EXTRA 16 --------------------*/

        li.appendChild(azioni);

        return li;
    });

    document.getElementById("lista-libri").replaceChildren(...righe);

    document.getElementById("contatore").textContent = libri.length;
}

// === Eventi ===

const selectFormato = document.getElementById("formato");
const divCampo = document.getElementById("campo-dimensione");

/*-------------------- EXTRA 15: campo durata per l'audio --------------------*/
const divDurata = document.getElementById("campo-durata");
/*-------------------- FINE EXTRA 15 --------------------*/

selectFormato.addEventListener("change", (e) => {
    divCampo.hidden = e.target.value !== "digitale";
    /*-------------------- EXTRA 15 --------------------*/
    divDurata.hidden = e.target.value !== "audio";
    /*-------------------- FINE EXTRA 15 --------------------*/
});

const form = document.getElementById("aggiungi-libro");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dati = Object.fromEntries(new FormData(e.target));

    let nuovo;
    if (dati.formato === "digitale") {
        nuovo = new LibroDigitale(dati.titolo, dati.autore, Number(dati.anno), Number(dati.dimensione));

        /*-------------------- EXTRA 15: caso audio --------------------*/
    } else if (dati.formato === "audio") {
        nuovo = new LibroAudio(dati.titolo, dati.autore, Number(dati.anno), Number(dati.durata));
        /*-------------------- FINE EXTRA 15 --------------------*/
    } else {
        nuovo = new Libro(dati.titolo, dati.autore, Number(dati.anno));
    }
    libri.push(nuovo);
    salvaLibri();
    renderLibri();
    e.target.reset();
    divCampo.hidden = true;
    /*-------------------- EXTRA 15 --------------------*/
    divDurata.hidden = true;
    /*-------------------- FINE EXTRA 15 --------------------*/
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

    /*-------------------- EXTRA 16: azione rimuovi con filter --------------------*/
    if (bottone.dataset.azione === "rimuovi") {
        libri = libri.filter(l => l.id !== id);
    }
    /*-------------------- FINE EXTRA 16 --------------------*/

    salvaLibri();
    renderLibri();
});

document.getElementById("svuota-tutto").addEventListener("click", () => {
    libri = [];
    localStorage.removeItem(STORAGE_KEY);
    renderLibri();
});

/*-------------------- EXTRA W7D2-16: esporta JSON --------------------*/
document.getElementById("esporta").addEventListener("click", () => {
    window.open("data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(libri, null, 2)));
});
/*-------------------- FINE EXTRA W7D2-16 --------------------*/

/*-------------------- EXTRA W7D2-17: bottoni filtro --------------------*/
document.getElementById("filtri").addEventListener("click", (e) => {
    const bottone = e.target.closest("button[data-filtro]");
    if (!bottone) return;

    filtroAttivo = bottone.dataset.filtro;
    document.querySelectorAll("#filtri button").forEach(b => {
        b.classList.toggle("attivo", b === bottone);
    });
    renderLibri();
});
/*-------------------- FINE EXTRA W7D2-17 --------------------*/

/*-------------------- EXTRA W7D2-18: ordinamento --------------------*/
document.getElementById("ordina").addEventListener("change", (e) => {
    if (e.target.value === "titolo") {
        libri.sort((a, b) => a.titolo.localeCompare(b.titolo));
    } else if (e.target.value === "anno") {
        libri.sort((a, b) => a.anno - b.anno);
    }
    salvaLibri();
    renderLibri();
});
/*-------------------- FINE EXTRA W7D2-18 --------------------*/

renderLibri();

/*-------------------- EXTRA 17: prova di Libro.daStringa --------------------*/
console.log(Libro.daStringa("1984|Orwell|1949"));
/*-------------------- FINE EXTRA 17 --------------------*/
