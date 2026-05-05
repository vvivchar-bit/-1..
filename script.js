const USERS_KEY = "building18_users";
const LOG_KEY = "building18_access_log";

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime() {
  return new Date().toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

const demoUsersTemplate = [
  {
    fullName: "Іваненко Олександр Петрович",
    passId: "ST-001",
    role: "Студент",
    department: "аІК-43",
    status: "Активний",
    validUntil: "2027-06-30",
    note: "Постійний доступ для студента групи"
  },
  {
    fullName: "Ковальчук Марина Ігорівна",
    passId: "TC-014",
    role: "Викладач",
    department: "Кафедра програмного забезпечення",
    status: "Активний",
    validUntil: "2027-12-31",
    note: "Доступ у робочий час"
  },
  {
    fullName: "Мельник Андрій Васильович",
    passId: "WK-022",
    role: "Працівник",
    department: "Адміністративний відділ",
    status: "Активний",
    validUntil: "2027-12-31",
    note: "Службовий доступ"
  },
  {
    fullName: "Петренко Сергій Олегович",
    passId: "VS-101",
    role: "Відвідувач",
    department: "Тимчасовий відвідувач",
    status: "Активний",
    validUntil: "2026-12-31",
    note: "Разовий дозвіл"
  },
  {
    fullName: "Сидоренко Олена Вікторівна",
    passId: "ST-009",
    role: "Студент",
    department: "КН-22",
    status: "Заблокований",
    validUntil: "2027-06-30",
    note: "Доступ тимчасово заблоковано"
  }
];

function buildDemoUsers() {
  return demoUsersTemplate.map((user) => ({ ...user, id: createId() }));
}

function buildDemoLog() {
  return [
    {
      id: createId(),
      dateTime: formatDateTime(),
      fullName: "Іваненко Олександр Петрович",
      passId: "ST-001",
      direction: "Вхід",
      result: "Дозволено",
      reason: "Активний пропуск"
    }
  ];
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function initializeStorage() {
  if (!localStorage.getItem(USERS_KEY)) {
    saveUsers(buildDemoUsers());
  }
  if (!localStorage.getItem(LOG_KEY)) {
    saveLog(buildDemoLog());
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function isDateExpired(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validDate = new Date(`${dateString}T00:00:00`);
  return validDate < today;
}

function getAccessState(user) {
  if (user.status === "Заблокований") {
    return { label: "Заблокований", className: "danger", allowed: false, reason: "Пропуск заблоковано" };
  }
  if (isDateExpired(user.validUntil)) {
    return { label: "Термін минув", className: "warning", allowed: false, reason: "Термін дії пропуску завершився" };
  }
  return { label: "Активний", className: "success", allowed: true, reason: "Активний пропуск" };
}

function getStatusBadge(userOrStatus) {
  const state = typeof userOrStatus === "string"
    ? { label: userOrStatus, className: userOrStatus === "Активний" ? "success" : "danger" }
    : getAccessState(userOrStatus);

  return `<span class="badge ${state.className}">${escapeHtml(state.label)}</span>`;
}

function renderStats() {
  const users = getUsers();
  const log = getLog();

  document.getElementById("totalUsers").textContent = users.length;
  document.getElementById("activeUsers").textContent = users.filter((user) => getAccessState(user).allowed).length;
  document.getElementById("blockedUsers").textContent = users.filter((user) => user.status === "Заблокований").length;
  document.getElementById("logCount").textContent = log.length;
}

function renderUsers() {
  const searchInput = document.getElementById("userSearch");
  const query = normalizeText(searchInput.value);
  const users = getUsers().filter((user) => {
    const searchText = `${user.fullName} ${user.passId} ${user.role} ${user.department}`.toLowerCase();
    return searchText.includes(query);
  });

  const table = document.getElementById("usersTable");
  table.innerHTML = "";

  if (users.length === 0) {
    table.innerHTML = `<tr><td colspan="5" class="muted">Користувачів не знайдено.</td></tr>`;
    return;
  }

  users.forEach((user) => {
    const validText = user.validUntil
      ? `<br><small class="muted">діє до ${escapeHtml(user.validUntil)}</small>`
      : `<br><small class="muted">термін не вказано</small>`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${escapeHtml(user.fullName)}</strong><br>
        <small class="muted">${escapeHtml(user.department || "Без підрозділу")}</small>
      </td>
      <td>${escapeHtml(user.passId)}${validText}</td>
      <td>${escapeHtml(user.role)}</td>
      <td>${getStatusBadge(user)}</td>
      <td>
        <button class="small-btn" data-action="toggle" data-id="${escapeHtml(user.id)}" type="button">
          ${user.status === "Активний" ? "Блокувати" : "Активувати"}
        </button>
        <button class="small-btn danger" data-action="delete" data-id="${escapeHtml(user.id)}" type="button">Видалити</button>
      </td>
    `;
    table.appendChild(row);
  });
}

function renderLog() {
  const log = getLog();
  const table = document.getElementById("logTable");
  const recentTable = document.getElementById("recentLogTable");
  table.innerHTML = "";
  recentTable.innerHTML = "";

  if (log.length === 0) {
    table.innerHTML = `<tr><td colspan="6" class="muted">Журнал порожній.</td></tr>`;
    recentTable.innerHTML = `<tr><td colspan="4" class="muted">Подій ще немає.</td></tr>`;
    return;
  }

  [...log].reverse().forEach((item) => {
    const resultClass = item.result === "Дозволено" ? "success" : "danger";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.dateTime)}</td>
      <td>${escapeHtml(item.fullName)}</td>
      <td>${escapeHtml(item.passId)}</td>
      <td>${escapeHtml(item.direction)}</td>
      <td><span class="badge ${resultClass}">${escapeHtml(item.result)}</span></td>
      <td>${escapeHtml(item.reason)}</td>
    `;
    table.appendChild(row);
  });

  [...log].reverse().slice(0, 5).forEach((item) => {
    const resultClass = item.result === "Дозволено" ? "success" : "danger";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.dateTime)}</td>
      <td>${escapeHtml(item.fullName)}</td>
      <td>${escapeHtml(item.direction)}</td>
      <td><span class="badge ${resultClass}">${escapeHtml(item.result)}</span></td>
    `;
    recentTable.appendChild(row);
  });
}

function renderAll() {
  renderStats();
  renderUsers();
  renderLog();
}

function addUser(event) {
  event.preventDefault();

  const users = getUsers();
  const passId = document.getElementById("passId").value.trim().toUpperCase();

  const duplicate = users.some((user) => user.passId.toUpperCase() === passId);
  if (duplicate) {
    alert("Користувач із таким номером пропуску вже існує.");
    return;
  }

  const newUser = {
    id: createId(),
    fullName: document.getElementById("fullName").value.trim(),
    passId,
    role: document.getElementById("role").value,
    department: document.getElementById("department").value.trim(),
    status: document.getElementById("status").value,
    validUntil: document.getElementById("validUntil").value,
    note: document.getElementById("note").value.trim()
  };

  users.push(newUser);
  saveUsers(users);
  event.target.reset();
  renderAll();
}

function findUser(query) {
  const normalizedQuery = normalizeText(query);
  return getUsers().find((user) => {
    return normalizeText(user.passId) === normalizedQuery || normalizeText(user.fullName).includes(normalizedQuery);
  });
}

function addLogEntry(entry) {
  const log = getLog();
  log.push({ id: createId(), ...entry });
  saveLog(log);
}

function checkAccess(event) {
  event.preventDefault();

  const query = document.getElementById("accessQuery").value;
  const direction = document.getElementById("accessDirection").value;
  const user = findUser(query);
  const resultContainer = document.getElementById("accessResult");

  let entry;

  if (!user) {
    entry = {
      dateTime: formatDateTime(),
      fullName: query.trim(),
      passId: "—",
      direction,
      result: "Заборонено",
      reason: "Користувача не знайдено"
    };
    resultContainer.innerHTML = `
      <h3>Результат перевірки</h3>
      <p class="result-title denied">Доступ заборонено</p>
      <p class="muted">Користувача не знайдено у базі даних.</p>
    `;
  } else {
    const state = getAccessState(user);
    entry = {
      dateTime: formatDateTime(),
      fullName: user.fullName,
      passId: user.passId,
      direction,
      result: state.allowed ? "Дозволено" : "Заборонено",
      reason: state.reason
    };

    const message = state.allowed
      ? "Особа має право доступу до 18 корпусу."
      : state.reason;

    resultContainer.innerHTML = createResultHtml(user, state.allowed, message);
  }

  addLogEntry(entry);
  renderAll();
}

function createResultHtml(user, isAllowed, message) {
  const title = isAllowed ? "Доступ дозволено" : "Доступ заборонено";
  const className = isAllowed ? "allowed" : "denied";
  return `
    <h3>Результат перевірки</h3>
    <p class="result-title ${className}">${title}</p>
    <p>${escapeHtml(message)}</p>
    <div class="person-info">
      <span><strong>ПІБ:</strong> ${escapeHtml(user.fullName)}</span>
      <span><strong>Пропуск:</strong> ${escapeHtml(user.passId)}</span>
      <span><strong>Категорія:</strong> ${escapeHtml(user.role)}</span>
      <span><strong>Підрозділ:</strong> ${escapeHtml(user.department || "—")}</span>
      <span><strong>Термін дії:</strong> ${escapeHtml(user.validUntil || "не вказано")}</span>
      <span><strong>Примітка:</strong> ${escapeHtml(user.note || "—")}</span>
    </div>
  `;
}

function handleUserTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const users = getUsers();
  const user = users.find((item) => item.id === id);

  if (!user) return;

  if (action === "toggle") {
    user.status = user.status === "Активний" ? "Заблокований" : "Активний";
    saveUsers(users);
    renderAll();
  }

  if (action === "delete") {
    const confirmed = confirm(`Видалити користувача "${user.fullName}"?`);
    if (!confirmed) return;
    saveUsers(users.filter((item) => item.id !== id));
    renderAll();
  }
}

function exportCsv() {
  const log = getLog();
  if (log.length === 0) {
    alert("Журнал порожній. Немає даних для експорту.");
    return;
  }

  const header = ["Дата і час", "ПІБ", "Пропуск", "Дія", "Результат", "Причина"];
  const rows = log.map((item) => [
    item.dateTime,
    item.fullName,
    item.passId,
    item.direction,
    item.result,
    item.reason
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "building18_access_log.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function resetDemoData() {
  const confirmed = confirm("Відновити демонстраційні дані? Поточні користувачі та журнал будуть замінені.");
  if (!confirmed) return;
  saveUsers(buildDemoUsers());
  saveLog(buildDemoLog());
  renderAll();
}

function clearAllData() {
  const confirmed = confirm("Очистити всі дані системи?");
  if (!confirmed) return;
  saveUsers([]);
  saveLog([]);
  renderAll();
}

function clearLog() {
  const confirmed = confirm("Очистити журнал входів і виходів?");
  if (!confirmed) return;
  saveLog([]);
  renderAll();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("userForm").addEventListener("submit", addUser);
  document.getElementById("accessForm").addEventListener("submit", checkAccess);
  document.getElementById("usersTable").addEventListener("click", handleUserTableClick);
  document.getElementById("userSearch").addEventListener("input", renderUsers);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  document.getElementById("clearLogBtn").addEventListener("click", clearLog);
  document.getElementById("seedDataBtn").addEventListener("click", resetDemoData);
  document.getElementById("clearAllBtn").addEventListener("click", clearAllData);
}

initializeStorage();
bindEvents();
renderAll();
