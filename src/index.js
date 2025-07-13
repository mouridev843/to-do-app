import createProject from "./logic/projects";
import createTodoList from "./logic/todoList";
import { loadTodoList, saveTodoList } from "./storage/storage";
import "./style.css";
import { initUI } from "./ui/ui";

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  let todoList = loadTodoList();

  if (!todoList) {
    todoList = createTodoList();

    // Crée un projet par défaut seulement au premier lancement
    const defaultProject = createProject("Projet par defaut");
    todoList.addProject(defaultProject);

    saveTodoList(todoList); // sauvegarde après création
  }

  initUI(todoList);
});
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.querySelector(".sidebar-toggle");
  const overlay = document.querySelector(".sidebar-overlay");

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
});
