"use strict";

// Frontend demo only. Tasks live in memory and reset on page refresh.
const sampleTasks = [
  { id: 4, title: "Bring the next big idea to life", completed: false },
  { id: 3, title: "Plan this week's priorities", completed: false },
  { id: 2, title: "Explore the FlowTask workspace", completed: false },
  { id: 1, title: "Make space for a fresh start", completed: true }
];
const state = { tasks: [], filter: "all", nextId: 5 };
const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "connectWalletButton", "walletDialog", "closeWalletDialog", "dismissWalletDialog",
    "taskForm", "taskInput", "formError", "taskList", "taskAnnouncement",
    "totalStat", "activeStat", "completedStat", "allCount", "taskTotalLabel",
    "completionLabel", "progressBar", "progressFill", "toastRegion"
  ].forEach((id) => { elements[id] = document.getElementById(id); });

  elements.taskForm.addEventListener("submit", createTask);
  elements.taskInput.addEventListener("input", clearInputError);
  elements.connectWalletButton.addEventListener("click", connectWallet);
  elements.closeWalletDialog.addEventListener("click", () => elements.walletDialog.close());
  elements.dismissWalletDialog.addEventListener("click", () => elements.walletDialog.close());
  elements.walletDialog.addEventListener("click", (event) => {
    const bounds = elements.walletDialog.getBoundingClientRect();
    if (event.target === elements.walletDialog && (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    )) elements.walletDialog.close();
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });
  loadTasks();
  refreshIcons();
});

// Shows a preview message without requesting wallet access.
function connectWallet() {
  elements.walletDialog.showModal();
}

function loadTasks() {
  state.tasks = sampleTasks.map((task) => ({ ...task }));
  updateDashboard();
  renderTasks();
}

// Adds a demo task without storage or transactions.
function createTask(event) {
  event.preventDefault();
  const title = elements.taskInput.value.trim();
  if (!title || title.length > 160) {
    elements.formError.hidden = false;
    elements.formError.textContent = !title
      ? "Give your task a name to get started."
      : "Please keep your task to 160 characters or fewer.";
    elements.taskInput.setAttribute("aria-invalid", "true");
    elements.taskInput.focus();
    return;
  }

  const task = { id: state.nextId++, title, completed: false };
  state.tasks.unshift(task);
  elements.taskInput.value = "";
  clearInputError();
  updateDashboard();
  // Make the new task visible even from the completed filter.
  setFilter(state.filter === "completed" ? "all" : state.filter, task.id);
  elements.taskInput.focus();
  elements.taskAnnouncement.textContent = `Demo task added: ${title}`;
  showToast("A little progress starts here.", "Task added to your demo session.");
}

function clearInputError() {
  elements.formError.hidden = true;
  elements.formError.textContent = "";
  elements.taskInput.removeAttribute("aria-invalid");
}

// Completion is a local UI interaction for this frontend preview.
function completeTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task || task.completed) return;
  task.completed = true;
  updateDashboard();

  const card = document.getElementById(`task-${taskId}`);
  const checkbox = card?.querySelector("button");
  const restoreFocus = document.activeElement === checkbox;
  if (card && checkbox) {
    card.classList.add("completed");
    checkbox.disabled = true;
    checkbox.setAttribute("aria-label", `Completed: ${task.title}`);
    card.querySelector(".status-pill").textContent = "Completed";
    card.querySelector(".task-meta").textContent = `DEMO-${String(task.id).padStart(3, "0")} · Completed`;
    // Keep keyboard navigation in the task list after completing an item.
    const nextCheckbox = elements.taskList.querySelector(".task-check:not(:disabled)");
    if (restoreFocus) {
      (nextCheckbox || elements.taskInput).focus();
    }
  }
  // Allow the check animation to finish before removing a filtered row.
  if (state.filter === "active") window.setTimeout(() => {
    renderTasks();
    if (restoreFocus) {
      (elements.taskList.querySelector(".task-check:not(:disabled)") || elements.taskInput).focus();
    }
  }, 280);
  elements.taskAnnouncement.textContent = `Demo task completed: ${task.title}`;
}

function renderTasks(newTaskId = null) {
  const filtered = state.tasks.filter((task) => (
    state.filter === "all" || (state.filter === "completed" ? task.completed : !task.completed)
  ));
  elements.taskList.replaceChildren();
  elements.taskTotalLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "task" : "tasks"}${state.filter === "all" ? " in your workspace" : " in this view"}`;

  if (!filtered.length) {
    renderEmptyState();
    return;
  }
  filtered.forEach((task) => {
    const card = document.createElement("li");
    card.id = `task-${task.id}`;
    card.className = `task-card${task.completed ? " completed" : ""}${task.id === newTaskId ? " just-added" : ""}`;

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = "task-check";
    checkbox.disabled = task.completed;
    checkbox.setAttribute("aria-label", `${task.completed ? "Completed:" : "Complete"} ${task.title}`);
    checkbox.innerHTML = '<i data-lucide="check" aria-hidden="true"></i>';
    checkbox.addEventListener("click", () => completeTask(task.id));

    const copy = document.createElement("div");
    copy.className = "task-copy";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("span");
    meta.className = "task-meta";
    meta.textContent = `DEMO-${String(task.id).padStart(3, "0")} · ${task.completed ? "Completed" : "Personal workspace"}`;
    copy.append(title, meta);

    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = task.completed ? "Completed" : "In progress";
    card.append(checkbox, copy, status);
    elements.taskList.append(card);
  });
  refreshIcons();
}

function renderEmptyState() {
  const messages = {
    all: ["A fresh page. A fresh start.", "Add your first task above and take it one step at a time."],
    active: ["A moment to breathe.", "All caught up. Add a new task whenever you're ready."],
    completed: ["Your wins will live here.", "Complete a task and watch your progress grow."]
  };
  const [title, description] = messages[state.filter];
  const empty = document.createElement("li");
  empty.className = "empty-state";
  empty.innerHTML = `<div class="empty-icon"><i data-lucide="${state.filter === "active" ? "coffee" : "list-checks"}"></i></div><h3>${title}</h3><p>${description}</p>`;
  elements.taskList.append(empty);
  refreshIcons();
}

function setFilter(filter, newTaskId = null) {
  state.filter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderTasks(newTaskId);
}

// Derive counts and progress from the same in-memory task collection.
function updateDashboard() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  elements.totalStat.textContent = total;
  elements.activeStat.textContent = total - completed;
  elements.completedStat.textContent = completed;
  elements.allCount.textContent = total;
  elements.completionLabel.textContent = `${percent}% complete`;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(percent));
}

function showToast(title, message) {
  elements.toastRegion.replaceChildren();
  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.innerHTML = '<i data-lucide="check"></i>';
  const copy = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const description = document.createElement("p");
  description.textContent = message;
  copy.append(heading, description);
  toast.append(icon, copy);
  elements.toastRegion.append(toast);
  refreshIcons();
  window.setTimeout(() => toast.remove(), 3500);
}

function refreshIcons() {
  window.lucide?.createIcons();
}
