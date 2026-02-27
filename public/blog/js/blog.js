// GLPal Blog JavaScript

// Blog posts data
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
    title: "What's New in GLPal",
    excerpt: "Check out the latest features and improvements we've made to enhance your tracking experience.",
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
  text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // Code blocks
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
  
  // Inline code
  text = text.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Blockquotes
  text = text.replace(/^\&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Horizontal rule
  text = text.replace(/^---$/gim, '<hr>');
  
  // Unordered lists
  text = text.replace(/^\- (.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)\n?/gs, '<ul>$1</ul>');
  
  // Ordered lists
  text = text.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Paragraphs - split by double newlines
  const blocks = text.split(/\n\n+/);
  let result = '';
  
  blocks.forEach(block => {
    block = block.trim();
    if (!block) return;
    
    // Skip if already wrapped in HTML tags
    if (block.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/i)) {
      result += block + '\n';
    } else {
      result += '<p>' + block + '</p>\n';
    }
  });
  
  // Clean up
  result = result.replace(/<p><\/p>/g, '');
  result = result.replace(/<p>(<h[1-6]>)/g, '$1');
  result = result.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  result = result.replace(/<p>(<ul>)/g, '$1');
  result = result.replace(/(<\/ul>)<\/p>/g, '$1');
  result = result.replace(/<p>(<ol>)/g, '$1');
  result = result.replace(/(<\/ol>)<\/p>/g, '$1');
  result = result.replace(/<p>(<pre>)/g, '$1');
  result = result.replace(/(<\/pre>)<\/p>/g, '$1');
  result = result.replace(/<p>(<blockquote>)/g, '$1');
  result = result.replace(/(<\/blockquote>)<\/p>/g, '$1');
  result = result.replace(/<p>(<hr>)/g, '$1');
  result = result.replace(/(<hr>)<\/p>/g, '$1');
  
  return result;
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

// Get relative time
function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

// Get all unique categories
function getCategories() {
  const categories = new Set(['All']);
  blogPosts.forEach(post => categories.add(post.category));
  return Array.from(categories);
}

// Render category buttons
function renderCategories(activeCategory = 'All') {
  const container = document.getElementById('categories');
  if (!container) return;
  
  const categories = getCategories();
  
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

// Render more posts (for single post page)
function renderMorePosts(currentSlug) {
  const container = document.getElementById('more-posts-grid');
  if (!container) return;
  
  const otherPosts = blogPosts.filter(p => p.slug !== currentSlug).slice(0, 3);
  
  container.innerHTML = otherPosts.map(post => `
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
    
    // Update meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.setAttribute('content', post.title);
    if (ogDesc) ogDesc.setAttribute('content', post.excerpt);
    
    // Setup share buttons
    setupShareButtons(post);
    
    // Render more posts
    renderMorePosts(slug);
    
  } catch (error) {
    console.error('Error loading post:', error);
    document.getElementById('post-content').innerHTML = '<p>Error loading post. Please try again.</p>';
  }
}

// Setup share buttons
function setupShareButtons(post) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title);
  const desc = encodeURIComponent(post.excerpt);
  
  const twitterBtn = document.getElementById('share-twitter');
  const facebookBtn = document.getElementById('share-facebook');
  const linkedinBtn = document.getElementById('share-linkedin');
  
  if (twitterBtn) {
    twitterBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  }
  if (facebookBtn) {
    facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${desc}`;
  }
  if (linkedinBtn) {
    linkedinBtn.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${desc}`;
  }
}

// Mobile menu toggle
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  if (!menuBtn || !navLinks) return;
  
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  
  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      menuBtn.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
}

// Apply theme preference
function initTheme() {
  const savedTheme = localStorage.getItem('glpal-landing-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initTheme();
  
  // Check if we're on post listing or single post page
  if (document.getElementById('posts-grid')) {
    renderCategories();
    renderPosts();
  }
  
  if (document.getElementById('post-content')) {
    loadPost();
  }
});
