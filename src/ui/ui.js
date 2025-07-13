import { filterTasks } from "../logic/filters";
import createProject from "../logic/projects";
import createTask from "../logic/tasks";
import { saveTodoList } from "../storage/storage";

export const initUI = (todoList) => {
  // --- DOM SELECTORS ---
  const DOM = {
    projectsList: document.getElementById("projects-list"),
    tasksList: document.getElementById("tasks-list"),
    currentProjectName: document.getElementById("current-project-name"),
    addProjectBtn: document.getElementById("add-project-btn"),
    addTaskBtn: document.getElementById("add-task-btn"),
    taskModal: document.getElementById("task-modal"),
    projectModal: document.getElementById("project-modal"),
    taskForm: document.getElementById("task-form"),
    projectForm: document.getElementById("project-form"),
    filterControls: document.querySelector(".filters"),
    taskProjectSelect: document.getElementById("task-project"),
    taskSearch: document.getElementById("task-search"),
    sortTasks: document.getElementById("sort-tasks"),
    taskNavItem: document.getElementById("task-nav-item"),
  };

  // --- APP STATE ---
  const state = {
    currentProjectId: "all", // all | orphan | projectId
    currentFilter: "all", // today, week, etc.
    editTaskId: null,
    searchQuery: "",
    sortOption: "dueDate-asc",
  };

  // --- INIT ---
  const init = () => {
    setupEventListeners();
    renderSidebar();
    handleProjectSelect("all"); // Par défaut → toutes les tâches
  };

  // --- RENDER SIDEBAR ---
  const renderSidebar = () => {
    DOM.taskNavItem.innerHTML = "";
    DOM.projectsList.innerHTML = "";

    // Lien "Toutes les tâches"
    const allItem = createProjectItem({
      id: "all",
      name: "Toutes les tâches",
      active: state.currentProjectId === "all",
    });
    DOM.taskNavItem.appendChild(allItem);

    // Lien "Tâches indépendantes"
    const orphanItem = createProjectItem({
      id: "orphan",
      name: "Tâches non-spècifiques",
      active: state.currentProjectId === "orphan",
    });
    DOM.taskNavItem.appendChild(orphanItem);

    // Projets
    todoList.getProjects().forEach((project) => {
      const projectItem = createProjectItem({
        id: project.id,
        name: project.name,
        taskCount: project.getTasks().length,
        active: state.currentProjectId === project.id,
      });
      DOM.projectsList.appendChild(projectItem);
    });
  };

  // --- CREATE SIDEBAR ITEM ---
  const createProjectItem = ({ id, name, taskCount, active }) => {
    const li = document.createElement("li");
    li.className = `project-item ${active ? "active" : ""}`;
    li.dataset.projectId = id;

    li.innerHTML = `
      <i class="fas ${
        id === "all"
          ? "fa-inbox"
          : id === "orphan"
          ? "fa-layer-group"
          : "fa-folder"
      }"></i>
      <span class="project-name">${name}</span>
      ${
        taskCount !== undefined
          ? `<span class="task-count">${taskCount}</span>`
          : ""
      }
      ${
        !(id === "all" || id === "orphan")
          ? '<button class="delete-project-btn"><i class="fas fa-trash"></i></button>'
          : ""
      }
    `;

    li.addEventListener("click", () => handleProjectSelect(id));

    if (!(id === "all" || id === "orphan")) {
      li.querySelector(".delete-project-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteProject(id);
      });
    }

    return li;
  };

  // --- SELECT PROJECT OR VIEW ---
  const handleProjectSelect = (projectId) => {
    state.currentProjectId = projectId;

    if (projectId === "all") {
      updateProjectName("Toutes les tâches");
    } else if (projectId === "orphan") {
      updateProjectName("Tâches non-spècifiques");
    } else {
      const project = todoList.getProjectById(projectId);
      updateProjectName(project?.name || "Projet inconnu");
    }

    updateActiveProjectInSidebar(projectId);
    renderTasks();
  };

  const updateActiveProjectInSidebar = (projectId) => {
    document.querySelectorAll(".project-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.projectId === projectId);
    });
  };

  const updateProjectName = (name) => {
    DOM.currentProjectName.textContent = name;
  };

  // --- RENDER TASKS ---
  const renderTasks = () => {
    DOM.tasksList.innerHTML = "";

    let tasks = [];

    if (state.currentProjectId === "all") {
      tasks = [
        ...todoList.getOrphanTasks(),
        ...todoList.getProjects().flatMap((p) => p.getTasks()),
      ];
    } else if (state.currentProjectId === "orphan") {
      tasks = todoList.getOrphanTasks();
    } else {
      const project = todoList.getProjectById(state.currentProjectId);
      tasks = project ? project.getTasks() : [];
    }

    // Filtres globaux
    let filteredTasks = filterTasks(tasks, state.currentFilter);

    // Recherche
    if (state.searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          (task.description &&
            task.description
              .toLowerCase()
              .includes(state.searchQuery.toLowerCase()))
      );
    }

    // Tri
    filteredTasks = sortTasks(filteredTasks, state.sortOption);

    if (filteredTasks.length === 0) {
      showEmptyState();
      return;
    }

    if (state.currentProjectId === "all") {
      renderTasksGroupedByProject(filteredTasks);
    } else {
      filteredTasks.forEach((task) => {
        DOM.tasksList.appendChild(createTaskElement(task));
      });
    }
  };

  const renderTasksGroupedByProject = (tasks) => {
    DOM.tasksList.innerHTML = "";

    const orphanTasks = tasks.filter((t) => !t.projectId);
    if (orphanTasks.length > 0) {
      DOM.tasksList.appendChild(
        createTasksSection("Tâches non-spècifiques", orphanTasks)
      );
    }

    const projects = todoList.getProjects();
    projects.forEach((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      if (projectTasks.length > 0) {
        DOM.tasksList.appendChild(
          createTasksSection(project.name, projectTasks)
        );
      }
    });
  };
  const createTasksSection = (title, tasks) => {
    const section = document.createElement("div");
    section.className = "tasks-section";

    const header = createTasksHeader(title, tasks.length);

    const group = document.createElement("div");
    group.className = "tasks-group";

    tasks.forEach((task) => {
      group.appendChild(createTaskElement(task));
    });

    section.appendChild(header);
    section.appendChild(group);

    return section;
  };

  const createTasksHeader = (title, count) => {
    const header = document.createElement("div");
    header.className = "tasks-section-header";
    header.innerHTML = `
      <h3>${title}</h3>
      <span class="task-count">${count}</span>
    `;
    return header;
  };

  const showEmptyState = () => {
    DOM.tasksList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <h3>Aucune tâche à afficher</h3>
        <p>${
          state.searchQuery
            ? "Aucun résultat pour votre recherche."
            : "Commencez par ajouter une nouvelle tâche."
        }</p>
      </div>
    `;
  };

  // --- TASK CARD ---
  const createTaskElement = (task) => {
    const card = document.createElement("div");
    card.className = `task-card ${task.priority}-priority ${
      task.completed ? "completed" : ""
    }`;
    card.dataset.taskId = task.id;

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const formattedDate = dueDate
      ? dueDate.toLocaleDateString("fr-FR")
      : "Non définie";

    card.innerHTML = `
      <div class="task-header">
        <input type="checkbox" ${
          task.completed ? "checked" : ""
        } class="task-checkbox">
        <div class="task-title">${task.title}</div>
        <div class="task-actions">
          <button class="btn-icon edit-btn"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete-btn"><i class="fas fa-trash"></i></button>
          <div class="dropdown">
            <button class="btn-icon move-btn"><i class="fas fa-folder"></i></button>
            <div class="dropdown-content">
              <span class="dropdown-title">Déplacer vers :</span>
              ${todoList
                .getProjects()
                .map(
                  (p) => `<a href="#" data-project-id="${p.id}">${p.name}</a>`
                )
                .join("")}
              ${
                task.projectId
                  ? `<a href="#" data-project-id="orphan">Tâches non-spécifiques</a>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
      ${
        task.description
          ? `<p class="task-description">${task.description}</p>`
          : ""
      }
      <div class="task-meta">
        <span class="task-due-date">
          <i class="far fa-calendar-alt"></i>
          ${formattedDate}
        </span>
        <span class="task-priority ${task.priority}">
          <i class="fas fa-exclamation-circle"></i>
          ${getPriorityLabel(task.priority)}
        </span>
      </div>
    `;

    // Events
    card.querySelector(".task-checkbox").addEventListener("change", () => {
      task.toggleCompleted();
      saveAndRefresh();
    });

    card.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskModal(task);
    });

    card.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Supprimer cette tâche ?")) {
        if (task.projectId) {
          const project = todoList.getProjectById(task.projectId);
          project?.removeTask(task.id);
        } else {
          todoList.removeOrphanTask(task.id);
        }
        saveAndRefresh();
      }
    });

    card.querySelector(".move-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      card.querySelector(".dropdown-content").classList.toggle("show");
    });

    card.querySelectorAll(".dropdown-content a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.dataset.projectId;
        todoList.moveTaskToProject(
          task.id,
          targetId === "orphan" ? null : targetId
        );
        saveAndRefresh();
      });
    });

    return card;
  };

  const sortTasks = (tasks, sortOption) => {
    const [field, direction] = sortOption.split("-");
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      let cmp = 0;
      switch (field) {
        case "dueDate":
          cmp = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case "priority":
          const order = { high: 3, medium: 2, low: 1 };
          cmp = order[b.priority] - order[a.priority];
          break;
        case "createdAt":
          cmp = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        default:
          cmp = a.title.localeCompare(b.title);
      }
      return direction === "desc" ? -cmp : cmp;
    });
  };

  const getPriorityLabel = (priority) => {
    return (
      {
        low: "Faible",
        medium: "Moyenne",
        high: "Haute",
      }[priority] || priority
    );
  };

  const saveAndRefresh = () => {
    saveTodoList(todoList);
    renderSidebar();
    renderTasks();
  };

  // --- EVENTS ---
  const setupEventListeners = () => {
    DOM.filterControls.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (btn) {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.currentFilter = btn.dataset.filter;
        renderTasks();
      }
    });

    DOM.taskSearch.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.trim();
      renderTasks();
    });

    DOM.sortTasks.addEventListener("change", (e) => {
      state.sortOption = e.target.value;
      renderTasks();
    });

    DOM.addProjectBtn.addEventListener("click", () => {
      DOM.projectModal.style.display = "flex";
      DOM.projectForm.reset();
    });

    DOM.addTaskBtn.addEventListener("click", () => {
      openTaskModal();
    });

    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", closeAllModals);
    });

    window.addEventListener("click", (e) => {
      if (e.target === DOM.taskModal || e.target === DOM.projectModal) {
        closeAllModals();
      }
      document.querySelectorAll(".dropdown-content.show").forEach((drop) => {
        if (!drop.contains(e.target) && !e.target.closest(".move-btn")) {
          drop.classList.remove("show");
        }
      });
    });

    DOM.taskForm.addEventListener("submit", handleTaskSubmit);
    DOM.projectForm.addEventListener("submit", handleProjectSubmit);
  };

  const closeAllModals = () => {
    DOM.taskModal.style.display = "none";
    DOM.projectModal.style.display = "none";
    state.editTaskId = null;
  };

  const openTaskModal = (task = null) => {
    DOM.taskModal.style.display = "flex";
    DOM.taskForm.reset();
    state.editTaskId = task?.id || null;

    if (task) {
      document.getElementById("task-title").value = task.title;
      document.getElementById("task-description").value =
        task.description || "";
      document.getElementById("task-due-date").value = task.dueDate || "";
      document.getElementById("task-priority").value = task.priority;
    }

    updateProjectSelect(task?.projectId || state.currentProjectId);
  };

  const updateProjectSelect = (selectedProjectId = null) => {
    DOM.taskProjectSelect.innerHTML = `<option value="">Tâches non-spècifiques</option>`;
    todoList.getProjects().forEach((project) => {
      const opt = document.createElement("option");
      opt.value = project.id;
      opt.textContent = project.name;
      if (project.id === selectedProjectId) {
        opt.selected = true;
      }
      DOM.taskProjectSelect.appendChild(opt);
    });
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();

    const data = {
      title: document.getElementById("task-title").value.trim(),
      description: document.getElementById("task-description").value.trim(),
      dueDate: document.getElementById("task-due-date").value,
      priority: document.getElementById("task-priority").value,
      projectId: DOM.taskProjectSelect.value || null,
    };

    if (!data.title) {
      alert("Le titre est obligatoire.");
      return;
    }

    if (state.editTaskId) {
      updateExistingTask(data);
    } else {
      createNewTask(data);
    }

    closeAllModals();
  };

  const createNewTask = (data) => {
    const newTask = createTask(
      data.title,
      data.description,
      data.dueDate,
      data.priority,
      data.projectId
    );

    if (data.projectId) {
      const proj = todoList.getProjectById(data.projectId);
      proj?.addTask(newTask);
    } else {
      todoList.addOrphanTask(newTask);
    }

    saveAndRefresh();
  };

  const updateExistingTask = (data) => {
    let task = null;
    let currentProject = null;

    // Trouver la tâche dans les projets
    for (const project of todoList.getProjects()) {
      const found = project.getTaskById(state.editTaskId);
      if (found) {
        task = found;
        currentProject = project;
        break;
      }
    }

    // Ou dans les tâches orphelines
    if (!task) {
      task = todoList.getOrphanTasks().find((t) => t.id === state.editTaskId);
    }

    if (!task) {
      alert("Tâche introuvable.");
      return;
    }

    // Si le projet a changé
    if (data.projectId !== task.projectId) {
      const newProjectId = data.projectId || null;
      // Retirer de l'ancien projet
      if (task.projectId) {
        const oldProj = todoList.getProjectById(task.projectId);
        oldProj?.removeTask(task.id);
      } else {
        todoList.removeOrphanTask(task.id);
      }

      // Ajouter dans le nouveau projet
      if (newProjectId) {
        const newProj = todoList.getProjectById(newProjectId);
        newProj?.addTask(task);
      } else {
        todoList.addOrphanTask(task);
      }

      // IMPORTANT → mettre à jour le champ projectId de la tâche
      task.projectId = newProjectId;
    }

    // Mettre à jour le reste des détails
    task.updateDetails({
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
    });

    saveAndRefresh();
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById("project-name").value.trim();
    if (!name) {
      alert("Le nom du projet est obligatoire.");
      return;
    }

    const newProject = createProject(name);
    todoList.addProject(newProject);
    closeAllModals();
    saveAndRefresh();
  };

  const handleDeleteProject = (projectId) => {
    if (!confirm("Supprimer ce projet et toutes ses tâches ?")) return;
    todoList.removeProject(projectId);
    if (state.currentProjectId === projectId) {
      handleProjectSelect("all");
    } else {
      saveAndRefresh();
    }
  };

  init();
};
