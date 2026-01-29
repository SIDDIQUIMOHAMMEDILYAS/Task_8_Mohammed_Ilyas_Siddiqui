/**
 * NEBULA TASK MANAGER
 * Designed for Mohammed Ilyas Siddiqui
 */

class NebulaApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('nebula_tasks')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        // Elements
        this.taskListEl = document.getElementById('task-list');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.form = document.getElementById('task-form');
        this.dateEl = document.getElementById('current-date');
        this.progressCircle = document.getElementById('progress-circle');
        
        // Circumference for progress
        this.radius = this.progressCircle.r.baseVal.value;
        this.circumference = this.radius * 2 * Math.PI;

        this.init();
    }

    init() {
        this.updateDate();
        this.render();
        this.updateStats();
        this.setupDragAndDrop();
        
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskFromModal();
        });
    }

    static initParticles() {
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function createParticles() {
            particles = [];
            for(let i=0; i<100; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
                particles.forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 100) {
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 - dist/1000})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        createParticles();
        animate();
    }

    updateDate() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        this.dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    saveToStorage() {
        localStorage.setItem('nebula_tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    updateStats() {
        ['work', 'personal', 'shopping'].forEach(cat => {
            const count = this.tasks.filter(t => !t.completed && t.category === cat).length;
            document.getElementById(`count-${cat}`).textContent = count;
        });

        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('total-tasks').textContent = pending;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        const offset = this.circumference - (percent / 100) * this.circumference;
        this.progressCircle.style.strokeDashoffset = offset;
        document.getElementById('progress-text').textContent = `${percent}%`;
    }

    openModal(taskId = null) {
        this.modalOverlay.classList.add('open');
        document.getElementById('input-title').focus();
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            document.getElementById('modal-title').textContent = "Edit Mission";
            document.getElementById('task-id').value = task.id;
            document.getElementById('input-title').value = task.title;
            document.getElementById('input-category').value = task.category;
            document.getElementById('input-priority').value = task.priority;
            document.getElementById('input-date').value = task.date || '';
        } else {
            document.getElementById('modal-title').textContent = "New Mission";
            this.form.reset();
            document.getElementById('task-id').value = '';
        }
    }

    closeModal() {
        this.modalOverlay.classList.remove('open');
    }

    saveTaskFromModal() {
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('input-title').value;
        const category = document.getElementById('input-category').value;
        const priority = document.getElementById('input-priority').value;
        const date = document.getElementById('input-date').value;

        if (id) {
            const index = this.tasks.findIndex(t => t.id == id);
            if (index > -1) {
                this.tasks[index] = { ...this.tasks[index], title, category, priority, date };
            }
        } else {
            const newTask = {
                id: Date.now(),
                title,
                category,
                priority,
                date,
                completed: false
            };
            this.tasks.unshift(newTask);
        }

        this.saveToStorage();
        this.render();
        this.closeModal();
    }

    deleteTask(id) {
        if(confirm('Delete this mission?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        task.completed = !task.completed;
        this.saveToStorage();
        this.render();
    }

    filterTasks(category, navElement) {
        this.currentFilter = category;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(navElement) navElement.classList.add('active');

        const titles = {
            'all': 'All Tasks',
            'work': 'Work Projects',
            'personal': 'Personal Goals',
            'shopping': 'Shopping List'
        };
        document.getElementById('page-title').textContent = titles[category];
        this.render();
    }

    searchTasks(query) {
        this.searchQuery = query.toLowerCase();
        this.render();
    }

    render() {
        this.taskListEl.innerHTML = '';
        let filtered = this.tasks;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => t.category === this.currentFilter);
        }
        if (this.searchQuery) {
            filtered = filtered.filter(t => t.title.toLowerCase().includes(this.searchQuery));
        }

        if (filtered.length === 0) {
            this.taskListEl.innerHTML = `
                <div style="text-align:center; color: var(--text-muted); margin-top: 50px;">
                    <h3>No missions found</h3>
                    <p>Time to relax or add a new task.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((task, index) => {
            const li = document.createElement('div');
            li.className = `task-card ${task.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.index = index;
            li.dataset.id = task.id;

            li.innerHTML = `
                <div class="drag-handle">
                    <svg width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </div>
                <div class="custom-check" onclick="app.toggleTask(${task.id})">
                    <span class="check-icon">✔</span>
                </div>
                <div class="task-details">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="tag tag-${task.category}">${task.category}</span>
                        <span class="priority-dot p-${task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'med' : 'low'}"></span>
                        ${task.date ? `<span>${new Date(task.date).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn" onclick="app.openModal(${task.id})">✎</button>
                    <button class="action-btn delete" onclick="app.deleteTask(${task.id})">✖</button>
                </div>
            `;
            this.taskListEl.appendChild(li);
        });
        
        this.addDragEvents();
    }

    setupDragAndDrop() {}

    addDragEvents() {
        const draggables = document.querySelectorAll('.task-card');
        
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => {
                draggable.classList.add('dragging');
            });
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        this.taskListEl.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.taskListEl, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                this.taskListEl.appendChild(draggable);
            } else {
                this.taskListEl.insertBefore(draggable, afterElement);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    NebulaApp.initParticles();
    window.app = new NebulaApp();
});