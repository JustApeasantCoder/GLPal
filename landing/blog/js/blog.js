// GLPal Blog JavaScript

// Blog posts data (would typically come from a JSON file or API)
const blogPosts = [
  {
    slug: 'welcome',
    title: 'Welcome to GLPal',
    excerpt: 'Introducing a privacy-first GLP-1 tracking app designed to help you achieve your health goals without compromising your data.',
    category: 'Updates',
    date: '2026-02-27',
    emoji: '👋'
  },
  {
    slug: 'tracking-tips',
    title: '5 Tips for Better Weight Tracking',
    excerpt: 'Learn how to get the most out of your weight tracking journey with these simple but effective strategies.',
    category: 'Tips',
    date: '2026-02-20',
    emoji: '📊'
  },
  {
    slug: 'understanding-glp-1',
    title: 'Understanding GLP-1 Medications',
    excerpt: 'A comprehensive guide to GLP-1 receptor agonists, how they work, and what to expect during your treatment.',
    category: 'Guides',
    date: '2026-02-15',
    emoji: '💊'
  },
  {
    slug: 'peptide-guide',
    title: 'Peptide Tracking Guide',
    excerpt: 'Everything you need to know about tracking peptides and supplements in GLPal for optimal results.',
    category: 'Guides',
    date: '2026-02-10',
    emoji: '🧬'
  },
  {
    slug: 'privacy-first',
    title: 'Why Privacy Matters in Health Apps',
    excerpt: 'Understanding why your health data deserves protection and how GLPal keeps your information secure.',
    category: 'Updates',
    date: '2026-02-05',
    emoji: '🔒'
  },
  {
    slug: 'new-features',
    title: 'What\'s New in GLPal',
    excerpt: 'Check out the latest features and improvements we\'ve made to enhance your tracking experience.',
    category: 'Updates',
    date: '2026-01-28',
    emoji: '✨'
  }
];

// Category icons
const categoryEmojis = {
  'Updates': '📢',
  'Tips': '💡',
  'Guides': '📖'
};

// Simple markdown parser
function parseMarkdown(text) {
  if (!text) return '';
  
  // Headers
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  text = /\*(.*?)\*/gim, '<em>$1</em>';
  
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // Code blocks
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
  
  // Inline code
  text = text.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Blockquotes
  text = text.replace(/^\&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Unordered lists
  text = text.replace(/^\- (.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Ordered lists
  text = text.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Paragraphs
  text = text.replace(/\n\n/g, '</p><p>');
  text = '<p>' + text + '</p>';
  
  // Clean up empty paragraphs
  text = text.replace(/<p><\/p>/g, '');
  text = text.replace(/<p>(<h[1-6]>)/g, '$1');
  text = text.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  text = text.replace(/<p>(<ul>)/g, '$1');
  text = text.replace(/(<\/ul>)<\/p>/g, '$1');
  text = text.replace(/<p>(<pre>)/g, '$1');
  text = text.replace(/(<\/pre>)<\/p>/g, '$1');
  text = text.replace(/<p>(<blockquote>)/g, '$1');
  text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
  
  return text;
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Get all unique categories
function getCategories() {
  const categories = new Set(['All']);
  blogPosts.forEach(post => categories.add(post.category));
  return Array.from(categories);
}

// Render category buttons
function renderCategories(activeCategory = 'All') {
  const categories = getCategories();
  const container = document.getElementById('categories');
  if (!container) return;
  
  container.innerHTML = categories.map(cat => `
    <button class="category-btn ${cat === activeCategory ? 'active' : ''}" 
            data-category="${cat}">
      ${cat === 'All' ? '🏠 All' : (categoryEmojis[cat] || '📁') + ' ' + cat}
    </button>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      renderCategories(category);
      renderPosts(category);
    });
  });
}

// Render post cards
function renderPosts(category = 'All') {
  const grid = document.getElementById('posts-grid');
  if (!grid) return;
  
  const filtered = category === 'All' 
    ? blogPosts 
    : blogPosts.filter(p => p.category === category);
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No posts found in this category.</p>';
    return;
  }
  
  grid.innerHTML = filtered.map(post => `
    <a href="post.html?slug=${post.slug}" class="post-card">
      <div class="post-card-image">${post.emoji}</div>
      <div class="post-card-content">
        <span class="post-card-category">${post.category}</span>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="post-card-meta">
          <span>📅 ${formatDate(post.date)}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// Load single post
async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  
  if (!slug) {
    window.location.href = 'index.html';
    return;
  }
  
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) {
    window.location.href = 'index.html';
    return;
  }
  
  // Load markdown content
  try {
    const response = await fetch(`posts/${slug}.md`);
    if (!response.ok) throw new Error('Post not found');
    const markdown = await response.text();
    
    // Render post
    document.getElementById('post-category').textContent = post.category;
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-date').textContent = formatDate(post.date);
    document.getElementById('post-content').innerHTML = parseMarkdown(markdown);
    
    // Update page title
    document.title = `${post.title} - GLPal Blog`;
    
    // Setup share buttons
    setupShareButtons(post);
    
  } catch (error) {
    console.error('Error loading post:', error);
    document.getElementById('post-content').innerHTML = '<p>Error loading post. Please try again.</p>';
  }
}

// Setup share buttons
function setupShareButtons(post) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title);
  
  document.getElementById('share-twitter').href = 
    `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  document.getElementById('share-facebook').href = 
    `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  document.getElementById('share-linkedin').href = 
    `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on post listing or single post page
  if (document.getElementById('posts-grid')) {
    renderCategories();
    renderPosts();
  }
  
  if (document.getElementById('post-content')) {
    loadPost();
  }
});
