const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const filterTabs = document.getElementById('filter-tabs');
const appStats = document.getElementById('app-stats');

const STORAGE_KEY = 'todos';
const THEME_STORAGE_KEY = 'theme';

let currentFilter = 'all';

initTheme();
initFilters();

let todos = loadTodos();

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return getSystemTheme();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function initTheme() {
  applyTheme(loadTheme());

  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener('change', () => {
    const nextTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });
}

function initFilters() {
  if (!filterTabs) {
    return;
  }

  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) {
      return;
    }

    currentFilter = tab.dataset.filter;
    filterTabs.querySelectorAll('.filter-tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    renderTodos();
  });
}

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function updateStats() {
  if (!appStats) {
    return;
  }

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const remaining = total - completed;

  if (total === 0) {
    appStats.textContent = '暂无待办事项';
  } else {
    appStats.textContent = `${remaining} 个待完成 · ${completed} 个已完成`;
  }
}

function getFilteredTodos() {
  if (currentFilter === 'active') {
    return todos.filter((t) => !t.completed);
  }

  if (currentFilter === 'completed') {
    return todos.filter((t) => t.completed);
  }

  return todos;
}

function renderTodos(newTodoId = null) {
  list.innerHTML = '';
  updateStats();

  const filtered = getFilteredTodos();

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';

    const icon = document.createElement('span');
    icon.className = 'empty-state-icon';
    icon.textContent = '📋';

    const msg = document.createElement('p');
    msg.textContent =
      currentFilter === 'completed'
        ? '暂无已完成事项'
        : currentFilter === 'active'
          ? '暂无待完成事项'
          : '添加你的第一个待办事项吧！';

    empty.appendChild(icon);
    empty.appendChild(msg);
    list.appendChild(empty);
    return;
  }

  filtered.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    if (todo.id === newTodoId) {
      li.classList.add('new-item');
    }

    const content = document.createElement('div');
    content.className = 'todo-content';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `标记 ${todo.text} 为完成`);
    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      saveTodos();
      span.className = `todo-text${todo.completed ? ' completed' : ''}`;
      updateStats();

      if (currentFilter !== 'all') {
        li.classList.add('removing');
        li.addEventListener('animationend', () => renderTodos(), { once: true });
      }
    });

    const span = document.createElement('span');
    span.className = `todo-text${todo.completed ? ' completed' : ''}`;
    span.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `删除 ${todo.text}`);
    deleteButton.addEventListener('click', () => {
      li.classList.add('removing');
      li.addEventListener(
        'animationend',
        () => {
          todos = todos.filter((item) => item.id !== todo.id);
          saveTodos();
          renderTodos();
        },
        { once: true },
      );
    });

    content.appendChild(checkbox);
    content.appendChild(span);
    li.appendChild(content);
    li.appendChild(deleteButton);
    list.appendChild(li);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    return;
  }

  const newId = crypto.randomUUID();
  todos.push({
    id: newId,
    text,
    completed: false,
  });

  saveTodos();

  if (currentFilter === 'completed') {
    currentFilter = 'all';
    filterTabs.querySelectorAll('.filter-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.filter === 'all');
      t.setAttribute('aria-selected', String(t.dataset.filter === 'all'));
    });
  }

  renderTodos(newId);

  input.value = '';
  input.focus();
});

renderTodos();
