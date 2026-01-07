// Project Manager - Handles loading and displaying portfolio projects
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
    }

    // Load projects from JSON
    async loadProjects() {
        try {
            const response = await fetch('projects.json');
            const data = await response.json();
            this.projects = data.projects;
            return this.projects;
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    // Get all projects
    getAllProjects() {
        return this.projects;
    }

    // Get featured projects only
    getFeaturedProjects() {
        return this.projects.filter(project => project.featured);
    }

    // Get project by ID or slug
    getProject(identifier) {
        return this.projects.find(
            project => project.id === identifier || project.slug === identifier
        );
    }

    // Filter projects by tag
    filterByTag(tag) {
        if (tag === 'all') return this.projects;
        return this.projects.filter(project => {
            // Handle both old format (array) and new format (object with categories)
            if (Array.isArray(project.tags)) {
                return project.tags.some(t => t.toLowerCase() === tag.toLowerCase());
            } else {
                // Check all categories
                return Object.values(project.tags).some(categoryTags =>
                    categoryTags.some(t => t.toLowerCase() === tag.toLowerCase())
                );
            }
        });
    }

    // Get all unique tags
    getAllTags() {
        const tags = new Set();
        this.projects.forEach(project => {
            // Handle both old format (array) and new format (object with categories)
            if (Array.isArray(project.tags)) {
                project.tags.forEach(tag => tags.add(tag));
            } else {
                // Flatten categorized tags
                Object.values(project.tags).forEach(categoryTags => {
                    categoryTags.forEach(tag => tags.add(tag));
                });
            }
        });
        return Array.from(tags).sort();
    }

    // Get tags by category from all projects
    getTagsByCategory() {
        const categories = {};
        this.projects.forEach(project => {
            if (typeof project.tags === 'object' && !Array.isArray(project.tags)) {
                for (let category in project.tags) {
                    if (!categories[category]) {
                        categories[category] = new Set();
                    }
                    project.tags[category].forEach(tag => categories[category].add(tag));
                }
            }
        });
        
        // Convert Sets to sorted arrays
        for (let category in categories) {
            categories[category] = Array.from(categories[category]).sort();
        }
        
        return categories;
    }

    // Render project card (for grid view)
    renderProjectCard(project) {
        // Flatten tags for display
        const allTags = Array.isArray(project.tags) 
            ? project.tags 
            : Object.values(project.tags).flat();
        
        return `
            <article class="portfolio-item" data-project-id="${project.id}">
                <img src="${project.thumbnail}" alt="${project.title}">
                <div class="portfolio-content">
                    <h3>${project.title}</h3>
                    <p>${project.shortDescription}</p>
                    <div class="tags">
                        ${allTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    // Render project modal/overlay
    renderProjectModal(project) {
        // Flatten tags for display
        const allTags = Array.isArray(project.tags) 
            ? project.tags 
            : Object.values(project.tags).flat();
        
        return `
            <div class="project-modal-overlay" id="projectModal">
                <div class="project-modal">
                    <div class="modal-content">
                        <button class="modal-close" aria-label="Close modal">&times;</button>
                        
                        <div class="modal-split">
                            <div class="modal-left">
                                <header class="project-header">
                                    <h1>${project.title}</h1>
                                    <div class="project-meta">
                                        <time>${project.date}</time>
                                        <div class="tags">
                                            ${allTags.map(tag => 
                                                `<a href="work.html?tags=${encodeURIComponent(tag)}" class="tag tag-link">${tag}</a>`
                                            ).join('')}
                                        </div>
                                    </div>
                                </header>

                                <section class="project-overview">
                                    <h2>Overview</h2>
                                    <p>${project.overview}</p>
                                </section>
                            </div>
                            
                            <div class="modal-right">
                                <img src="${project.thumbnail}" alt="${project.title}" class="modal-preview-image">
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <a href="${project.slug}.html" class="cta-button">View Full Project Page</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Show project in modal
    showProjectModal(projectId) {
        const project = this.getProject(projectId);
        if (!project) return;

        // Remove existing modal if any
        const existingModal = document.getElementById('projectModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', this.renderProjectModal(project));

        // Add event listeners
        const modal = document.getElementById('projectModal');
        const closeBtn = modal.querySelector('.modal-close');
        
        closeBtn.addEventListener('click', () => this.closeProjectModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeProjectModal();
        });

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Add escape key listener
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') this.closeProjectModal();
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    // Close project modal
    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }
}

// Initialize and export
const projectManager = new ProjectManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        projectManager.loadProjects();
    });
} else {
    projectManager.loadProjects();
}