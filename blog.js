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
            if (Array.isArray(post.tags)) {
                return post.tags.some(t => t.toLowerCase() === tag.toLowerCase());
            } else {
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
            if (Array.isArray(post.tags)) {
                post.tags.forEach(tag => tags.add(tag));
            } else {
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
        
        for (let category in categories) {
            categories[category] = Array.from(categories[category]).sort();
        }
        
        return categories;
    }

    // Format date for display
    formatDate(dateString) {
        // Parse as local time by splitting the date string
        // This avoids timezone offset issues with ISO date strings
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Render a content block
    renderBlock(block) {
        switch (block.type) {
            case 'text':
                // Support line breaks within text blocks
                const paragraphs = block.text.split('\n\n');
                return paragraphs.map(para => 
                    `<p>${para.replace(/\n/g, '<br>')}</p>`
                ).join('');

            case 'image':
                const sizeClass = block.size ? `image-${block.size}` : '';
                return `
                    <figure class="post-image ${sizeClass}">
                        <img src="${block.src}" alt="${block.caption || 'Image'}">
                        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
                    </figure>
                `;

            case 'images':
                const layoutClass = block.layout === 'side-by-side' ? 'images-side-by-side' : 
                                   block.layout === 'grid' ? 'images-grid' : 'images-stack';
                const containerSizeClass = block.size ? `images-${block.size}` : '';
                return `
                    <div class="post-images ${layoutClass} ${containerSizeClass}">
                        ${block.images.map(img => {
                            const imgSizeClass = img.size ? `image-${img.size}` : '';
                            return `
                                <figure class="post-image ${imgSizeClass}">
                                    <img src="${img.src}" alt="${img.caption || 'Image'}">
                                    ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
                                </figure>
                            `;
                        }).join('')}
                    </div>
                `;

            case 'video':
                const videoSizeClass = block.size ? `video-${block.size}` : '';
                if (block.youtube) {
                    return `
                        <div class="post-video ${videoSizeClass}">
                            <iframe 
                                src="https://www.youtube.com/embed/${block.youtube}" 
                                frameborder="0" 
                                allowfullscreen>
                            </iframe>
                            ${block.caption ? `<p class="video-caption">${block.caption}</p>` : ''}
                        </div>
                    `;
                } else if (block.src) {
                    return `
                        <div class="post-video ${videoSizeClass}">
                            <video controls muted loop>
                                <source src="${block.src}" type="video/mp4">
                                Your browser does not support video.
                            </video>
                            ${block.caption ? `<p class="video-caption">${block.caption}</p>` : ''}
                        </div>
                    `;
                }
                case 'media-row':
                    const rowSizeClass = block.size ? `media-row-${block.size}` : '';
                    return `
                        <div class="post-media-row ${rowSizeClass}">
                            ${block.items.map(item => {
                                const itemSizeClass = item.size ? `media-item-${item.size}` : '';
                                if (item.type === 'image') {
                                    return `
                                        <figure class="media-item media-image ${itemSizeClass}">
                                            <img src="${item.src}" alt="${item.caption || 'Image'}">
                                            ${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}
                                        </figure>
                                    `;
                                } else if (item.type === 'video') {
                                    return `
                                        <figure class="media-item media-video ${itemSizeClass}">
                                            <video controls ${item.muted ? 'muted' : ''}>
                                                <source src="${item.src}" type="video/mp4">
                                            </video>
                                            ${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}
                                        </figure>
                                    `;
                                }
                                return '';
                            }).join('')}
                        </div>
                    `;
                return '';

            case 'code':
                const escapedCode = block.code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `
                    <div class="post-code">
                        ${block.language ? `<span class="code-language">${block.language}</span>` : ''}
                        <pre><code class="language-${block.language || 'plaintext'}">${escapedCode}</code></pre>
                        ${block.caption ? `<p class="code-caption">${block.caption}</p>` : ''}
                    </div>
                `;

            case 'gist':
                // Using a unique ID so we can load the script after render
                const gistContainerId = `gist-${block.gistId.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const gistSizeClass = block.size ? `gist-${block.size}` : '';
                // Queue the gist to be loaded after render
                if (!window.pendingGists) window.pendingGists = [];
                window.pendingGists.push({
                    containerId: gistContainerId,
                    gistId: block.gistId
                });
                return `
                    <div class="post-gist ${gistSizeClass}">
                        <div id="${gistContainerId}" class="gist-container"></div>
                        ${block.caption ? `<p class="gist-caption">${block.caption}</p>` : ''}
                    </div>
                `;

            case 'link':
                return `
                    <p class="post-link">
                        <a href="${block.url}" target="_blank" rel="noopener noreferrer">${block.text || block.url}</a>
                    </p>
                `;

            case 'callout':
                const calloutType = block.style || 'info'; // info, warning, success, note
                return `
                    <div class="post-callout callout-${calloutType}">
                        ${block.title ? `<strong class="callout-title">${block.title}</strong>` : ''}
                        <p>${block.text}</p>
                    </div>
                `;

            default:
                return '';
        }
    }

    // Render a section with heading and blocks
    renderSection(section) {
        const noteHtml = section.note ? `<span class="section-note">${section.note}</span>` : '';
        const headingHtml = section.heading ? 
            `<h3 class="section-heading">${section.heading}${noteHtml}</h3>` : '';
        
        const blocksHtml = section.blocks ? 
            section.blocks.map(block => this.renderBlock(block)).join('') : '';

        return `
            <section class="post-section">
                ${headingHtml}
                ${blocksHtml}
            </section>
        `;
    }

    // Render content - handles both old string format and new structured format
    renderContent(content) {
        // New structured format (array of sections)
        if (Array.isArray(content)) {
            return content.map(section => {
                if (section.type === 'section') {
                    return this.renderSection(section);
                }
                // If it's just a block without section wrapper
                return this.renderBlock(section);
            }).join('');
        }
        
        // Old string format (backwards compatibility)
        if (typeof content === 'string') {
            return content
                .split('\n\n')
                .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
                .join('');
        }

        return '';
    }

    // Render a single blog post
    renderPost(post) {
        // Flatten tags for display
        const allTags = Array.isArray(post.tags) 
            ? post.tags 
            : Object.values(post.tags).flat();
        
        // Render content using new structured format
        const contentHtml = this.renderContent(post.content);
        
        // Legacy images support (for old format posts)
        const legacyImagesHtml = post.images && !Array.isArray(post.content)
            ? `<div class="post-images">
                ${post.images.map(img => `
                    <figure class="post-image">
                        <img src="${img.src}" alt="${img.caption || post.title}">
                        ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
                    </figure>
                `).join('')}
               </div>`
            : '';
        
        const assignmentHtml = post.assignmentDetails
            ? `<div class="assignment-details">
                <button class="assignment-toggle" onclick="this.parentElement.classList.toggle('open')">
                    <span class="toggle-icon">â–¼</span> Assignment Details
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
                    ${legacyImagesHtml}
                    ${assignmentHtml}
                </div>
            </article>
        `;
    }
}

// Initialize and export
const blogManager = new BlogManager();

// Function to load gists after content is rendered
function loadPendingGists() {
    if (!window.pendingGists || window.pendingGists.length === 0) return;
    
    // Dark mode styles for gist
    const darkModeCSS = `
        body { 
            margin: 0; 
            background: transparent !important;
        }
        .gist {
            background: transparent !important;
        }
        .gist .gist-file {
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 8px !important;
            margin-bottom: 0 !important;
            overflow: hidden;
        }
        .gist .gist-data {
            background: #1a1a1a !important;
            border: none !important;
        }
        .gist .gist-meta {
            background: #2a2a2a !important;
            color: #94a3b8 !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
            padding: 10px !important;
        }
        .gist .gist-meta a {
            color: #39ff14 !important;
        }
        .gist .blob-wrapper {
            border-radius: 0 !important;
        }
        .gist .blob-code {
            background: #1a1a1a !important;
            color: #e2e8f0 !important;
            border: none !important;
        }
        .gist .blob-num {
            background: #252525 !important;
            color: #64748b !important;
            border: none !important;
        }
        .gist .pl-c { color: #6b7280 !important; }
        .gist .pl-c1 { color: #f472b6 !important; }
        .gist .pl-s { color: #a5f3a6 !important; }
        .gist .pl-en { color: #93c5fd !important; }
        .gist .pl-k { color: #c4b5fd !important; }
        .gist .pl-smi { color: #e2e8f0 !important; }
        .gist .pl-pds { color: #a5f3a6 !important; }
        .gist .pl-v { color: #fbbf24 !important; }
    `;
    
    window.pendingGists.forEach(gist => {
        const container = document.getElementById(gist.containerId);
        if (!container) return;
        
        // GitHub gists use document.write, so we need a workaround
        // We'll use an iframe approach instead
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.background = 'transparent';
        
        container.appendChild(iframe);
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <base target="_parent">
                <style>${darkModeCSS}</style>
            </head>
            <body>
                <script src="https://gist.github.com/${gist.gistId}.js"><\/script>
            </body>
            </html>
        `);
        iframeDoc.close();
        
        // Auto-resize iframe to fit content
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
                } catch(e) {
                    iframe.style.height = '300px';
                }
            }, 500);
        };
    });
    
    // Clear the queue
    window.pendingGists = [];
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        blogManager.loadPosts();
    });
} else {
    blogManager.loadPosts();
}