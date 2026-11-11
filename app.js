/**
 * Asset & License Tracker - Client-Side Web Application
 * Faithful implementation of finalproject05 Python CLI logic.
 * No backend, no server, pure HTML5/CSS3/JavaScript with LocalStorage.
 */

// Initial seed data from inventory.csv
const INITIAL_INVENTORY = [
  { id: 1, name: "MacBook Pro 16 M2", type: "Hardware", assigned_to: "Robbie Williams", status: "Assigned", expiration_date: "N/A" },
  { id: 2, name: "Dell XPS 15", type: "Hardware", assigned_to: "None", status: "Retired", expiration_date: "N/A" },
  { id: 3, name: "JetBrains All Products Pack", type: "Software License", assigned_to: "None", status: "Available", expiration_date: "2024-01-15" },
  { id: 4, name: "Office 365 Enterprise", type: "Software License", assigned_to: "Sarah Connor", status: "Assigned", expiration_date: "2027-12-31" },
  { id: 5, name: "Logitech MX Master 3S", type: "Hardware", assigned_to: "None", status: "Under Repair", expiration_date: "N/A" },
  { id: 6, name: "AWS Cloud Architect License", type: "Software License", assigned_to: "Robbie Williams", status: "Assigned", expiration_date: "2023-11-01" },
  { id: 7, name: "Lenovo ThinkPad T14", type: "Hardware", assigned_to: "None", status: "Available", expiration_date: "N/A" },
  { id: 8, name: "Adobe Creative Cloud", type: "Software License", assigned_to: "Alex Murphy", status: "Assigned", expiration_date: "2024-05-20" },
  { id: 9, name: "iPhone 15 Plus", type: "Hardware", assigned_to: "None", status: "Available", expiration_date: "N/A" }
];

const STORAGE_KEY = "asset_tracker_inventory_data";
const THEME_KEY = "asset_tracker_theme";

// State
let items = [];

// ==================== STORAGE & INITIALIZATION ====================

function init() {
  loadTheme();
  loadData();
  setupEventListeners();
  render();
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      items = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored data, loading default seed", e);
      items = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
      saveData();
    }
  } else {
    items = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    saveData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function resetToDefault() {
  if (confirm("האם לשחזר את נתוני המאגר המקוריים מקובץ inventory.csv? כל השינויים יאופסו.")) {
    items = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    saveData();
    render();
    showToast("המאגר שוחזר בהצלחה למצב המקורי", "success");
  }
}

// ==================== THEME (DARK / LIGHT) ====================

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
}

// ==================== BUSINESS LOGIC (Reverse-Engineered from CLI) ====================

function generateNextId() {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(it => it.id)) + 1;
}

function checkIsExpired(item, referenceDate = new Date()) {
  if (!item.expiration_date || item.expiration_date.toUpperCase() === "N/A" || item.expiration_date.toUpperCase() === "NONE") {
    return { isExpired: false, note: "ללא תאריך תפוגה" };
  }

  const expDate = new Date(item.expiration_date + "T00:00:00");
  if (isNaN(expDate.getTime())) {
    return { isExpired: false, note: `פורמט שגוי (${item.expiration_date})` };
  }

  // Set today to start of day for comparison
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  if (expDate < ref) {
    const diffTime = Math.abs(ref - expDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { isExpired: true, note: `פג תוקף ב-${item.expiration_date} (לפני ${diffDays} ימים)` };
  }

  return { isExpired: false, note: `בתוקף עד ${item.expiration_date}` };
}

function checkoutItem(itemId, employeeName) {
  const item = items.find(it => it.id === itemId);
  if (!item) {
    throw new Error(`פריט מזהה ${itemId} לא נמצא במאגר.`);
  }

  if (item.status !== "Available") {
    throw new Error(`הפריט '${item.name}' (ID ${item.id}) אינו זמין להשאלה (סטטוס נוכחי: ${item.status}).`);
  }

  const trimmedEmp = employeeName.trim();
  if (!trimmedEmp) {
    throw new Error("שם העובד הינו שדה חובה ולא יכול להישאר ריק.");
  }

  // Bug Fix & Quality Improvement: Alert if license is expired
  const expCheck = checkIsExpired(item);
  let warning = "";
  if (expCheck.isExpired) {
    warning = `שים לב: רישיון זה פג תוקף (${item.expiration_date})!`;
  }

  item.status = "Assigned";
  item.assigned_to = trimmedEmp;
  saveData();
  render();
  return { item, warning };
}

function returnItem(itemId, newStatus) {
  const item = items.find(it => it.id === itemId);
  if (!item) {
    throw new Error(`פריט מזהה ${itemId} לא נמצא במאגר.`);
  }

  const validStatuses = ["Available", "Under Repair", "Retired"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`סטטוס החזרה חייב להיות אחד מ: ${validStatuses.join(", ")}`);
  }

  item.status = newStatus;
  item.assigned_to = "None";
  saveData();
  render();
  return item;
}

function addItem(name, type, expirationDate = "N/A") {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("שם הפריט או הרישיון לא יכול להיות ריק.");
  }

  if (type !== "Hardware" && type !== "Software License") {
    throw new Error("סוג הפריט חייב להיות 'Hardware' או 'Software License'.");
  }

  const newId = generateNextId();
  const newItem = {
    id: newId,
    name: trimmedName,
    type: type,
    assigned_to: "None",
    status: "Available",
    expiration_date: expirationDate ? expirationDate.trim() : "N/A"
  };

  items.push(newItem);
  saveData();
  render();
  return newItem;
}

function generateMissingAndExpiredReport() {
  const now = new Date();
  const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

  const expiredItems = [];
  const underRepairItems = [];
  const retiredItems = [];

  items.forEach(item => {
    const expInfo = checkIsExpired(item, now);
    if (expInfo.isExpired) {
      expiredItems.push({ item, note: expInfo.note });
    }
    if (item.status === "Under Repair") {
      underRepairItems.push(item);
    } else if (item.status === "Retired") {
      retiredItems.push(item);
    }
  });

  const totalIssues = expiredItems.length + underRepairItems.length + retiredItems.length;

  let lines = [];
  lines.push("=".repeat(80));
  lines.push("          INVENTORY REPORT: MISSING, EXPIRED & ACTION REQUIRED");
  lines.push(`          Generated on: ${nowStr}`);
  lines.push("=".repeat(80));
  lines.push("");

  // 1. Expired
  lines.push(`1. EXPIRED ASSETS & LICENSES (${expiredItems.length} found)`);
  lines.push("-".repeat(80));
  if (expiredItems.length === 0) {
    lines.push("   [✓] No expired licenses or assets found.");
  } else {
    lines.push(`   ${"ID".padEnd(5)} | ${"Name".padEnd(27)} | ${"Type".padEnd(16)} | ${"Status".padEnd(12)} | Expiration Details`);
    lines.push("   " + "-".repeat(75));
    expiredItems.forEach(({ item, note }) => {
      lines.push(`   ${String(item.id).padEnd(5)} | ${item.name.padEnd(27)} | ${item.type.padEnd(16)} | ${item.status.padEnd(12)} | ${note}`);
    });
  }
  lines.push("");

  // 2. Under Repair
  lines.push(`2. ITEMS UNDER REPAIR / MISSING FROM SERVICE (${underRepairItems.length} found)`);
  lines.push("-".repeat(80));
  if (underRepairItems.length === 0) {
    lines.push("   [✓] No items currently under repair.");
  } else {
    lines.push(`   ${"ID".padEnd(5)} | ${"Name".padEnd(27)} | ${"Type".padEnd(16)} | Last Assignee`);
    lines.push("   " + "-".repeat(75));
    underRepairItems.forEach(item => {
      lines.push(`   ${String(item.id).padEnd(5)} | ${item.name.padEnd(27)} | ${item.type.padEnd(16)} | ${item.assigned_to}`);
    });
  }
  lines.push("");

  // 3. Retired
  lines.push(`3. RETIRED / DECOMMISSIONED ITEMS (${retiredItems.length} found)`);
  lines.push("-".repeat(80));
  if (retiredItems.length === 0) {
    lines.push("   [✓] No retired items.");
  } else {
    lines.push(`   ${"ID".padEnd(5)} | ${"Name".padEnd(27)} | ${"Type".padEnd(16)} | Expiration`);
    lines.push("   " + "-".repeat(75));
    retiredItems.forEach(item => {
      lines.push(`   ${String(item.id).padEnd(5)} | ${item.name.padEnd(27)} | ${item.type.padEnd(16)} | ${item.expiration_date}`);
    });
  }
  lines.push("");

  lines.push("=".repeat(80));
  lines.push(`SUMMARY: Total action items identified: ${totalIssues}`);
  lines.push("=".repeat(80));

  const reportContent = lines.join("\n") + "\n";
  return { reportContent, totalIssues, timestamp: nowStr };
}

function exportCsvFile() {
  const headers = ["id", "name", "type", "assigned_to", "status", "expiration_date"];
  const rows = items.map(item => {
    return [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      `"${item.assigned_to}"`,
      `"${item.status}"`,
      `"${item.expiration_date}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  downloadFile(csvContent, "inventory.csv", "text/csv;charset=utf-8;");
  showToast("קובץ inventory.csv נשמר והורד בהצלחה!", "success");
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== RENDERING & UI ====================

function render() {
  renderStats();
  renderTable();
  updateCheckoutOptions();
  updateReturnOptions();
  document.getElementById("add-next-id-preview").textContent = generateNextId();
}

function renderStats() {
  const total = items.length;
  const available = items.filter(it => it.status === "Available").length;
  const assigned = items.filter(it => it.status === "Assigned").length;
  const maintenance = items.filter(it => it.status === "Under Repair" || it.status === "Retired").length;
  const expired = items.filter(it => checkIsExpired(it).isExpired).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-available").textContent = available;
  document.getElementById("stat-assigned").textContent = assigned;
  document.getElementById("stat-maintenance").textContent = maintenance;
  document.getElementById("stat-expired").textContent = expired;
  document.getElementById("items-count-badge").textContent = `${total} פריטים במאגר`;
}

function renderTable() {
  const tbody = document.getElementById("inventory-table-body");
  const searchVal = document.getElementById("search-input").value.trim().toLowerCase();
  const filterType = document.getElementById("filter-type").value;
  const filterStatus = document.getElementById("filter-status").value;

  const filtered = items.filter(item => {
    // Type filter
    if (filterType !== "ALL" && item.type !== filterType) return false;
    // Status filter
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    // Search query
    if (searchVal) {
      const matchName = item.name.toLowerCase().includes(searchVal);
      const matchEmp = item.assigned_to.toLowerCase().includes(searchVal);
      const matchId = String(item.id).includes(searchVal);
      return matchName || matchEmp || matchId;
    }
    return true;
  });

  const emptyMsg = document.getElementById("no-results-msg");
  if (filtered.length === 0) {
    tbody.innerHTML = "";
    emptyMsg.classList.remove("hidden");
    return;
  } else {
    emptyMsg.classList.add("hidden");
  }

  tbody.innerHTML = filtered.map(item => {
    const expInfo = checkIsExpired(item);
    const statusClass = item.status.toLowerCase().replace(/\s+/g, "-");
    
    let expDisplay = `<span class="expiration-cell">${item.expiration_date}</span>`;
    if (expInfo.isExpired) {
      expDisplay = `<span class="expired-tag" title="${expInfo.note}">⚠️ ${item.expiration_date} (פג תוקף)</span>`;
    }

    const typeIcon = item.type === "Hardware" ? "💻" : "🔑";

    // Action button
    let quickActionBtn = "";
    if (item.status === "Available") {
      quickActionBtn = `<button class="btn btn-primary btn-sm" onclick="quickCheckout(${item.id})">השאל</button>`;
    } else {
      quickActionBtn = `<button class="btn btn-secondary btn-sm" onclick="quickReturn(${item.id})">החזר / עדכן</button>`;
    }

    return `
      <tr>
        <td class="id-cell">#${item.id}</td>
        <td class="item-name-cell">${escapeHtml(item.name)}</td>
        <td><span class="type-pill">${typeIcon} ${escapeHtml(item.type)}</span></td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(item.status)}</span></td>
        <td><strong>${escapeHtml(item.assigned_to)}</strong></td>
        <td>${expDisplay}</td>
        <td class="table-actions-cell">${quickActionBtn}</td>
      </tr>
    `;
  }).join("");
}

function updateCheckoutOptions() {
  const select = document.getElementById("checkout-item-select");
  const availableItems = items.filter(it => it.status === "Available");

  if (availableItems.length === 0) {
    select.innerHTML = `<option value="">אין פריטים פנויים להשאלה כרגע</option>`;
    select.disabled = true;
    document.getElementById("checkout-item-info").textContent = "כל הפריטים מושאלים, בתיקון או הושבתו.";
    return;
  }

  select.disabled = false;
  select.innerHTML = availableItems.map(it => {
    const expInfo = checkIsExpired(it);
    const expSuffix = expInfo.isExpired ? " [⚠️ פג תוקף!]" : "";
    return `<option value="${it.id}">[ID: ${it.id}] ${escapeHtml(it.name)} (${it.type})${expSuffix}</option>`;
  }).join("");

  handleCheckoutSelectChange();
}

function handleCheckoutSelectChange() {
  const select = document.getElementById("checkout-item-select");
  const warningBox = document.getElementById("checkout-warning-box");
  const hint = document.getElementById("checkout-item-info");

  const itemId = parseInt(select.value, 10);
  const item = items.find(it => it.id === itemId);

  if (!item) {
    warningBox.classList.add("hidden");
    hint.textContent = "";
    return;
  }

  const expInfo = checkIsExpired(item);
  if (expInfo.isExpired) {
    warningBox.innerHTML = `⚠️ <strong>אזהרת תוקף:</strong> רישיון זה פג תוקפו בתאריך ${item.expiration_date}! (${expInfo.note})`;
    warningBox.classList.remove("hidden");
  } else {
    warningBox.classList.add("hidden");
  }

  hint.textContent = `סוג: ${item.type} | תפוגה: ${item.expiration_date}`;
}

function updateReturnOptions() {
  const select = document.getElementById("return-item-select");
  if (items.length === 0) {
    select.innerHTML = `<option value="">אין פריטים במאגר</option>`;
    return;
  }

  select.innerHTML = items.map(it => {
    return `<option value="${it.id}">[ID: ${it.id}] ${escapeHtml(it.name)} (סטטוס נוכחי: ${it.status}, עובד: ${it.assigned_to})</option>`;
  }).join("");

  handleReturnSelectChange();
}

function handleReturnSelectChange() {
  const select = document.getElementById("return-item-select");
  const preview = document.getElementById("return-current-details");
  const itemId = parseInt(select.value, 10);
  const item = items.find(it => it.id === itemId);

  if (!item) {
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = `פרטי פריט: <strong>${escapeHtml(item.name)}</strong> | סוג: ${item.type} | סטטוס קיים: <strong>${item.status}</strong> | שיוך: <strong>${item.assigned_to}</strong>`;
}

// Quick action shortcuts from table row
window.quickCheckout = function(itemId) {
  openModal("modal-checkout");
  const select = document.getElementById("checkout-item-select");
  select.value = itemId;
  handleCheckoutSelectChange();
  document.getElementById("checkout-employee-name").focus();
};

window.quickReturn = function(itemId) {
  openModal("modal-return");
  const select = document.getElementById("return-item-select");
  select.value = itemId;
  handleReturnSelectChange();
};

// ==================== MODAL HELPERS ====================

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("hidden");
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Theme Toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  document.getElementById("btn-reset-data").addEventListener("click", resetToDefault);

  // Filters & Search
  document.getElementById("search-input").addEventListener("input", renderTable);
  document.getElementById("filter-type").addEventListener("change", renderTable);
  document.getElementById("filter-status").addEventListener("change", renderTable);

  // Actions Bar Buttons
  document.getElementById("btn-open-checkout").addEventListener("click", () => {
    updateCheckoutOptions();
    openModal("modal-checkout");
  });

  document.getElementById("btn-open-return").addEventListener("click", () => {
    updateReturnOptions();
    openModal("modal-return");
  });

  document.getElementById("btn-open-report").addEventListener("click", () => {
    const reportData = generateMissingAndExpiredReport();
    document.getElementById("report-issues-count").textContent = reportData.totalIssues;
    document.getElementById("report-timestamp").textContent = reportData.timestamp;
    document.getElementById("report-text-preview").textContent = reportData.reportContent;
    openModal("modal-report");
  });

  document.getElementById("btn-open-add").addEventListener("click", () => {
    document.getElementById("form-add-item").reset();
    document.getElementById("add-expiration-group").classList.add("hidden");
    document.getElementById("add-date-input-wrap").classList.add("hidden");
    document.getElementById("add-next-id-preview").textContent = generateNextId();
    openModal("modal-add");
  });

  document.getElementById("btn-export-csv").addEventListener("click", exportCsvFile);

  // Modal Closers
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.getAttribute("data-close");
      closeModal(modalId);
    });
  });

  // Close modals on clicking overlay outside card
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
      }
    });
  });

  // Add Item Type Change (Toggle Expiration option)
  document.getElementById("add-type").addEventListener("change", (e) => {
    const isSoftware = e.target.value === "Software License";
    const group = document.getElementById("add-expiration-group");
    if (isSoftware) {
      group.classList.remove("hidden");
    } else {
      group.classList.add("hidden");
      document.getElementById("add-has-exp").checked = false;
      document.getElementById("add-date-input-wrap").classList.add("hidden");
    }
  });

  document.getElementById("add-has-exp").addEventListener("change", (e) => {
    const dateWrap = document.getElementById("add-date-input-wrap");
    if (e.target.checked) {
      dateWrap.classList.remove("hidden");
      document.getElementById("add-exp-date").required = true;
    } else {
      dateWrap.classList.add("hidden");
      document.getElementById("add-exp-date").required = false;
    }
  });

  // Select Change Listeners
  document.getElementById("checkout-item-select").addEventListener("change", handleCheckoutSelectChange);
  document.getElementById("return-item-select").addEventListener("change", handleReturnSelectChange);

  // Forms Submissions
  document.getElementById("form-checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    const select = document.getElementById("checkout-item-select");
    const itemId = parseInt(select.value, 10);
    const empName = document.getElementById("checkout-employee-name").value;

    try {
      const result = checkoutItem(itemId, empName);
      closeModal("modal-checkout");
      document.getElementById("checkout-employee-name").value = "";
      showToast(`הפריט '${result.item.name}' הושאל בהצלחה ל-${empName}!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("form-return").addEventListener("submit", (e) => {
    e.preventDefault();
    const select = document.getElementById("return-item-select");
    const itemId = parseInt(select.value, 10);
    const newStatus = document.getElementById("return-new-status").value;

    try {
      const updated = returnItem(itemId, newStatus);
      closeModal("modal-return");
      showToast(`הפריט '${updated.name}' הוחזר ועודכן לסטטוס '${newStatus}'.`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("form-add-item").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("add-name").value;
    const type = document.getElementById("add-type").value;
    const hasExp = document.getElementById("add-has-exp").checked;
    const expDate = hasExp ? document.getElementById("add-exp-date").value : "N/A";

    try {
      const added = addItem(name, type, expDate);
      closeModal("modal-add");
      showToast(`הפריט '${added.name}' נוסף בהצלחה עם מזהה #${added.id}!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Report Modal Actions
  document.getElementById("btn-copy-report").addEventListener("click", () => {
    const text = document.getElementById("report-text-preview").textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast("תוכן הדוח הועתק ללוח בהצלחה!", "info");
    }).catch(() => {
      showToast("נכשל בהעתקה ללוח", "error");
    });
  });

  document.getElementById("btn-download-report-txt").addEventListener("click", () => {
    const text = document.getElementById("report-text-preview").textContent;
    downloadFile(text, "missing_expired_report.txt", "text/plain;charset=utf-8;");
    showToast("הקובץ missing_expired_report.txt הורד בהצלחה!", "success");
  });

  // Keyboard shortcut: Escape to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach(modal => modal.classList.add("hidden"));
    }
  });
}

// ==================== TOAST MESSAGES ====================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" ? "✓" : (type === "error" ? "✕" : "ℹ");
  toast.innerHTML = `<span style="font-weight: bold;">${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 3500);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Kick off
document.addEventListener("DOMContentLoaded", init);

