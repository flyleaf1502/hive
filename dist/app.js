import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from "./config.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const views = { welcome: $("#welcome-view"), signup: $("#signup-view"), public: $("#public-view"), admin: $("#admin-view") };
const form = $("#registration-form");
const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabels = { Mon: "Mo", Tue: "Di", Wed: "Mi", Thu: "Do", Fri: "Fr", Sat: "Sa", Sun: "So" };
const roleOrder = ["Tank", "Healer", "Damage", "Flexible"];
const races = [
  { name: "Orc", icon: "race-orc.png" },
  { name: "Troll", icon: "race-troll.png" },
  { name: "Tauren", icon: "race-tauren.png" },
  { name: "Undead", icon: "race-undead.png" },
  { name: "Skyborne", icon: "elf-ear" },
  { name: "Not sure yet", label: "Noch nicht sicher", icon: "role-flexible.jpg" },
];
const classes = [
  { name: "Warrior", icon: "class-warrior.jpg", specs: [["Arms", "Damage"], ["Fury", "Damage"], ["Protection", "Tank"]] },
  { name: "Hunter", icon: "class-hunter.jpg", specs: [["Beast Mastery", "Damage"], ["Marksmanship", "Damage"], ["Survival", "Damage"]] },
  { name: "Rogue", icon: "class-rogue.jpg", specs: [["Assassination", "Damage"], ["Combat", "Damage"], ["Subtlety", "Damage"]] },
  { name: "Druid", icon: "class-druid.jpg", specs: [["Balance", "Damage"], ["Feral (Bear)", "Tank"], ["Feral (Cat)", "Damage"], ["Restoration", "Healer"]] },
  { name: "Shaman", icon: "class-shaman.jpg", specs: [["Elemental", "Damage"], ["Enhancement", "Damage"], ["Restoration", "Healer"]] },
  { name: "Mage", icon: "class-mage.jpg", specs: [["Arcane", "Damage"], ["Fire", "Damage"], ["Frost", "Damage"]] },
  { name: "Warlock", icon: "class-warlock.jpg", specs: [["Affliction", "Damage"], ["Demonology", "Damage"], ["Destruction", "Damage"]] },
  { name: "Priest", icon: "class-priest.jpg", specs: [["Discipline", "Healer"], ["Holy", "Healer"], ["Shadow", "Damage"]] },
  { name: "Paladin", icon: "class-paladin.jpg", specs: [["Holy", "Healer"], ["Protection", "Tank"], ["Retribution", "Damage"]] },
  { name: "Not sure yet", label: "Noch nicht sicher", icon: "role-flexible.jpg", specs: [] },
];
const roleIcons = { Tank: "role-tank.jpg", Healer: "role-healer.jpg", Damage: "role-damage.jpg", Flexible: "role-flexible.jpg" };
const specIcons = {
  Rogue: { Combat: "spec-rogue-combat.jpg" },
  Druid: { "Feral (Bear)": "spec-druid-feral-bear.jpg", "Feral (Cat)": "spec-druid-feral-cat.jpg" },
};
const iconUrl = (name) => `./assets/icons/${name}${/\.(?:svg|jpe?g|png)$/i.test(name) ? "" : ".svg"}`;
const iconSlug = (name) => name.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const displayChoice = (value) => value === "Not sure yet" ? "Noch nicht sicher" : value;
const choice = (group) => $( `input[name="${group}_choice"]:checked`, form)?.value || "";
const selectedClass = () => classes.find((item) => item.name === choice("class"));
const derivedRole = () => selectedClass()?.specs.find(([spec]) => spec === choice("spec"))?.[1] || "Flexible";
const state = { mode: "create", editId: null, editToken: null, entries: [], publicEntries: [], auth: null, editLoadVersion: 0, adminDeleteEntry: null };
const configured = () => /^https:\/\/.+\.supabase\.co\/?$/.test(SUPABASE_URL) && SUPABASE_PUBLIC_KEY && !SUPABASE_PUBLIC_KEY.startsWith("YOUR_");

function renderPicker(target, group, options, selected = "") {
  target.replaceChildren();
  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "choice-tile";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${group}_choice`;
    input.value = option.name;
    input.required = true;
    input.checked = option.name === selected;
    const card = document.createElement("span");
    card.className = "choice-tile-inner";
    const icon = document.createElement("img");
    icon.className = "choice-icon";
    icon.src = iconUrl(option.icon);
    icon.alt = "";
    card.append(icon, document.createTextNode(option.label || option.name));
    if (option.role) {
      const roleIcon = document.createElement("img");
      roleIcon.className = "choice-role-icon";
      roleIcon.src = iconUrl(roleIcons[option.role]);
      roleIcon.alt = "";
      roleIcon.title = option.role;
      card.append(roleIcon);
    }
    label.append(input, card);
    target.append(label);
  });
}

function renderSpecs(className, selected = "") {
  const target = $("#spec-picker");
  const chosenClass = classes.find((item) => item.name === className);
  if (!chosenClass) {
    target.replaceChildren();
    target.append(element("div", "choice-prompt", "Wähle zuerst eine Klasse."));
    updateDerivedRole();
    return;
  }
  const options = chosenClass.specs.map(([name, role]) => ({ name, role, icon: specIcons[chosenClass.name]?.[name] || `spec-${iconSlug(chosenClass.name)}-${iconSlug(name)}.jpg` }));
  options.push({ name: "Not sure yet", label: "Noch nicht sicher", role: "Flexible", icon: "role-flexible.jpg" });
  renderPicker(target, "spec", options, selected);
  updateDerivedRole();
}

function updateDerivedRole() {
  const role = choice("spec") ? derivedRole() : "–";
  const display = $("#derived-role");
  const icon = $("#derived-role-icon");
  display.textContent = role;
  display.dataset.role = role.toLowerCase();
  icon.hidden = role === "–";
  if (role !== "–") icon.src = iconUrl(roleIcons[role]);
}

function renderAllPickers() {
  renderPicker($("#race-picker"), "race", races);
  renderPicker($("#class-picker"), "class", classes);
  renderSpecs("");
  $("#class-picker").addEventListener("change", () => renderSpecs(choice("class")));
  $("#spec-picker").addEventListener("change", updateDerivedRole);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function setBusy(button, busy, idleText) {
  button.disabled = busy;
  button.textContent = busy ? "Einen Moment …" : idleText;
}

async function request(path, { method = "GET", body, token, headers = {} } = {}) {
  if (!configured()) throw new Error("Die Datenbank ist noch nicht verbunden. Die Seite kann erst nach der Einrichtung Einträge speichern.");
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_PUBLIC_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : /^eyJ[^.]+\.[^.]+\.[^.]+$/.test(SUPABASE_PUBLIC_KEY) ? { Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    let detail = "Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es noch einmal.";
    try {
      const data = await response.json();
      detail = data.message || data.msg || data.error_description || data.error || detail;
    } catch { /* Keep the useful fallback. */ }
    if (response.status === 401 || response.status === 403) detail = "Zugriff verweigert oder Sitzung abgelaufen. Bitte melde dich erneut an.";
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

const rpc = (name, body) => request(`/rest/v1/rpc/${name}`, { method: "POST", body });

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function editUrl(id, token) {
  const url = new URL(location.href);
  url.hash = `#/bearbeiten/${id}/${token}`;
  return url.toString();
}

function readForm() {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    knows_us: String(data.get("knows_us") || "").trim(),
    race: choice("race"),
    class_name: choice("class"),
    spec: choice("spec"),
    role: derivedRole(),
    days: daysOrder.filter((day) => data.getAll("days").includes(day)),
    max_raid_days: Number(data.get("max_raid_days")),
    earliest_start: String(data.get("earliest_start") || ""),
    latest_end: String(data.get("latest_end") || ""),
    raid_vision: String(data.get("raid_vision") || "").trim(),
    discord_name: String(data.get("discord_name") || "").trim(),
  };
}

function fillForm(entry) {
  for (const key of ["name", "knows_us", "max_raid_days", "earliest_start", "latest_end", "raid_vision", "discord_name"]) {
    const control = form.elements.namedItem(key);
    if (control) control.value = entry[key] ?? "";
  }
  const selectChoice = (group, value) => {
    const input = $$(`input[name="${group}_choice"]`, form).find((item) => item.value === value);
    if (input) input.checked = true;
  };
  selectChoice("race", entry.race);
  selectChoice("class", entry.class_name);
  renderSpecs(entry.class_name, entry.spec);
  updateDerivedRole();
  $$("input[name=days]", form).forEach((input) => { input.checked = entry.days?.includes(input.value) || false; });
}

function resetForm() {
  form.reset();
  renderSpecs("");
  state.mode = "create";
  state.editId = null;
  state.editToken = null;
  $("#form-mode-label").textContent = "ANMELDUNG";
  $("#form-heading").textContent = "Dein HIVE-Comeback?";
  $("#delete-button").hidden = true;
  $("#submit-button").innerHTML = 'LET’S FUCKING GO! <span aria-hidden="true">↗</span>';
  showError($("#form-error"), "");
  $(".form-layout").hidden = false;
  $("#signup-success").hidden = true;
}

function setEditMode(entry, id, token, isAdmin = false) {
  state.mode = isAdmin ? "admin-edit" : "edit";
  state.editId = id;
  state.editToken = token;
  fillForm(entry);
  $("#form-mode-label").textContent = isAdmin ? "ADMIN · EINTRAG BEARBEITEN" : "DEINE ANMELDUNG BEARBEITEN";
  $("#form-heading").textContent = "Pläne geändert?";
  $("#delete-button").hidden = isAdmin;
  $("#submit-button").innerHTML = 'Änderungen speichern <span aria-hidden="true">↗</span>';
  $(".form-layout").hidden = false;
  $("#signup-success").hidden = true;
  showError($("#form-error"), "");
}

async function submitRegistration(event) {
  event.preventDefault();
  showError($("#form-error"), "");
  if (!form.reportValidity()) return;
  const entry = readForm();
  if (!entry.race || !entry.class_name || !entry.spec) {
    showError($("#form-error"), "Bitte wähle Rasse, Klasse und Spec aus.");
    return;
  }
  if (!entry.days.length) {
    showError($("#form-error"), "Bitte wähle mindestens einen möglichen Raidtag aus.");
    $("#day-options").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const button = $("#submit-button");
  setBusy(button, true, state.mode === "create" ? "LET’S FUCKING GO! ↗" : "Änderungen speichern ↗");
  try {
    if (state.mode === "create") {
      const token = randomToken();
      const id = await rpc("hive_create_registration", { p_entry: entry, p_token: token });
      $("#edit-link").value = editUrl(id, token);
      $(".form-layout").hidden = true;
      $("#signup-success").hidden = false;
      $("#signup-success").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (state.mode === "edit") {
      await rpc("hive_update_registration", { p_id: state.editId, p_token: state.editToken, p_entry: entry });
      showToast("Deine Änderungen sind gespeichert.");
      $("#form-error").hidden = true;
    } else {
      const auth = await ensureAuth();
      await request(`/rest/v1/registrations?id=eq.${encodeURIComponent(state.editId)}`, { method: "PATCH", body: entry, token: auth.access_token, headers: { Prefer: "return=minimal" } });
      showToast("Eintrag aktualisiert.");
      location.hash = "#/admin";
      await loadEntries();
    }
  } catch (error) {
    showError($("#form-error"), error.message);
    $("#form-error").scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    setBusy(button, false, state.mode === "create" ? "LET’S FUCKING GO! ↗" : "Änderungen speichern ↗");
  }
}

function saveAuth(auth) {
  state.auth = { ...auth, expires_at: Math.floor(Date.now() / 1000) + (auth.expires_in || 3600) };
  sessionStorage.setItem("hive_admin_auth", JSON.stringify(state.auth));
}

async function ensureAuth() {
  if (!state.auth) {
    try { state.auth = JSON.parse(sessionStorage.getItem("hive_admin_auth") || "null"); } catch { state.auth = null; }
  }
  if (!state.auth?.access_token) throw new Error("Bitte melde dich als Admin an.");
  if (state.auth.expires_at > Math.floor(Date.now() / 1000) + 60) return state.auth;
  const refreshed = await request("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: state.auth.refresh_token } });
  saveAuth(refreshed);
  return state.auth;
}

async function login(event) {
  event.preventDefault();
  const loginForm = event.currentTarget;
  showError($("#login-error"), "");
  const button = $("button[type=submit]", loginForm);
  setBusy(button, true, "Übersicht öffnen ↗");
  try {
    const data = new FormData(loginForm);
    const auth = await request("/auth/v1/token?grant_type=password", { method: "POST", body: { email: data.get("email"), password: data.get("password") } });
    saveAuth(auth);
    const allowed = await request("/rest/v1/rpc/hive_is_admin", { method: "POST", body: {}, token: auth.access_token });
    if (!allowed) throw new Error("Dieses Konto ist nicht für die Raidleitung freigeschaltet.");
    loginForm.reset();
    await loadEntries();
  } catch (error) {
    state.auth = null;
    sessionStorage.removeItem("hive_admin_auth");
    showError($("#login-error"), error.message);
  } finally {
    setBusy(button, false, "Übersicht öffnen ↗");
  }
}

async function loadEntries() {
  try {
    const auth = await ensureAuth();
    const allowed = await request("/rest/v1/rpc/hive_is_admin", { method: "POST", body: {}, token: auth.access_token });
    if (!allowed) throw new Error("Dieses Konto ist nicht für die Raidleitung freigeschaltet.");
    state.entries = await request("/rest/v1/registrations?select=id,name,knows_us,race,class_name,spec,role,days,max_raid_days,earliest_start,latest_end,raid_vision,discord_name,created_at,updated_at&order=created_at.desc", { token: auth.access_token });
    $("#admin-login-card").hidden = true;
    $("#admin-panel").hidden = false;
    renderDashboard();
  } catch (error) {
    clearAdminData();
    state.auth = null;
    sessionStorage.removeItem("hive_admin_auth");
    $("#admin-login-card").hidden = false;
    $("#admin-panel").hidden = true;
    showError($("#login-error"), error.message);
  }
}

function clearAdminData() {
  state.entries = [];
  for (const selector of ["#stats-grid", "#day-chart", "#time-chart", "#roster-list"]) $(selector).replaceChildren();
  $("#result-count").textContent = "";
  $("#roster-empty").hidden = true;
  $("#filter-class").replaceChildren(new Option("Alle Klassen", ""));
  if (state.mode === "admin-edit") resetForm();
}

function element(tag, className = "", content = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = content;
  return node;
}

async function loadPublicEntries() {
  showError($("#public-error"), "");
  try {
    const rows = await rpc("hive_public_roster", {});
    state.publicEntries = Array.isArray(rows) ? rows : [];
    renderPublicRoster();
  } catch (error) {
    state.publicEntries = [];
    renderPublicRoster();
    $("#public-empty").hidden = true;
    showError($("#public-error"), configured() ? error.message : "Die Raid-Übersicht ist noch nicht mit der Datenbank verbunden.");
  }
}

function renderPublicRoster() {
  const roleFilter = $("#public-filter-role").value;
  const classFilter = $("#public-filter-class");
  const previousClass = classFilter.value;
  const classNames = [...new Set(state.publicEntries.map((entry) => entry.class_name))].sort((a, b) => a.localeCompare(b, "de"));
  classFilter.replaceChildren(new Option("Alle Klassen", ""), ...classNames.map((name) => new Option(displayChoice(name), name)));
  classFilter.value = classNames.includes(previousClass) ? previousClass : "";
  const sortBy = $("#public-sort-by").value;
  const groupValue = (entry) => sortBy === "class" ? entry.class_name : sortBy === "spec" ? entry.spec : entry.role;
  const rows = state.publicEntries.filter((entry) => (!roleFilter || entry.role === roleFilter) && (!classFilter.value || entry.class_name === classFilter.value));
  rows.sort((a, b) => sortBy === "role"
    ? roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) || a.class_name.localeCompare(b.class_name, "de") || a.name.localeCompare(b.name, "de")
    : groupValue(a).localeCompare(groupValue(b), "de") || a.name.localeCompare(b.name, "de"));
  $("#public-count").textContent = `(${rows.length})`;
  const stats = $("#public-stats");
  stats.replaceChildren();
  for (const role of roleOrder) {
    const count = state.publicEntries.filter((entry) => entry.role === role).length;
    const tile = element("div", `public-stat role-${role.toLowerCase()}`);
    const icon = document.createElement("img");
    icon.src = iconUrl(roleIcons[role]);
    icon.alt = "";
    tile.append(icon, element("span", "", role), element("strong", "", count));
    stats.append(tile);
  }
  const list = $("#public-list");
  list.replaceChildren();
  $("#public-empty").hidden = rows.length > 0;
  let previousGroup = null;
  for (const entry of rows) {
    const group = groupValue(entry);
    if (group !== previousGroup) {
      list.append(element("h3", "public-group", displayChoice(group)));
      previousGroup = group;
    }
    const card = element("article", "public-card");
    const raceIcon = document.createElement("img");
    raceIcon.src = iconUrl(races.find((item) => item.name === entry.race)?.icon || "role-flexible.jpg");
    raceIcon.alt = "";
    raceIcon.className = "public-race-icon";
    const identity = element("div", "public-identity");
    identity.append(element("strong", "", entry.name), element("small", "", displayChoice(entry.race)));
    const classIcon = document.createElement("img");
    classIcon.src = iconUrl(classes.find((item) => item.name === entry.class_name)?.icon || "role-flexible.jpg");
    classIcon.alt = "";
    const classBox = element("div", "public-class");
    classBox.append(classIcon, element("span", "", displayChoice(entry.class_name)), element("small", "", displayChoice(entry.spec)));
    const role = element("div", "public-role");
    role.append(element("small", "", "Rolle"), element("strong", `role-${entry.role.toLowerCase()}`, entry.role));
    card.append(raceIcon, identity, classBox, role);
    list.append(card);
  }
}

function renderStats() {
  const stats = $("#stats-grid");
  stats.replaceChildren();
  const definitions = [
    ["Rückmeldungen", state.entries.length, "#e83d52"],
    ["Tanks", state.entries.filter((e) => e.role === "Tank").length, "#a9a2ff"],
    ["Healer", state.entries.filter((e) => e.role === "Healer").length, "#8bd9bd"],
    ["Damage", state.entries.filter((e) => e.role === "Damage").length, "#ff9c9f"],
    ["Flexible", state.entries.filter((e) => e.role === "Flexible").length, "#e3c284"],
  ];
  for (const [label, value, color] of definitions) {
    const card = element("div", "stat-card");
    card.style.setProperty("--accent", color);
    card.append(element("small", "", label), element("strong", "", value));
    stats.append(card);
  }
}

function chartRow(label, count, max) {
  const row = element("div", "chart-row");
  const track = element("div", "chart-track");
  const fill = element("span", "chart-fill");
  fill.style.width = `${Math.max(0, Math.min(100, (count / Math.max(max, 1)) * 100))}%`;
  track.append(fill);
  row.append(element("span", "chart-label", label), track, element("strong", "chart-count", count));
  return row;
}

function renderAdminInsights() {
  const days = $("#day-chart");
  days.replaceChildren();
  const dayCounts = daysOrder.map((day) => state.entries.filter((entry) => entry.days?.includes(day)).length);
  daysOrder.forEach((day, index) => days.append(chartRow(dayLabels[day], dayCounts[index], Math.max(...dayCounts, 1))));
  const times = $("#time-chart");
  times.replaceChildren();
  for (const [heading, key, options] of [
    ["Frühester Start", "earliest_start", [...(state.entries.some((entry) => entry.earliest_start === "18:00") ? ["18:00"] : []), "18:30", "19:00", "19:30", "20:00"]],
    ["Spätestes Ende", "latest_end", ["22:00", "22:30", "23:00"]],
  ]) {
    const group = element("div", "time-group");
    group.append(element("h4", "", heading));
    const counts = options.map((time) => state.entries.filter((entry) => entry[key] === time).length);
    options.forEach((time, index) => group.append(chartRow(time, counts[index], Math.max(...counts, 1))));
    times.append(group);
  }
}

function detail(label, value, className = "roster-detail") {
  const box = element("div", className);
  box.append(element("small", "", label), element("span", "", value || "–"));
  return box;
}

function openAdminDeleteDialog(entry) {
  state.adminDeleteEntry = { id: entry.id, name: entry.name };
  $("#delete-title").textContent = "Eintrag wirklich löschen?";
  $("#delete-description").textContent = `Der Eintrag von ${entry.name} wird dauerhaft aus der öffentlichen Liste und der Admin-Übersicht entfernt.`;
  $("#confirm-delete").textContent = "Ja, Eintrag löschen";
  showError($("#delete-error"), "");
  $("#delete-dialog").showModal();
}

function expandedInfo(entry) {
  const area = element("div", "roster-expanded");
  for (const [label, value] of [
    ["Kennen wir uns?", entry.knows_us],
    ["Race", displayChoice(entry.race)],
    ["Frühestens ab", entry.earliest_start ? `${entry.earliest_start} Uhr` : ""],
    ["Maximal bis", entry.latest_end ? `${entry.latest_end} Uhr` : ""],
    ["Raid-Vorstellung", entry.raid_vision],
    ["Discord", entry.discord_name],
    ["Zuletzt geändert", new Date(entry.updated_at).toLocaleDateString("de-DE")],
  ]) {
    const box = element("div");
    box.append(element("small", "", label), element("p", "", value || "–"));
    area.append(box);
  }
  const edit = element("button", "roster-edit", "Eintrag bearbeiten ↗");
  edit.type = "button";
  edit.addEventListener("click", () => {
    setEditMode(entry, entry.id, null, true);
    location.hash = "#/anmeldung";
    scrollTo({ top: 0, behavior: "smooth" });
  });
  area.append(edit);
  return area;
}

function renderDashboard() {
  renderStats();
  renderAdminInsights();
  const roleFilter = $("#filter-role").value;
  const classFilter = $("#filter-class");
  const previousClass = classFilter.value;
  const availableClasses = [...new Set(state.entries.map((entry) => entry.class_name))].sort((a, b) => a.localeCompare(b, "de"));
  classFilter.replaceChildren(new Option("Alle Klassen", ""), ...availableClasses.map((name) => new Option(displayChoice(name), name)));
  classFilter.value = availableClasses.includes(previousClass) ? previousClass : "";
  const selectedClass = classFilter.value;
  const sortBy = $("#sort-by").value;
  const entries = state.entries.filter((entry) => (!roleFilter || entry.role === roleFilter) && (!selectedClass || entry.class_name === selectedClass));
  const groupValue = (entry) => sortBy === "role" ? entry.role : sortBy === "class" ? entry.class_name : sortBy === "spec" ? (entry.spec || "Noch offen") : "";
  entries.sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "role") return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) || a.class_name.localeCompare(b.class_name, "de") || a.name.localeCompare(b.name, "de");
    return groupValue(a).localeCompare(groupValue(b), "de") || a.name.localeCompare(b.name, "de");
  });
  $("#result-count").textContent = `(${entries.length})`;
  $("#roster-empty").hidden = entries.length > 0;
  const list = $("#roster-list");
  list.replaceChildren();
  let previousGroup = null;
  for (const entry of entries) {
    const group = groupValue(entry);
    if (sortBy !== "newest" && group !== previousGroup) {
      const count = entries.filter((item) => groupValue(item) === group).length;
      list.append(element("div", "group-heading", `${displayChoice(group)}  /  ${count}`));
      previousGroup = group;
    }
    const row = element("article", "roster-item");
    const avatar = element("div", "roster-avatar");
    const classIcon = document.createElement("img");
    classIcon.src = iconUrl(classes.find((item) => item.name === entry.class_name)?.icon || "role-flexible.jpg");
    classIcon.alt = "";
    avatar.append(classIcon);
    row.append(avatar);
    const identity = element("div", "roster-name");
    identity.append(element("strong", "", entry.name), element("span", "", entry.discord_name));
    row.append(identity, detail("Klasse / Spec", `${displayChoice(entry.class_name)}${entry.spec ? ` · ${displayChoice(entry.spec)}` : ""}`, "roster-detail roster-class"));
    const role = element("div", "roster-detail roster-role");
    const badge = element("span", `role-badge role-${entry.role.toLowerCase()}`);
    const badgeIcon = document.createElement("img");
    badgeIcon.src = iconUrl(roleIcons[entry.role] || "role-flexible.jpg");
    badgeIcon.alt = "";
    badge.append(badgeIcon, document.createTextNode(entry.role));
    role.append(element("small", "", "Role"), badge);
    row.append(role, detail("Raidtage", `${entry.days?.map((day) => dayLabels[day] || day).join(" · ") || "–"}  /  max. ${entry.max_raid_days}  /  ${entry.earliest_start || "–"}–${entry.latest_end || "–"} Uhr`, "roster-detail roster-days"));
    const toggle = element("button", "roster-edit", "Details");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const existing = $(".roster-expanded", row);
      if (existing) { existing.remove(); toggle.setAttribute("aria-expanded", "false"); }
      else { row.append(expandedInfo(entry)); toggle.setAttribute("aria-expanded", "true"); }
    });
    const remove = element("button", "roster-edit roster-delete", "Löschen");
    remove.type = "button";
    remove.setAttribute("aria-label", `Eintrag von ${entry.name} löschen`);
    remove.addEventListener("click", () => openAdminDeleteDialog(entry));
    const actions = element("div", "roster-row-actions");
    actions.append(toggle, remove);
    row.append(actions);
    list.append(row);
  }
}

async function loadOwnEntry(id, token, version) {
  resetForm();
  $("#form-mode-label").textContent = "ANMELDUNG LADEN …";
  try {
    const entry = await rpc("hive_get_registration", { p_id: id, p_token: token });
    if (version !== state.editLoadVersion) return;
    if (!entry) throw new Error("Der Bearbeitungslink ist ungültig oder der Eintrag wurde entfernt.");
    setEditMode(entry, id, token);
  } catch (error) {
    if (version !== state.editLoadVersion) return;
    showError($("#form-error"), error.message);
    $("#form-mode-label").textContent = "BEARBEITUNG NICHT MÖGLICH";
  }
}

function route() {
  const editLoadVersion = ++state.editLoadVersion;
  const hash = location.hash || "#/willkommen";
  const edit = hash.match(/^#\/bearbeiten\/([0-9a-f-]{36})\/([0-9a-f]{64})$/i);
  const view = edit || hash === "#/anmeldung" ? "signup" : hash === "#/uebersicht" ? "public" : hash === "#/admin" ? "admin" : "welcome";
  Object.entries(views).forEach(([name, node]) => { node.hidden = name !== view; });
  $$("[data-nav]").forEach((link) => {
    const active = link.dataset.nav === view;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  $(".main-nav").classList.remove("open");
  $(".menu-toggle").setAttribute("aria-expanded", "false");
  if (view !== "signup" && state.mode === "admin-edit") resetForm();
  if (edit) loadOwnEntry(edit[1], edit[2], editLoadVersion);
  else if (view === "signup" && state.mode !== "admin-edit") resetForm();
  if (view === "public") loadPublicEntries();
  if (view === "admin" && state.auth) loadEntries();
  if (hash === "#brief") requestAnimationFrame(() => $("#brief").scrollIntoView({ behavior: "smooth" }));
  else scrollTo({ top: 0, behavior: "instant" });
}

form.addEventListener("submit", submitRegistration);
$("#admin-login-form").addEventListener("submit", login);
$("#copy-link").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#edit-link").value); showToast("Bearbeitungslink kopiert."); }
  catch { $("#edit-link").select(); showToast("Link markiert – bitte kopiere ihn mit Strg+C."); }
});
$("#delete-button").addEventListener("click", () => {
  state.adminDeleteEntry = null;
  $("#delete-title").textContent = "Wirklich raus aus dem Raid?";
  $("#delete-description").textContent = "Deine Angaben werden dauerhaft entfernt. Mit diesem Bearbeitungslink kannst du sie danach nicht mehr aufrufen.";
  $("#confirm-delete").textContent = "Ja, Anmeldung löschen";
  showError($("#delete-error"), "");
  $("#delete-dialog").showModal();
});
$("#cancel-delete").addEventListener("click", () => $("#delete-dialog").close());
$("#confirm-delete").addEventListener("click", async () => {
  const button = $("#confirm-delete");
  const target = state.adminDeleteEntry;
  const idleText = target ? "Ja, Eintrag löschen" : "Ja, Anmeldung löschen";
  setBusy(button, true, idleText);
  try {
    if (target) {
      const auth = await ensureAuth();
      const deleted = await request(`/rest/v1/registrations?id=eq.${encodeURIComponent(target.id)}&select=id`, { method: "DELETE", token: auth.access_token, headers: { Prefer: "return=representation" } });
      if (!deleted?.length) throw new Error("Der Eintrag wurde bereits entfernt.");
      $("#delete-dialog").close();
      state.adminDeleteEntry = null;
      await loadEntries();
      showToast(`Eintrag von ${target.name} gelöscht.`);
    } else {
      const deleted = await rpc("hive_delete_registration", { p_id: state.editId, p_token: state.editToken });
      if (!deleted) throw new Error("Der Bearbeitungslink ist ungültig oder der Eintrag wurde bereits gelöscht.");
      $("#delete-dialog").close();
      resetForm();
      location.hash = "#/willkommen";
      showToast("Deine Anmeldung wurde gelöscht.");
    }
  } catch (error) {
    showError($("#delete-error"), error.message);
  } finally {
    setBusy(button, false, idleText);
  }
});
$("#logout-button").addEventListener("click", async () => {
  const token = state.auth?.access_token;
  state.auth = null;
  sessionStorage.removeItem("hive_admin_auth");
  clearAdminData();
  $("#admin-panel").hidden = true;
  $("#admin-login-card").hidden = false;
  showError($("#login-error"), "");
  try { if (token) await request("/auth/v1/logout", { method: "POST", token }); } catch { /* Local logout already completed. */ }
});
for (const selector of ["#filter-role", "#filter-class", "#sort-by"]) $(selector).addEventListener("change", renderDashboard);
for (const selector of ["#public-filter-role", "#public-filter-class", "#public-sort-by"]) $(selector).addEventListener("change", renderPublicRoster);
$(".menu-toggle").addEventListener("click", () => {
  const open = $(".main-nav").classList.toggle("open");
  $(".menu-toggle").setAttribute("aria-expanded", String(open));
});
window.addEventListener("hashchange", route);
try { state.auth = JSON.parse(sessionStorage.getItem("hive_admin_auth") || "null"); } catch { state.auth = null; }
renderAllPickers();
route();
