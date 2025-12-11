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
        <label>Type</label>
        <select name="actions[${idx}][type]">
          <option value="Correction" ${
            initialData.type === "Correction" ? "selected" : ""
          }>Correction</option>
          <option value="Action corrective" ${
            initialData.type === "Action corrective" ? "selected" : ""
          }>Action corrective</option>
        </select>
      </div>
      <div class="form-group">
        <label>Responsable</label>
        <input type="text" name="actions[${idx}][responsable]" value="${
    initialData.responsable || ""
  }" />
      </div>
      <div class="form-group">
        <label>Date prévue</label>
        <input type="date" name="actions[${idx}][datePrevue]" value="${
    initialData.datePrevue || ""
  }" />
      </div>
    </div>
    <div class="grid grid-3">
      <div class="form-group">
        <label>Date réalisée</label>
        <input type="date" name="actions[${idx}][dateRealisee]" value="${
    initialData.dateRealisee || ""
  }" />
      </div>
      <div class="form-group">
        <label>Effectif</label>
        <select name="actions[${idx}][effectif]">
          <option value="">-</option>
          <option value="Oui" ${
            initialData.effectif === "Oui" ? "selected" : ""
          }>Oui</option>
          <option value="Non" ${
            initialData.effectif === "Non" ? "selected" : ""
          }>Non</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea rows="2" name="actions[${idx}][description]">${
    initialData.description || ""
  }</textarea>
    </div>
  `;

  wrapper
    .querySelector(".btn-remove-action")
    .addEventListener("click", () => wrapper.remove());

  actionsContainer.appendChild(wrapper);
}

addActionButton.addEventListener("click", () => createActionItem());

// Au moins une action par défaut
if (actionsContainer.children.length === 0) {
  createActionItem();
}

// --- Criticité (calcul simple G×F×D) ---
const graviteInput = document.getElementById("gravite");
const frequenceInput = document.getElementById("frequence");
const detectionInput = document.getElementById("detection");
const evaluationCriticite = document.getElementById("evaluationCriticite");

function updateCriticite() {
  const g = parseInt(graviteInput.value || "0", 10);
  const f = parseInt(frequenceInput.value || "0", 10);
  const d = parseInt(detectionInput.value || "0", 10);

  if (g && f && d) {
    const score = g * f * d;
    evaluationCriticite.value = `${score}`;
  } else {
    evaluationCriticite.value = "";
  }
}

[graviteInput, frequenceInput, detectionInput].forEach((el) =>
  el.addEventListener("change", updateCriticite)
);

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

  // Actions dynamiques
  const actions = [];
  actionsContainer
    .querySelectorAll(".action-item")
    .forEach((item) => {
      const index = item.dataset.index;
      const actionData = {
        type: data.get(`actions[${index}][type]`) || "",
        responsable: data.get(`actions[${index}][responsable]`) || "",
        datePrevue: data.get(`actions[${index}][datePrevue]`) || "",
        dateRealisee: data.get(`actions[${index}][dateRealisee]`) || "",
        effectif: data.get(`actions[${index}][effectif]`) || "",
        description: data.get(`actions[${index}][description]`) || "",
      };
      // On ne garde que si description ou responsable non vides
      if (actionData.description || actionData.responsable) {
        actions.push(actionData);
      }
    });

  const record = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),

    dateEvenement: data.get("dateEvenement") || "",
    heureEvenement: data.get("heureEvenement") || "",
    serviceEmetteur: data.get("serviceEmetteur") || "",
    constatePar: data.get("constatePar") || "",
    typeEns: data.get("typeEns") || "",
    categorieCorpsEtranger: data.get("categorieCorpsEtranger") || "",
    nonConformiteConstatee: data.get("nonConformiteConstatee") || "",
    defaut: data.get("defaut") || "",
    impactSecurite: data.get("impactSecurite") || "",

    produit: data.get("produit") || "",
    marque: data.get("marque") || "",
    ligne: data.get("ligne") || "",
    grammage: data.get("grammage") || "",
    ddm: data.get("ddm") || "",
    quantieme: data.get("quantieme") || "",
    lot: data.get("lot") || "",
    palette: data.get("palette") || "",
    codeSca: data.get("codeSca") || "",
    refInterne: data.get("refInterne") || "",
    dateProduction: data.get("dateProduction") || "",
    bobine: data.get("bobine") || "",
    tracaAutres: data.get("tracaAutres") || "",

    facteurs,
    causes: data.get("causes") || "",

    dateTraitement: data.get("dateTraitement") || "",
    etatEns: data.get("etatEns") || "",
    traitement: data.get("traitement") || "",

    gravite: data.get("gravite") || "",
    frequence: data.get("frequence") || "",
    detection: data.get("detection") || "",
    evaluationCriticite: data.get("evaluationCriticite") || "",

    dateRedaction: data.get("dateRedaction") || "",
    redacteur: data.get("redacteur") || "",
    verificateur: data.get("verificateur") || "",
    approbateur: data.get("approbateur") || "",

    actions,
  };

  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  renderRecords();

  alert("ENS enregistrée avec succès.");
  form.reset();
  actionsContainer.innerHTML = "";
  actionIndex = 0;
  createActionItem();
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
    if (etat && r.etatEns !== etat) return false;

    if (search) {
      const txt = [
        r.produit,
        r.marque,
        r.ligne,
        r.lot,
        r.defaut,
        r.nonConformiteConstatee,
        r.causes,
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
    title.textContent = `${dateLabel} – ${r.produit || "Produit ?"} – Lot ${
      r.lot || "?"
    }`;

    const pill = document.createElement("div");
    const etatClass = r.etatEns ? `etat-${r.etatEns.replace(" ", "\\ ")}` : "";
    pill.className = `record-pill ${etatClass}`;
    pill.textContent = r.etatEns || "État ?";

    header.appendChild(title);
    header.appendChild(pill);

    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = [
      r.typeEns ? `Type : ${r.typeEns}` : "",
      r.serviceEmetteur ? `Service : ${r.serviceEmetteur}` : "",
      r.constatePar ? `Constaté par : ${r.constatePar}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const body = document.createElement("div");
    body.className = "record-meta";
    const texte =
      (r.nonConformiteConstatee || "").slice(0, 150) +
      (r.nonConformiteConstatee && r.nonConformiteConstatee.length > 150
        ? "…"
        : "");
    body.textContent = texte;

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
    card.appendChild(actionsDiv);

    recordsContainer.appendChild(card);
  });
}

filterEtat.addEventListener("change", renderRecords);
searchText.addEventListener("input", renderRecords);

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

  const columns = [
    "dateEvenement",
    "heureEvenement",
    "serviceEmetteur",
    "constatePar",
    "typeEns",
    "produit",
    "marque",
    "ligne",
    "lot",
    "defaut",
    "nonConformiteConstatee",
    "causes",
    "etatEns",
    "dateRedaction",
    "redacteur",
    "evaluationCriticite",
  ];

  const header = columns.join(";");
  const lines = records.map((r) =>
    columns
      .map((c) => {
        const v = r[c] || "";
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
