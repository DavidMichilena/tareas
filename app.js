const API_URL = 'https://jsonplaceholder.typicode.com/todos';

let tasks = [];

const priorityWeights = { 'Alta': 3, 'Media': 2, 'Baja': 1 };

const taskListEl = document.getElementById('task-list');
const taskTitleInput = document.getElementById('task-title');
const taskPriorityInput = document.getElementById('task-priority');
const taskIdInput = document.getElementById('task-id');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const sortBy = document.getElementById('sort-by');
const notificationEl = document.getElementById('notification');

const metricTotal = document.getElementById('metric-total');
const metricPending = document.getElementById('metric-pending');
const metricCompleted = document.getElementById('metric-completed');

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    const localData = localStorage.getItem('tasks');
    
    if (localData) {
        tasks = JSON.parse(localData);
    } else {
        await fetchTasksFromAPI();
    }
    
    setupEventListeners();
    render();
}

async function fetchTasksFromAPI() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al conectar con el servidor.');
        const data = await response.json();
        
        // Tomamos las primeras 20 tareas y añadimos los campos faltantes de fecha y prioridad
        tasks = data.slice(0, 20).map(task => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            priority: ['Alta', 'Media', 'Baja'][Math.floor(Math.random() * 3)],
            createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString()
        }));
        
        saveToLocalStorage();
    } catch (error) {
        showError(`Error de carga inicial: ${error.message}. Trabajando en modo offline.`);
        tasks = []; 
    }
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function showError(message) {
    notificationEl.textContent = message;
    notificationEl.style.display = 'block';
    setTimeout(() => { notificationEl.style.display = 'none'; }, 5000);
}

function setupEventListeners() {
    btnSave.addEventListener('click', saveTask);
    btnCancel.addEventListener('click', resetForm);
    searchInput.addEventListener('input', render);
    filterStatus.addEventListener('change', render);
    sortBy.addEventListener('change', render);
}

function saveTask() {
    const title = taskTitleInput.value.trim();
    const priority = taskPriorityInput.value;
    const id = taskIdInput.value;

    if (!title) {
        alert('El título de la tarea no puede estar vacío.');
        return;
    }

    if (id) {
        // Modo Edición
        tasks = tasks.map(task => task.id == id ? { ...task, title, priority } : task);
    } else {
        // Modo Creación
        const newTask = {
            id: Date.now(), // ID único basado en timestamp
            title,
            completed: false,
            priority,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveToLocalStorage();
    resetForm();
    render();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    taskTitleInput.value = task.title;
    taskPriorityInput.value = task.priority;
    taskIdInput.value = task.id;
    
    btnSave.textContent = 'Actualizar Tarea';
    btnCancel.style.display = 'inline-block';
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveToLocalStorage();
    render();
}

function toggleTaskStatus(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveToLocalStorage();
    render();
}

function resetForm() {
    taskTitleInput.value = '';
    taskPriorityInput.value = 'Media';
    taskIdInput.value = '';
    btnSave.textContent = 'Guardar Tarea';
    btnCancel.style.display = 'none';
}

function getProcessedTasks() {
    let result = [...tasks];

    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        result = result.filter(task => task.title.toLowerCase().includes(query));
    }

    const status = filterStatus.value;
    if (status === 'Pendientes') {
        result = result.filter(task => !task.completed);
    } else if (status === 'Completadas') {
        result = result.filter(task => task.completed);
    }

    const criterion = sortBy.value;
    if (criterion === 'fecha') {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Más recientes primero
    } else if (criterion === 'prioridad') {
        result.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]); // Alta a Baja
    }

    return result;
}

function updateMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    metricTotal.textContent = total;
    metricPending.textContent = pending;
    metricCompleted.textContent = completed;
}

function render() {
    updateMetrics();
    taskListEl.innerHTML = '';

    const processedTasks = getProcessedTasks();

    if (processedTasks.length === 0) {
        taskListEl.innerHTML = '<li style="text-align:center; color:#888;">No se encontraron tareas.</li>';
        return;
    }

    processedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus(${task.id})">
                <span class="task-title"><strong>[${task.priority}]</strong> ${task.title}</span>
            </div>
            <div>
                <button onclick="editTask(${task.id})">Editar</button>
                <button onclick="deleteTask(${task.id})" style="background-color:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Borrar</button>
            </div>
        `;
        taskListEl.appendChild(li);
    });
}