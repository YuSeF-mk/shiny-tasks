// -------------------------------global variables
let tasks = [];
const categories = [];
let editingTaskId = null;
const priorityMap = { "1": "Low", "2": "Medium", "3": "High" };
const today = new Date().toISOString().split('T')[0];
//! -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadtheme();
  displayTodayDate();
  loadTasks();
  refreshCategoriesList();
  applyFilters();
  updatePrioritySlider();
})
// -------------------------------general functions
function saveTasks() {
  localStorage.setItem("todoData", JSON.stringify(tasks));
}
function loadTasks() {
  const savedData = localStorage.getItem("todoData");
  if (savedData) {
    tasks = JSON.parse(savedData);
  }
}
function loadtheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}
const toast = document.getElementById("toastMessage");
function showMessage(message, type = "success") {
  toast.innerText = message.trim();
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast hidden";
  }, 2000);
}
// -------------------------------show modal
const addTaskBtn = document.querySelector("#addTaskBtn");
addTaskBtn.addEventListener("click", (e) => {
  taskFormDialog.showModal();
  updatePrioritySlider();
  taskForm["title"].focus();
})
const taskFormDialog = document.querySelector("#taskFormDialog");
taskFormDialog.addEventListener('click', (e) => {
  if (e.target === taskFormDialog) cleanAfterForm();
});
// ------------------------------- cancel and reset form
//clean after cancel or submit
const submitTask = document.querySelector("#submitTask");
const taskForm = document.querySelector("#taskForm");
function cleanAfterForm() {
  submitTask.value = "ADD"
  editingTaskId = null;
  taskForm.reset();
  taskFormDialog.close();
}
const titleError = document.getElementById("titleError");
const CategoryError = document.getElementById("CategoryError");
const DeadLineError = document.getElementById("DeadLineError");
function cleanValidationMessages() {
  titleError.classList.remove("show");
  CategoryError.classList.remove("show");
  DeadLineError.classList.remove("show");
  const inputs = taskForm.querySelectorAll(".wronginput");
  inputs.forEach(input => input.classList.remove("wronginput"));
}
taskForm.addEventListener("click", (e) => {
  if (e.target.type === "button") {
    //remove validation errors
    cleanValidationMessages()
  }
  if (e.target.id === "cancelForm") {
    cleanAfterForm();
  }
  if (e.target.id === "resetForm") {
    taskForm.reset();
  }
})
// ------------------------------- submit form
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (validateForm(taskForm)) {
    if (editingTaskId) {
      updateTask(taskForm);
      showMessage("Task updated");
    }
    else {
      addNewTask(taskForm);
      showMessage("Task added");
    }
    applyFilters();
    refreshCategoriesList();
    cleanAfterForm();

  }
})
function validateForm(form) {
  let isValid = true;
  const title = form["title"];
  const titleText = title.value.trim();
  if (!titleText.trim()) {
    title.classList.add("wronginput");
    isValid = false;
    titleError.innerText = "Please enter a task title.";
    titleError.classList.add("show");
  }
  else {
    const isDuplicate = tasks.some(task => {
      if (editingTaskId && task.id === editingTaskId) {
        return false;//returns false if same task
      }
      return task.title.toLowerCase() === titleText.toLowerCase();//true if any other task has same title
    });
    if (isDuplicate) {
      title.classList.add("wronginput");
      titleError.innerText = "this task already exists";
      titleError.classList.add("show");
      isValid = false;
    } else {
      title.classList.remove("wronginput")
      titleError.classList.remove("show");
    }
  }
  const priority = form["Priority"];
  const prior = Number(priority.value);
  if (!priority.value || prior < 0 || prior > 3) {
    priority.classList.add("wronginput");
    isValid = false;
  } else { priority.classList.remove("wronginput") }

  const category = form["category"];
  if (!category.value.trim()) {
    category.classList.add("wronginput");
    CategoryError.innerText = "Please enter a category.";
    CategoryError.classList.add("show");
    isValid = false;
  } else { category.classList.remove("wronginput"); CategoryError.classList.remove("show"); }

  const deadLine = form["deadLine"];
  const selectedDate = new Date(deadLine.value);
  const todayDate = new Date(today);
  if (!deadLine.value || selectedDate < todayDate) {
    deadLine.classList.add("wronginput");
    DeadLineError.innerText = "Please enter a valid date for task."; // Set the specific message
    DeadLineError.classList.add("show");
    isValid = false;
  } else { deadLine.classList.remove("wronginput"); DeadLineError.classList.remove("show"); }
  return isValid
}
function addNewTask(form) {
  const newTask = {
    id: Date.now(),
    title: form["title"].value.trim(),
    priority: form["Priority"].value,
    category: form["category"].value,
    deadline: form["deadLine"].value,
    completed: false
  };
  tasks.push(newTask);
  saveTasks();
}
// -------------------------------sorting tasks:
const statusFilter = document.getElementById("filterbyStatus");
const filterByCategory = document.getElementById("filterByCategory");
statusFilter.addEventListener("change", applyFilters);
filterByCategory.addEventListener("change", applyFilters);
function sortTasks(tasksToSort) {
  return [...tasksToSort].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; //if not completes > -1 > to the top
    }
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    if (dateA !== dateB) {
      return dateA - dateB; // Smaller number on top
    }
    if (Number(a.priority) !== Number(b.priority)) {
      return Number(b.priority) - Number(a.priority);
    }
    return 0
  });
}
const categoriesList = document.getElementById("categoriesList");
//to refresh categories on edit or new tasks
function refreshCategoriesList() {
  const selectedValue = filterByCategory.value;
  categories.length = 0;
  const unique = new Set(tasks.map(t => t.category.trim().toLowerCase()));
  categories.push(...unique);
  categoriesList.innerHTML = ''
  filterByCategory.innerHTML = `<option value="all">All Categories</option>`
  for (let category of categories) {
    const filterOption = document.createElement("option");
    filterOption.value = category
    filterOption.innerText = category;
    filterByCategory.append(filterOption);
    const categoryOption = document.createElement("option");
    categoryOption.value = category
    categoriesList.append(categoryOption);
    filterByCategory.value = selectedValue || "all";
  }
}
//priority event and preview
const prioritySlider = document.querySelector('input[name="Priority"]');
const priorityPreview = document.getElementById("priorityPreview");
function updatePrioritySlider() {
  const value = prioritySlider.value;
  priorityPreview.innerText = priorityMap[value];
}
prioritySlider.addEventListener("input", updatePrioritySlider);
// ------------------------------- refreshing the UI/HTML
const tasksUl = document.querySelector("#tasksUl");
function refreshTasksHtml(list = tasks) {
  tasksUl.innerHTML = ''
  if (list.length === 0) {
    if (tasks.length === 0) {
      tasksUl.innerHTML = "<p class='empty'>No tasks yet</p>";
    } else {
      tasksUl.innerHTML = "<p class='empty'>No tasks match your filters</p>";
    }
    return;
  }
  const fragment = document.createDocumentFragment();
  const todayTime = new Date(today).getTime();
  for (let task of list) {
    let deadlineClass = '';
    let deadlineTitle = 'this task is done';
    const priorit = priorityMap[task.priority] || "Low";
    const deadlineTime = new Date(task.deadline).getTime();
    if (!task.completed) {
      if (deadlineTime > todayTime) {
        deadlineClass = "got-time";
        deadlineTitle = "You still have time to complete this task."
      } else if (deadlineTime < todayTime) {
        deadlineClass = "overdue";
        deadlineTitle = "This task is past its deadline!"
      } else {
        deadlineClass = "due-today";
        deadlineTitle = "This task is due today!"
      }
    }
    const newLi = document.createElement("li");
    newLi.id = task.id
    newLi.classList.add("task_li")
    task.completed ? newLi.classList.add("completed") : newLi.classList.add("incompleted");
    const actionsHTML = task.completed ? "" : `
  <div class="task-actions">
    <button class="btn" onclick="editTask(${task.id})" title="Edit Task">
      <i class="fa-solid fa-pencil"></i>
    </button>
    <button class="btn" onclick="deleteTask(${task.id})" title="Delete Task">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>
`;
    newLi.innerHTML = `
    <div class="task-head">
        <div class="task-details">
          <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onchange="toggleComplete(${task.id})">
          <h3 class="task-title">${task.title}</h3>
        </div>
        ${actionsHTML}
      </div>
      <div class="task-content">
        <span>Priority : ${priorit}</span>
        <span>${task.category}</span>
        <span class="${deadlineClass}" title="${deadlineTitle}">
          <i class="fa-solid fa-alarm-clock"></i> ${task.deadline}
        </span>
      </div>
    `;
    fragment.appendChild(newLi);
  }
  tasksUl.appendChild(fragment);

}
//!-------------------------------------------
function applyFilters() {
  const statusValue = statusFilter.value;
  const categoryValue = filterByCategory.value.toLowerCase();
  let filteredTasks = [...tasks];

  if (statusValue === "completed") {
    filteredTasks = filteredTasks.filter(task => task.completed === true);
  } else if (statusValue === "pending") {
    filteredTasks = filteredTasks.filter(task => task.completed === false);
  }

  if (categoryValue !== "all") {
    filteredTasks = filteredTasks.filter(task => task.category.toLowerCase() === categoryValue);
  }
  const searchValue = searchInput.value.toLowerCase();
  filteredTasks = filteredTasks.filter(task =>
    task.title.toLowerCase().includes(searchValue)
  );
  refreshTasksHtml(sortTasks(filteredTasks));
}
// ------------------------------- task Actions
function toggleComplete(id) {
  const clickedTask = tasks.find(task => task.id === id);
  if (clickedTask) clickedTask.completed = !clickedTask.completed;
  showMessage(clickedTask.completed ? "Task completed" : " incompled Task");
  saveTasks()
  applyFilters();
}
//deleting task
const deleteDialog = document.getElementById("deleteDialog");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");
let idToDelete = null
function deleteTask(id) {
  deleteDialog.showModal();
  updatePrioritySlider();
  idToDelete = id;
}
cancelDelete.addEventListener("click", () => {
  deleteDialog.close();
  idToDelete = null;
});
confirmDelete.addEventListener("click", () => {
  tasks = tasks.filter(task => task.id !== idToDelete);
  applyFilters();
  refreshCategoriesList();
  deleteDialog.close();
  showMessage("Task deleted", "error")
  idToDelete = null;
  saveTasks()
});
//editing task___________________________________
function editTask(id) {
  editingTaskId = id;
  const targetTask = tasks.find(task => task.id === id)
  if (!targetTask) return;
  submitTask.value = "SAVE"
  taskFormDialog.showModal();
  taskForm["Priority"].value = targetTask.priority;
  updatePrioritySlider();
  taskForm["title"].value = targetTask.title
  taskForm["Priority"].value = targetTask.priority
  taskForm["category"].value = targetTask.category
  taskForm["deadLine"].value = targetTask.deadline
}
function updateTask(form) {
  const taskToUpdate = tasks.find(task => task.id === editingTaskId);
  taskToUpdate.title = form["title"].value.trim();
  taskToUpdate.priority = form["Priority"].value;
  taskToUpdate.category = form["category"].value;
  taskToUpdate.deadline = form["deadLine"].value;
  saveTasks();
  applyFilters();
}
//*-----------------------------------search bar
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", applyFilters);
//---------------------------------dark/light mode
const toggleDarkMode = document.getElementById("toggleDarkMode")
toggleDarkMode.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  // save preference
  const isDark = document.body.classList.contains("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    toggleDarkMode.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    localStorage.setItem("theme", "light");
    toggleDarkMode.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
});
//---------------------------------on page time update
function displayTodayDate() {
  const todayElement = document.getElementById("todayDate");
  const now = new Date();
  const formatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  todayElement.innerText = formatted;
}