// Clé de stockage local
const STORAGE_KEY = "ensRecords";

// --- Gestion des onglets ---
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document
      .querySelectorAll(".tab-button")
      .forEach((b) => b.classList.toggle("active", b === btn));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.toggle("active", c.id === tab));
  });
});

// --- Gestion des modes (simple / complet) ---
const modeButtons = document.querySelectorAll(".mode-button");
function setMode(mode) {
  document.body.setAttribute("data-mode", mode);
  modeButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.mode === mode)
  );
}
modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});
// mode par défaut
setMode("simple");

// --- Formulaire principal ---
const form = document.getElementById("ensForm");
const actionsContainer = document.getElementById("actionsContainer");
const addActionButton = document.getElementById("addActionButton");

let actionIndex = 0;

// Ajout d’une action corrective
function createActionItem(initialData = {}) {
  const idx = actionIndex++;
  const wrapper = document.createElement("div");
  wrapper.className = "action-item";
  wrapper.dataset.index = idx;

  wrapper.innerHTML = `
    <div class="action-item-header">
      <h3>Action n°${idx + 1}</h3>
      <button type="button" class="btn secondary btn-remove-action">Supprimer</button>
    </div>
    <div class="grid grid-3">
      <div class="form-group">
        <label>Action</label>
        <input type="text" name="actions[${idx}][intitule]" value="${initialData.intitule || ""}" />
      </div>
      <div class="form-group">
        <label>Resp</label>
        <input type="text" name="actions[${idx}][responsable]" value="${initialData.responsable || ""}" />
      </div>
      <div class="form-group">
        <label>Délai (date prévue)</label>
        <input type="date" name="actions[${idx}][datePrevue]" value="${initialData.datePrevue || ""}" />
      </div>
    </div>
    <div class="grid grid-3">
      <div class="form-group">
        <label>Date réalisée</label>
        <input type="date" name="actions[${idx}][dateRealisee]" value="${initialData.dateRealisee || ""}" />
      </div>
      <div class="form-group">
        <label>État</label>
        <select name="actions[${idx}][etat]">
          <option value="" ${!initialData.etat ? "selected" : ""}>-</option>
          <option value="En cours" ${initialData.etat === "En cours" ? "selected" : ""}>En cours</option>
          <option value="Clos" ${initialData.etat === "Clos" ? "selected" : ""}>Clos</option>
        </select>
      </div>
    </div>
  `;

  wrapper
    .querySelector(".btn-remove-action")
    .addEventListener("click", () => wrapper.remove());

  actionsContainer.appendChild(wrapper);
}

if (addActionButton) {
  addActionButton.addEventListener("click", () => createActionItem());
}

// Au moins une action par défaut en mode complet (mais conteneur est advanced-only)
if (actionsContainer && actionsContainer.children.length === 0) {
  createActionItem();
}

// --- Criticité (calcul simple G×F×D) ---
const graviteInput = document.getElementById("gravite");
const frequenceInput = document.getElementById("frequence");
const detectionInput = document.getElementById("detection");
const evaluationCriticite = document.getElementById("evaluationCriticite");

function updateCriticite() {
  const g = parseInt(graviteInput?.value || "0", 10);
  const f = parseInt(frequenceInput?.value || "0", 10);
  const d = parseInt(detectionInput?.value || "0", 10);

  if (g && f && d) {
    const score = g * f * d;
    evaluationCriticite.value = `${score}`;
  } else if (evaluationCriticite) {
    evaluationCriticite.value = "";
  }
}

[graviteInput, frequenceInput, detectionInput].forEach((el) => {
  if (el) el.addEventListener("change", updateCriticite);
});

// --- LocalStorage helpers ---
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erreur de lecture localStorage", e);
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// --- Soumission du formulaire ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    alert("Merci de remplir tous les champs obligatoires (*).");
    return;
  }

  const data = new FormData(form);

  // Facteurs (checkbox multiples)
  const facteurs = [];
  form.querySelectorAll('input[name="facteurs"]:checked').forEach((cb) => {
    facteurs.push(cb.value);
  });

  // Destinations
  const destination = [];
  form.querySelectorAll('input[name="destination"]:checked').forEach((cb) => {
    destination.push(cb.value);
  });

  // Actions dynamiques
  const actions = [];
  if (actionsContainer) {
    actionsContainer.querySelectorAll(".action-item").forEach((item) => {
      const index = item.dataset.index;
      const actionData = {
        intitule: data.get(`actions[${index}][intitule]`) || "",
        responsable: data.get(`actions[${index}][responsable]`) || "",
        datePrevue: data.get(`actions[${index}][datePrevue]`) || "",
        dateRealisee: data.get(`actions[${index}][dateRealisee]`) || "",
        etat: data.get(`actions[${index}][etat]`) || "",
      };
      if (actionData.intitule || actionData.responsable) {
        actions.push(actionData);
      }
    });
  }

  const record = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),

    // Identification
    dateEvenement: data.get("dateEvenement") || "",
    heureEvenement: data.get("heureEvenement") || "",
    serviceEmetteur: data.get("serviceEmetteur") || "",
    serviceConcerne: data.get("serviceConcerne") || "",
    constatePar: data.get("constatePar") || "",
    typeEns: data.get("typeEns") || "",
    description: data.get("description") || "",
    defaut: data.get("defaut") || "",
    siCcpPrpo: data.get("siCcpPrpo") || "",
    categorieCorpsEtranger: data.get("categorieCorpsEtranger") || "",
    qteConcernee: data.get("qteConcernee") || "",
    impactSecurite: data.get("impactSecurite") || "",

    // Traçabilité
    produit: data.get("produit") || "",
    grammage: data.get("grammage") || "",
    marque: data.get("marque") || "",
    ligne: data.get("ligne") || "",
    ddm: data.get("ddm") || "",
    quantieme: data.get("quantieme") || "",
    lot: data.get("lot") || "",
    palette: data.get("palette") || "",
    codeSca: data.get("codeSca") || "",
    refInterne: data.get("refInterne") || "",
    dateProduction: data.get("dateProduction") || "",
    bobine: data.get("bobine") || "",
    heureTraaca: data.get("heureTraaca") || "",
    tracaAutres: data.get("tracaAutres") || "",

    // Traitement
    traitementProduit: data.get("traitementProduit") || "",
    destination,
    destinationAutres: data.get("destinationAutres") || "",
    dateTraitement: data.get("dateTraitement") || "",
    nomTraitement: data.get("nomTraitement") || "",

    // Analyse causes
    causes: data.get("causes") || "",
    facteurs,

    // Corrections & actions
    correctionsImmediates: data.get("correctionsImmediates") || "",
    actions,

    // Criticité
    gravite: data.get("gravite") || "",
    frequence: data.get("frequence") || "",
    detection: data.get("detection") || "",
    evaluationCriticite: data.get("evaluationCriticite") || "",

    // État / Rédaction
    etatEns: data.get("etatEns") || "",
    dateRedaction: data.get("dateRedaction") || "",
    redacteur: data.get("redacteur") || "",
    verificateur: data.get("verificateur") || "",
    approbateur: data.get("approbateur") || "",
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  renderRecords();

  alert("ENS enregistrée avec succès.");
  form.reset();
  if (actionsContainer) {
    actionsContainer.innerHTML = "";
    actionIndex = 0;
    createActionItem();
  }
  // Remet en mode simple après enregistrement
  setMode("simple");
});

// --- Affichage des ENS ---
const recordsContainer = document.getElementById("recordsContainer");
const filterEtat = document.getElementById("filterEtat");
const searchText = document.getElementById("searchText");

function renderRecords() {
  const records = loadRecords();
  recordsContainer.innerHTML = "";

  const etat = filterEtat.value;
  const search = searchText.value.trim().toLowerCase();

  const filtered = records.filter((r) => {
    if (etat && (r.etatEns || "Non défini") !== etat) return false;

    if (search) {
      const txt = [
        r.produit,
        r.marque,
        r.ligne,
        r.lot,
        r.defaut,
        r.description,
        r.causes,
        r.redacteur,
      ]
        .join(" ")
        .toLowerCase();
      if (!txt.includes(search)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Aucune ENS enregistrée pour ces critères.";
    empty.style.fontSize = "0.85rem";
    empty.style.color = "#6b7280";
    recordsContainer.appendChild(empty);
    return;
  }

  filtered.forEach((r) => {
    const card = document.createElement("article");
    card.className = "record-card";

    const header = document.createElement("div");
    header.className = "record-header";

    const title = document.createElement("div");
    title.className = "record-title";
    const dateLabel = r.dateEvenement || r.dateRedaction || "Date ?";
    const prod = r.produit || "Produit ?";
    const lot = r.lot || "?";
    title.textContent = `${dateLabel} – ${prod} – Lot ${lot}`;

    const pill = document.createElement("div");
    const etatValeur = r.etatEns || "Non défini";
    const etatClass = `etat-${etatValeur.replace(" ", "\\ ")}`;
    pill.className = `record-pill ${etatClass}`;
    pill.textContent = etatValeur;

    header.appendChild(title);
    header.appendChild(pill);

    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = [
      r.typeEns ? `Type : ${r.typeEns}` : "",
      r.serviceEmetteur ? `Service : ${r.serviceEmetteur}` : "",
      r.constatePar ? `Constaté par : ${r.constatePar}` : "",
      r.redacteur ? `Rédacteur : ${r.redacteur}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const body = document.createElement("div");
    body.className = "record-meta";
    const texte =
      (r.description || "").slice(0, 150) +
      (r.description && r.description.length > 150 ? "…" : "");
    body.textContent = texte;

    const criticite = document.createElement("div");
    criticite.className = "record-meta";
    if (r.evaluationCriticite) {
      criticite.textContent = `Criticité : ${r.evaluationCriticite}`;
    }

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "record-actions";

    const btnDetails = document.createElement("button");
    btnDetails.type = "button";
    btnDetails.className = "btn secondary";
    btnDetails.textContent = "Détails (JSON)";
    btnDetails.addEventListener("click", () => {
      alert(JSON.stringify(r, null, 2));
    });

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn danger";
    btnDelete.textContent = "Supprimer";
    btnDelete.addEventListener("click", () => {
      if (confirm("Supprimer cette ENS ?")) {
        const all = loadRecords().filter((x) => x.id !== r.id);
        saveRecords(all);
        renderRecords();
      }
    });

    actionsDiv.appendChild(btnDetails);
    actionsDiv.appendChild(btnDelete);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(body);
    if (criticite.textContent) card.appendChild(criticite);
    card.appendChild(actionsDiv);

    recordsContainer.appendChild(card);
  });
}

if (filterEtat) filterEtat.addEventListener("change", renderRecords);
if (searchText) searchText.addEventListener("input", renderRecords);

renderRecords();

// --- Export JSON / CSV ---
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document
  .getElementById("exportJsonButton")
  .addEventListener("click", () => {
    const records = loadRecords();
    if (!records.length) {
      alert("Aucune ENS à exporter.");
      return;
    }
    downloadFile(
      "ens-qualite.json",
      JSON.stringify(records, null, 2),
      "application/json"
    );
  });

document.getElementById("exportCsvButton").addEventListener("click", () => {
  const records = loadRecords();
  if (!records.length) {
    alert("Aucune ENS à exporter.");
    return;
  }

  // Colonnes principales en lien avec ton classeur
  const columns = [
    "dateEvenement",
    "heureEvenement",
    "serviceEmetteur",
    "serviceConcerne",
    "constatePar",
    "typeEns",
    "description",
    "defaut",
    "siCcpPrpo",
    "categorieCorpsEtranger",
    "qteConcernee",
    "impactSecurite",

    "produit",
    "grammage",
    "marque",
    "ligne",
    "ddm",
    "quantieme",
    "lot",
    "palette",
    "codeSca",
    "refInterne",
    "dateProduction",
    "bobine",
    "heureTraaca",
    "tracaAutres",

    "traitementProduit",
    "destination", // liste jointe
    "destinationAutres",
    "dateTraitement",
    "nomTraitement",

    "causes",
    "facteurs", // liste jointe
    "correctionsImmediates",

    "gravite",
    "frequence",
    "detection",
    "evaluationCriticite",

    "etatEns",
    "dateRedaction",
    "redacteur",
    "verificateur",
    "approbateur",
  ];

  const header = columns.join(";");
  const lines = records.map((r) =>
    columns
      .map((c) => {
        let v = r[c];
        if (Array.isArray(v)) {
          v = v.join(", ");
        }
        v = v || "";
        const clean = String(v).replace(/"/g, '""').replace(/\r?\n/g, " ");
        return `"${clean}"`;
      })
      .join(";")
  );

  const csv = [header, ...lines].join("\n");
  downloadFile("ens-qualite.csv", csv, "text/csv;charset=utf-8;");
});

document.getElementById("clearDataButton").addEventListener("click", () => {
  if (
    confirm(
      "Cette action va supprimer toutes les ENS stockées dans ce navigateur. Continuer ?"
    )
  ) {
    localStorage.removeItem(STORAGE_KEY);
    renderRecords();
  }
});

// --- PWA : service worker + installation ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .catch((err) => console.error("Service worker error", err));
}

let deferredPrompt = null;
const installButton = document.getElementById("installButton");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    installButton.hidden = true;
  }
  deferredPrompt = null;
});
