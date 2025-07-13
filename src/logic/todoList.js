import createProject from "./projects";

const createTodoList = (initialProjects = []) => {
  const projects =
    initialProjects.length > 0
      ? initialProjects.map((proj) => {
          const project = createProject(proj.name);
          proj.tasks.forEach((task) => project.addTask(task));
          return project;
        })
      : [];

  let orphanTasks = []; // Tâches sans projet

  return {
    // === Projets ===
    addProject(project) {
      if (!project?.id) throw new Error("Projet invalide");
      projects.push(project);
    },

    removeProject(projectId) {
      const index = projects.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        // Transfère les tâches vers "orphanTasks" avant suppression
        const projectTasks = projects[index].getTasks();
        orphanTasks.push(
          ...projectTasks.map((t) => ({ ...t, projectId: null }))
        );
        projects.splice(index, 1);
      }
    },

    getProjects() {
      return [...projects];
    },

    getProjectById(projectId) {
      const project = projects.find((p) => p.id === projectId);
      return project;
    },

    // === Tâches Indépendantes ===
    addOrphanTask(task) {
      if (task.projectId)
        throw new Error("La tâche appartient déjà à un projet");
      orphanTasks.push(task);
    },

    getOrphanTasks() {
      return [...orphanTasks];
    },
    removeOrphanTask(taskId) {
      const index = orphanTasks.findIndex((task) => task.id === taskId);
      if (index !== 1) {
        orphanTasks.splice(index, 1);
      }
    },

    // === Méthodes Universelles ===
    getAllTasks() {
      return [
        ...this.getOrphanTasks(),
        ...projects.flatMap((p) => p.getTasks()),
      ];
    },

    moveTaskToProject(taskId, projectId = null) {
      let task;

      // Cherche dans les tâches indépendantes
      const orphanIndex = orphanTasks.findIndex((t) => t.id === taskId);
      if (orphanIndex !== -1) {
        task = orphanTasks[orphanIndex];

        orphanTasks.splice(orphanIndex, 1);
      }
      // Cherche dans les projets
      else {
        for (const project of projects) {
          task = project.getTaskById(taskId);
          if (task) {
            project.removeTask(taskId);
            break;
          }
        }
      }

      if (!task) throw new Error("Tâche introuvable");

      // Cas "non classé" (projectId est null ou undefined)
      if (!projectId) {
        task.projectId = null; // Important: réinitialise le projectId
        this.addOrphanTask(task);
        return;
      }

      const targetProject = projects.find((p) => p.id === projectId);
      if (!targetProject) throw new Error("Projet cible introuvable");
      task.projectId = projectId;
      targetProject.addTask(task);
    },

    // === Utilitaires ===
    ensureDefaultProjectExists() {
      if (!projects.some((p) => p.name === "Inbox")) {
        this.addProject(createProject("Inbox"));
      }
    },
  };
};

export default createTodoList;
