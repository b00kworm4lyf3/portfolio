// Blog Manager - Handles loading and displaying blog posts
class BlogManager {
    constructor() {
        this.posts = [];
        this.sortOrder = 'newest'; // 'newest' or 'oldest'
    }

    // Load posts from JSON
    async loadPosts() {
        try {
            const response = await fetch('blog.json');
            const data = await response.json();
            this.posts = data.posts;
            this.sortPosts();
            return this.posts;
        } catch (error) {
            console.error('Error loading blog posts:', error);
            return [];
        }
    }

    // Sort posts based on current sort order
    sortPosts() {
        this.posts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return this.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }

    // Toggle sort order
    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
        this.sortPosts();
    }

    // Get all posts
    getAllPosts() {
        return this.posts;
    }

    // Filter posts by tag
    filterByTag(tag) {
        if (tag === 'all') return this.posts;
        return this.posts.filter(post => {
            // Handle both old format (array) and new format (object with categories)
            if (Array.isArray(post.tags)) {
                return post.tags.some(t => t.toLowerCase() === tag.toLowerCase());
            } else {
                // Check all categories
                return Object.values(post.tags).some(categoryTags =>
                    categoryTags.some(t => t.toLowerCase() === tag.toLowerCase())
                );
            }
        });
    }

    // Get all unique tags
    getAllTags() {
        const tags = new Set();
        this.posts.forEach(post => {
            // Handle both old format (array) and new format (object with categories)
            if (Array.isArray(post.tags)) {
                post.tags.forEach(tag => tags.add(tag));
            } else {
                // Flatten categorized tags
                Object.values(post.tags).forEach(categoryTags => {
                    categoryTags.forEach(tag => tags.add(tag));
                });
            }
        });
        return Array.from(tags).sort();
    }

    // Get tags by category from all posts
    getTagsByCategory() {
        const categories = {};
        this.posts.forEach(post => {
            if (typeof post.tags === 'object' && !Array.isArray(post.tags)) {
                for (let category in post.tags) {
                    if (!categories[category]) {
                        categories[category] = new Set();
                    }
                    post.tags[category].forEach(tag => categories[category].add(tag));
                }
            }
        });
        
        // Convert Sets to sorted arrays
        for (let category in categories) {
            categories[category] = Array.from(categories[category]).sort();
        }
        
        return categories;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Render a single blog post
    renderPost(post) {
        // Flatten tags for display
        const allTags = Array.isArray(post.tags) 
            ? post.tags 
            : Object.values(post.tags).flat();
        
        const imagesHtml = post.images && post.images.length > 0
            ? `<div class="post-images">
                ${post.images.map(img => `
                    <figure class="post-image">
                        <img src="${img.src}" alt="${img.caption || post.title}">
                        ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
                    </figure>
                `).join('')}
               </div>`
            : '';

        // Convert line breaks to paragraphs
        const contentHtml = post.content
            .split('\n\n')
            .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('');
        
        const assignmentHtml = post.assignmentDetails
            ? `<div class="assignment-details">
                <button class="assignment-toggle" onclick="this.parentElement.classList.toggle('open')">
                    <span class="toggle-icon">▼</span> Assignment Details
                </button>
                <div class="assignment-content">
                    <p>${post.assignmentDetails.replace(/\n/g, '<br>')}</p>
                </div>
            </div>`
            : '';

        return `
            <article class="blog-post" data-post-id="${post.id}">
                <header class="post-header">
                    <h2>${post.title}</h2>
                    <div class="post-meta">
                        <time datetime="${post.date}">${this.formatDate(post.date)}</time>
                        <div class="tags">
                            ${allTags.map(tag => 
                                `<span class="tag tag-link" data-tag="${tag}">${tag}</span>`
                            ).join('')}
                        </div>
                    </div>
                </header>
                <div class="post-content">
                    ${contentHtml}
                    ${imagesHtml}
                    ${assignmentHtml}
                </div>
            </article>
        `;
    }
}

// Initialize and export
const blogManager = new BlogManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        blogManager.loadPosts();
    });
} else {
    blogManager.loadPosts();
}