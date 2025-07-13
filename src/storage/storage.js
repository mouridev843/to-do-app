import createProject from "../logic/projects";
import createTask from "../logic/tasks";
import createTodoList from "../logic/todoList";

const STORAGE_KEY = "todoListData";

export const saveTodoList = (todoList) => {
  // 1. Sérialisation des données
  const dataToSave = {
    projects: todoList.getProjects().map((project) => ({
      id: project.id,
      name: project.name,
      tasks: project.getTasks().map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        completed: task.completed,
        createdAt: task.createdAt,
        projectId: task.projectId, // Maintenu pour cohérence
      })),
    })),
    orphanTasks: todoList.getOrphanTasks().map((task) => ({
      // Mêmes champs que ci-dessus, mais avec projectId: null
      ...task,
      projectId: null, // Forçage explicite
    })),
  };

  // 2. Sauvegarde dans localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
};

export const loadTodoList = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return null;

  try {
    const parsedData = JSON.parse(savedData);
    const todoList = createTodoList();

    // 1. Restauration des projets
    if (parsedData.projects) {
      parsedData.projects.forEach((projectData) => {
        const project = createProject(projectData.name);
        project.id = projectData.id; // Conservation de l'ID original

        projectData.tasks.forEach((taskData) => {
          const task = createTask(
            taskData.title,
            taskData.description,
            taskData.dueDate,
            taskData.priority,
            project.id // Lie la tâche au projet
          );
          // Restauration des champs spéciaux
          task.completed = taskData.completed;
          task.createdAt = taskData.createdAt;
          task.id = taskData.id; // Conservation de l'ID original
          project.addTask(task);
        });

        todoList.addProject(project);
      });
    }

    // 2. Restauration des tâches indépendantes
    if (parsedData.orphanTasks) {
      parsedData.orphanTasks.forEach((taskData) => {
        const task = createTask(
          taskData.title,
          taskData.description,
          taskData.dueDate,
          taskData.priority,
          null // Tâche indépendante
        );
        // Restauration des champs spéciaux
        task.completed = taskData.completed;
        task.createdAt = taskData.createdAt;
        task.id = taskData.id;
        todoList.addOrphanTask(task);
      });
    }

    return todoList;
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    return null;
  }
};
