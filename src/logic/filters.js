/**
 * Filtre un tableau de tâches selon le type spécifié
 * @param {Array} tasks - Tableau de tâches à filtrer
 * @param {string} filterType - Type de filtre ('today', 'week', etc.)
 * @returns {Array} Tâches filtrées
 */
export const filterTasks = (tasks, filterType) => {
  // Préparation des dates de référence
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalisation à minuit

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  return tasks.filter((task) => {
    // Gestion des tâches sans date
    if (!task.dueDate) {
      return filterType === "completed"
        ? task.completed
        : filterType === "high-priority"
        ? task.priority === "high"
        : false;
    }

    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0); // Normalisation

    switch (filterType) {
      case "today":
        return taskDate.getTime() === today.getTime();

      case "week":
        return taskDate >= today && taskDate <= endOfWeek;

      case "upcoming":
        return taskDate > today;

      case "completed":
        return task.completed;

      case "high-priority":
        return task.priority === "high";

      case "no-date":
        return !task.dueDate;

      default: // 'all'
        return true;
    }
  });
};
