const createProject = (name) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Le nom du projet est obligatoire.");
  }

  let tasks = [];

  return {
    id: crypto.randomUUID(),
    name: name.trim(),

    // Ajoute une tâche existante ou crée une nouvelle tâche
    addTask(task) {
      if (!task?.id) throw new Error("La tâche est invalide : ID manquant.");

      // Vérifie si la tâche existe déjà
      if (tasks.some((t) => t.id === task.id)) {
        throw new Error("Cette tâche existe déjà dans le projet.");
      }

      // Lie la tâche au projet

      tasks.push(task);
    },

    // Supprime une tâche
    removeTask(taskId) {
      const initialLength = tasks.length;
      tasks = tasks.filter((task) => task.id !== taskId);
      return initialLength !== tasks.length; // Retourne true si suppression réussie
    },

    // Récupère toutes les tâches (copie immuable)
    getTasks() {
      return [...tasks];
    },

    // Récupère une tâche par ID (copie immuable)
    getTaskById(taskId) {
      const task = tasks.find((task) => task.id === taskId);
      return task;
    },

    // Filtre les tâches (compatible avec les filtres existants)
    getFilteredTasks(filterType) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      return tasks.filter((task) => {
        const taskDate = task.dueDate ? new Date(task.dueDate) : null;

        switch (filterType) {
          case "today":
            return taskDate?.toDateString() === today.toDateString();
          case "week":
            return taskDate && taskDate >= today && taskDate <= endOfWeek;
          case "upcoming":
            return taskDate && taskDate > today;
          case "completed":
            return task.completed;
          case "high-priority":
            return task.priority === "high";
          default:
            return true; // "all"
        }
      });
    },

    // Met à jour le nom du projet
    updateName(newName) {
      if (!newName?.trim())
        throw new Error("Le nom du projet est obligatoire.");
      this.name = newName.trim();
    },
  };
};

export default createProject;
