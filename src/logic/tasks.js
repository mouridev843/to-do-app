// Helper function pour valider les dates
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const createTask = (
  title,
  description = "",
  dueDate = null,
  priority = "medium",
  projectId = null
) => {
  // Validations (gardez celles de la version précédente)
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Le titre est obligatoire.");
  }

  // ... autres validations ...
  if (dueDate && !isValidDate(dueDate)) {
    throw new Error("Format de date invalide.");
  }

  const validPriorities = ["low", "medium", "high"];
  if (!validPriorities.includes(priority)) {
    priority = "medium";
  }
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description.trim(),
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
    projectId, // null pour les tâches indépendantes
    toggleCompleted() {
      this.completed = !this.completed;
    },
    updateDetails(newDetails) {
      const { id, createdAt, ...safeUpdates } = newDetails;
      Object.assign(this, safeUpdates);
    },
  };
};
export default createTask;
