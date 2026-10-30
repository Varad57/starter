/**
 * Starter Dashboard - User Customization & Management System
 * Enables each user to:
 * 1. Add new blocks (categories)
 * 2. Edit URLs, labels, and icons of existing link badges
 * 3. Rename block titles
 * 4. Add new links to any block
 * 5. Delete links or blocks
 * 6. Live search & filter across all blocks and links
 * 7. Export / Import / Reset customizations via localStorage
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'starter_custom_data_v1';
  const DEFAULT_BACKUP_KEY = 'starter_default_data_v1';

  let categories = [];
  let isCustomizeMode = false;
  let activeModal = null;

  // DOM Elements
  const blocksContainer = document.querySelector('main');
  const searchInput = document.getElementById('starter-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const customizeBtn = document.getElementById('customize-btn');
  const customizeActions = document.getElementById('customize-actions');
  const addBlockBtn = document.getElementById('add-block-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // Modal templates container
  let modalContainer = null;

  /**
   * Helper: Normalize URL to ensure protocol
   */
  function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('#') && !url.startsWith('mailto:')) {
      return 'https://' + url;
    }
    return url;
  }

  /**
   * Helper: Get Google favicon URL
   */
  function getFaviconUrl(url) {
    if (!url || url.startsWith('#')) return 'assests/images/link.png';
    try {
      const normalized = normalizeUrl(url);
      const parsed = new URL(normalized);
      return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(parsed.origin)}&sz=32`;
    } catch (e) {
      return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=32`;
    }
  }

  /**
   * Extract initial data from static HTML on first run
   */
  function extractDataFromStaticHTML() {
    const extracted = [];
    const catElements = blocksContainer.querySelectorAll('.cat');

    catElements.forEach((catEl, catIdx) => {
      const titleEl = catEl.querySelector('h2');
      const title = titleEl ? titleEl.textContent.trim() : `Block ${catIdx + 1}`;

      const iconEl = catEl.querySelector('.link-icon');
      const icon = iconEl ? (iconEl.getAttribute('src') || 'assests/images/link.png') : 'assests/images/link.png';

      const links = [];
      const linkElements = catEl.querySelectorAll('a');

      linkElements.forEach((a, linkIdx) => {
        const href = a.getAttribute('href') || '';
        const img = a.querySelector('img');
        const iconSrc = img ? (img.getAttribute('src') || '') : '';

        // Extract text excluding img
        const clone = a.cloneNode(true);
        const cloneImg = clone.querySelector('img');
        if (cloneImg) cloneImg.remove();
        const text = clone.textContent.trim() || 'Link';

        links.push({
          id: `link_${catIdx}_${linkIdx}_${Math.random().toString(36).substr(2, 6)}`,
          title: text,
          url: href,
          icon: iconSrc || getFaviconUrl(href)
        });
      });

      extracted.push({
        id: `block_${catIdx}_${Math.random().toString(36).substr(2, 6)}`,
        title: title,
        icon: icon,
        links: links
      });
    });

    return extracted;
  }

  /**
   * Load categories from localStorage or initialize
   */
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        categories = JSON.parse(saved);
        return;
      }
    } catch (err) {
      console.warn('Could not load custom data from localStorage:', err);
    }

    // First time initialization: extract from DOM
    categories = extractDataFromStaticHTML();

    // Cache the original defaults for "Reset" functionality
    try {
      if (!localStorage.getItem(DEFAULT_BACKUP_KEY)) {
        localStorage.setItem(DEFAULT_BACKUP_KEY, JSON.stringify(categories));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }

  /**
   * Save current categories to localStorage
   */
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (err) {
      console.error('Failed to save categories to localStorage:', err);
      alert('Storage quota exceeded or storage disabled.');
    }
  }

  /**
   * Render the entire blocks grid
   */
  function renderDashboard() {
    blocksContainer.innerHTML = '';

    if (categories.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <h3>No blocks available</h3>
        <p>Click "Customize" above and add your first block!</p>
        <button id="empty-add-block-btn" class="action-btn">➕ Add New Block</button>
      `;
      blocksContainer.appendChild(emptyState);

      const emptyAddBtn = emptyState.querySelector('#empty-add-block-btn');
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', () => openBlockModal('add'));
      }
      return;
    }

    categories.forEach((cat) => {
      const catEl = document.createElement('div');
      catEl.className = 'cat';
      catEl.dataset.catId = cat.id;

      // Category Header
      const headerEl = document.createElement('div');
      headerEl.className = 'cat-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'cat-title-wrap';

      const iconImg = document.createElement('img');
      iconImg.className = 'link-icon';
      iconImg.src = cat.icon || 'assests/images/link.png';
      iconImg.alt = '🚀';

      const h2 = document.createElement('h2');
      h2.className = 'cat-title-text';
      h2.textContent = cat.title;

      titleWrap.appendChild(iconImg);
      titleWrap.appendChild(h2);
      headerEl.appendChild(titleWrap);

      // Category Action Controls (shown in customize mode)
      const actionsEl = document.createElement('div');
      actionsEl.className = 'cat-actions';
      actionsEl.style.display = isCustomizeMode ? 'flex' : 'none';

      actionsEl.innerHTML = `
        <button class="cat-action-btn move-up-btn" title="Move block up">↑</button>
        <button class="cat-action-btn move-down-btn" title="Move block down">↓</button>
        <button class="cat-action-btn add-link-btn" title="Add link to this block">➕ Link</button>
        <button class="cat-action-btn rename-cat-btn" title="Rename block title">✏️ Rename</button>
        <button class="cat-action-btn delete-cat-btn" title="Delete this block">🗑️</button>
      `;

      // Header event listeners
      h2.style.cursor = isCustomizeMode ? 'pointer' : 'default';
      h2.title = isCustomizeMode ? 'Click to rename' : '';
      h2.addEventListener('click', () => {
        if (isCustomizeMode) {
          openBlockModal('rename', cat.id);
        }
      });

      actionsEl.querySelector('.move-up-btn').addEventListener('click', () => {
        moveBlock(cat.id, -1);
      });

      actionsEl.querySelector('.move-down-btn').addEventListener('click', () => {
        moveBlock(cat.id, 1);
      });

      actionsEl.querySelector('.add-link-btn').addEventListener('click', () => {
        openLinkModal('add', cat.id);
      });

      actionsEl.querySelector('.rename-cat-btn').addEventListener('click', () => {
        openBlockModal('rename', cat.id);
      });

      actionsEl.querySelector('.delete-cat-btn').addEventListener('click', () => {
        confirmDeleteBlock(cat.id);
      });

      headerEl.appendChild(actionsEl);
      catEl.appendChild(headerEl);

      // Links container
      const linksContainer = document.createElement('div');
      linksContainer.className = 'cat-links-wrapper';

      cat.links.forEach((link) => {
        const linkBadge = document.createElement('div');
        linkBadge.className = 'link-badge-item';
        linkBadge.dataset.linkId = link.id;

        const a = document.createElement('a');
        a.href = link.url || '#';
        if (link.url && !link.url.startsWith('#')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }

        a.addEventListener('click', (e) => {
          if (isCustomizeMode) {
            e.preventDefault();
            openLinkModal('edit', cat.id, link.id);
          }
        });

        const linkIcon = document.createElement('img');
        linkIcon.src = link.icon || getFaviconUrl(link.url);
        linkIcon.alt = '';
        linkIcon.onerror = function () {
          this.src = 'assests/images/link.png';
        };

        const linkText = document.createElement('span');
        linkText.className = 'link-label';
        linkText.textContent = link.title;

        a.appendChild(linkIcon);
        a.appendChild(linkText);
        linkBadge.appendChild(a);

        // Edit/Delete controls for this link
        const linkControls = document.createElement('div');
        linkControls.className = 'link-badge-controls';
        linkControls.style.display = isCustomizeMode ? 'flex' : 'none';

        linkControls.innerHTML = `
          <button class="badge-mini-btn edit-btn" title="Edit URL or title">✏️</button>
          <button class="badge-mini-btn delete-btn" title="Delete link">✕</button>
        `;

        linkControls.querySelector('.edit-btn').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openLinkModal('edit', cat.id, link.id);
        });

        linkControls.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteLink(cat.id, link.id);
        });

        linkBadge.appendChild(linkControls);
        linksContainer.appendChild(linkBadge);
      });

      catEl.appendChild(linksContainer);
      blocksContainer.appendChild(catEl);
    });

    // If currently searching, apply filter
    if (searchInput && searchInput.value.trim() !== '') {
      filterLinks(searchInput.value.trim());
    }
  }

  /**
   * Move Block up or down
   */
  function moveBlock(catId, direction) {
    const idx = categories.findIndex((c) => c.id === catId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const temp = categories[idx];
    categories[idx] = categories[targetIdx];
    categories[targetIdx] = temp;
    saveData();
    renderDashboard();
  }

  /**
   * Toggle customize mode
   */
  function toggleCustomizeMode() {
    isCustomizeMode = !isCustomizeMode;

    if (isCustomizeMode) {
      document.body.classList.add('customize-mode-active');
      customizeBtn.classList.add('active');
      customizeBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Done Editing</span>';
      if (customizeActions) customizeActions.style.display = 'flex';
    } else {
      document.body.classList.remove('customize-mode-active');
      customizeBtn.classList.remove('active');
      customizeBtn.innerHTML = '<span class="btn-icon">⚙️</span><span class="btn-text">Customize</span>';
      if (customizeActions) customizeActions.style.display = 'none';
    }

    // Toggle visibility of customize handles
    document.querySelectorAll('.cat-actions').forEach((el) => {
      el.style.display = isCustomizeMode ? 'flex' : 'none';
    });

    document.querySelectorAll('.link-badge-controls').forEach((el) => {
      el.style.display = isCustomizeMode ? 'flex' : 'none';
    });
  }

  /**
   * Modal Management
   */
  function ensureModalContainer() {
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'starter-modal-overlay';
      modalContainer.className = 'modal-overlay';
      document.body.appendChild(modalContainer);

      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          closeModal();
        }
      });
    }
    return modalContainer;
  }

  function closeModal() {
    if (modalContainer) {
      modalContainer.innerHTML = '';
      modalContainer.classList.remove('visible');
    }
    activeModal = null;
  }

  /**
   * Modal: Add or Rename Block
   */
  function openBlockModal(mode, catId = null) {
    const overlay = ensureModalContainer();
    const isEdit = mode === 'rename';
    const targetCat = isEdit ? categories.find((c) => c.id === catId) : null;
    const currentTitle = targetCat ? targetCat.title : '';

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>${isEdit ? 'Rename Title Block' : 'Add New Title Block'}</h3>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="block-form" class="modal-body">
          <div class="form-group">
            <label for="block-title-input">Block Title</label>
            <input type="text" id="block-title-input" class="modal-input" placeholder="e.g. AI Tools, Daily Reads..." value="${escapeHtml(currentTitle)}" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="action-btn secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="action-btn primary">${isEdit ? 'Save Changes' : 'Create Block'}</button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('visible');

    const input = document.getElementById('block-title-input');
    input.focus();
    input.select();

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);

    document.getElementById('block-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newTitle = input.value.trim();
      if (!newTitle) return;

      if (isEdit && targetCat) {
        targetCat.title = newTitle;
      } else {
        categories.push({
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: newTitle,
          icon: 'assests/images/link.png',
          links: []
        });
      }

      saveData();
      renderDashboard();
      closeModal();
    });
  }

  /**
   * Modal: Add or Edit Link (URL, Label, Icon)
   */
  function openLinkModal(mode, catId, linkId = null) {
    const overlay = ensureModalContainer();
    const isEdit = mode === 'edit';
    const currentCat = categories.find((c) => c.id === catId);
    if (!currentCat) return;

    let targetLink = null;
    if (isEdit) {
      targetLink = currentCat.links.find((l) => l.id === linkId);
      if (!targetLink) return;
    }

    const currentTitle = targetLink ? targetLink.title : '';
    const currentUrl = targetLink ? targetLink.url : '';
    const currentIcon = targetLink ? targetLink.icon : '';

    // Category options for dropdown
    const catOptionsHtml = categories
      .map((c) => `<option value="${c.id}" ${c.id === catId ? 'selected' : ''}>${escapeHtml(c.title)}</option>`)
      .join('');

    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Link URL & Details' : 'Add New Link'}</h3>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="link-form" class="modal-body">
          <div class="form-group">
            <label for="link-cat-select">Block / Category</label>
            <select id="link-cat-select" class="modal-input modal-select">
              ${catOptionsHtml}
            </select>
          </div>
          <div class="form-group">
            <label for="link-url-input">Target URL (Web Address)</label>
            <input type="text" id="link-url-input" class="modal-input" placeholder="https://example.com" value="${escapeHtml(currentUrl)}" required />
          </div>
          <div class="form-group">
            <label for="link-title-input">Display Title</label>
            <input type="text" id="link-title-input" class="modal-input" placeholder="e.g. GitHub" value="${escapeHtml(currentTitle)}" required />
          </div>
          <div class="form-group">
            <label for="link-icon-input">Custom Icon URL (Optional)</label>
            <div class="icon-input-row">
              <input type="text" id="link-icon-input" class="modal-input" placeholder="Leave empty for auto-favicon" value="${escapeHtml(currentIcon)}" />
              <img id="icon-preview-img" class="icon-preview" src="${currentIcon || getFaviconUrl(currentUrl)}" alt="preview" />
            </div>
            <small class="form-tip">Leave blank to automatically fetch the website's favicon.</small>
          </div>
          <div class="modal-actions">
            <button type="button" class="action-btn secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="action-btn primary">${isEdit ? 'Save Changes' : 'Add Link'}</button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('visible');

    const urlInput = document.getElementById('link-url-input');
    const titleInput = document.getElementById('link-title-input');
    const iconInput = document.getElementById('link-icon-input');
    const iconPreview = document.getElementById('icon-preview-img');
    const catSelect = document.getElementById('link-cat-select');

    // Auto update preview when URL changes
    urlInput.addEventListener('input', () => {
      if (!iconInput.value.trim()) {
        const fav = getFaviconUrl(urlInput.value.trim());
        iconPreview.src = fav;
      }
      // Auto-suggest title if empty and url looks like domain
      if (!titleInput.value.trim() && urlInput.value.trim()) {
        try {
          const parsed = new URL(normalizeUrl(urlInput.value.trim()));
          const hostname = parsed.hostname.replace(/^www\./, '');
          titleInput.value = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        } catch (e) {}
      }
    });

    iconInput.addEventListener('input', () => {
      iconPreview.src = iconInput.value.trim() || getFaviconUrl(urlInput.value.trim());
    });

    iconPreview.onerror = function () {
      this.src = 'assests/images/link.png';
    };

    urlInput.focus();
    if (!isEdit) {
      urlInput.select();
    }

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);

    document.getElementById('link-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawUrl = urlInput.value.trim();
      const normUrl = normalizeUrl(rawUrl);
      const title = titleInput.value.trim() || normUrl;
      const customIcon = iconInput.value.trim();
      const selectedCatId = catSelect.value;
      const resolvedIcon = customIcon || getFaviconUrl(normUrl);

      if (isEdit && targetLink) {
        // If block changed, move link
        if (selectedCatId !== catId) {
          // Remove from old cat
          currentCat.links = currentCat.links.filter((l) => l.id !== linkId);
          // Add to new cat
          const newCat = categories.find((c) => c.id === selectedCatId);
          if (newCat) {
            targetLink.title = title;
            targetLink.url = normUrl;
            targetLink.icon = resolvedIcon;
            newCat.links.push(targetLink);
          }
        } else {
          targetLink.title = title;
          targetLink.url = normUrl;
          targetLink.icon = resolvedIcon;
        }
      } else {
        const destCat = categories.find((c) => c.id === selectedCatId) || currentCat;
        destCat.links.push({
          id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: title,
          url: normUrl,
          icon: resolvedIcon
        });
      }

      saveData();
      renderDashboard();
      closeModal();
    });
  }

  /**
   * Delete Link
   */
  function deleteLink(catId, linkId) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const link = cat.links.find((l) => l.id === linkId);
    const linkName = link ? link.title : 'this link';

    if (confirm(`Are you sure you want to delete "${linkName}"?`)) {
      cat.links = cat.links.filter((l) => l.id !== linkId);
      saveData();
      renderDashboard();
    }
  }

  /**
   * Confirm and Delete Block
   */
  function confirmDeleteBlock(catId) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    if (
      confirm(
        `Are you sure you want to delete the block "${cat.title}" and its ${cat.links.length} link(s)?`
      )
    ) {
      categories = categories.filter((c) => c.id !== catId);
      saveData();
      renderDashboard();
    }
  }

  /**
   * Modal: Manage Customizations (Backup / Restore / Reset)
   */
  function openSettingsModal() {
    const overlay = ensureModalContainer();

    overlay.innerHTML = `
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Manage & Backup Customizations</h3>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="manage-desc">
            Your customized blocks and links are saved in your browser's local storage.
            You can export your configuration to take to another computer, or restore defaults at any time.
          </p>

          <div class="manage-section">
            <h4>Export Configuration</h4>
            <div class="modal-actions-inline">
              <button class="action-btn secondary" id="export-copy-btn">📋 Copy JSON to Clipboard</button>
              <button class="action-btn secondary" id="export-download-btn">⬇️ Download backup.json</button>
            </div>
          </div>

          <div class="manage-section">
            <h4>Import Configuration</h4>
            <textarea id="import-json-input" class="modal-textarea" placeholder="Paste your exported JSON data here..."></textarea>
            <div class="modal-actions-inline">
              <button class="action-btn primary" id="import-btn">📥 Import and Apply</button>
            </div>
          </div>

          <div class="manage-section danger-zone">
            <h4>Reset Defaults</h4>
            <p>Restore the default links and categories originally provided by Starter.</p>
            <button class="action-btn danger" id="reset-defaults-btn">🔄 Reset to Defaults</button>
          </div>
        </div>
      </div>
    `;

    overlay.classList.add('visible');

    document.getElementById('modal-close').addEventListener('click', closeModal);

    // Export copy
    document.getElementById('export-copy-btn').addEventListener('click', () => {
      const dataStr = JSON.stringify(categories, null, 2);
      navigator.clipboard.writeText(dataStr).then(
        () => alert('Configuration JSON copied to clipboard!'),
        () => alert('Failed to copy. Please manually select and copy.')
      );
    });

    // Export download
    document.getElementById('export-download-btn').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(categories, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `starter_bookmarks_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Import
    document.getElementById('import-btn').addEventListener('click', () => {
      const text = document.getElementById('import-json-input').value.trim();
      if (!text) {
        alert('Please paste valid JSON data.');
        return;
      }
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('Data must be an array of blocks');
        }
        categories = parsed;
        saveData();
        renderDashboard();
        closeModal();
        alert('Customization successfully imported!');
      } catch (err) {
        alert('Invalid JSON format: ' + err.message);
      }
    });

    // Reset Defaults
    document.getElementById('reset-defaults-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all blocks and links back to original defaults? All your customized blocks and URLs will be overwritten.')) {
        try {
          const defaultSaved = localStorage.getItem(DEFAULT_BACKUP_KEY);
          if (defaultSaved) {
            categories = JSON.parse(defaultSaved);
          } else {
            categories = extractDataFromStaticHTML();
          }
          saveData();
          renderDashboard();
          closeModal();
          alert('Reset to defaults complete!');
        } catch (err) {
          alert('Error restoring defaults: ' + err.message);
        }
      }
    });
  }

  /**
   * Search / Filter Links & Blocks
   */
  function filterLinks(query) {
    query = query.toLowerCase().trim();

    if (!query) {
      document.querySelectorAll('.cat').forEach((catEl) => {
        catEl.style.display = '';
        catEl.querySelectorAll('.link-badge-item').forEach((item) => {
          item.style.display = '';
        });
      });
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      return;
    }

    if (clearSearchBtn) clearSearchBtn.style.display = 'inline-flex';

    document.querySelectorAll('.cat').forEach((catEl) => {
      const titleEl = catEl.querySelector('.cat-title-text');
      const catTitle = titleEl ? titleEl.textContent.toLowerCase() : '';
      const catMatches = catTitle.includes(query);

      let visibleLinksInCat = 0;
      catEl.querySelectorAll('.link-badge-item').forEach((item) => {
        const label = item.querySelector('.link-label')?.textContent.toLowerCase() || '';
        const url = item.querySelector('a')?.getAttribute('href')?.toLowerCase() || '';

        if (catMatches || label.includes(query) || url.includes(query)) {
          item.style.display = '';
          visibleLinksInCat++;
        } else {
          item.style.display = 'none';
        }
      });

      // Show block if the category itself matches query, or if any links matched
      if (catMatches || visibleLinksInCat > 0) {
        catEl.style.display = '';
      } else {
        catEl.style.display = 'none';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Initialize on DOMContentLoaded
   */
  function init() {
    loadData();
    renderDashboard();

    // Event listeners
    if (customizeBtn) {
      customizeBtn.addEventListener('click', toggleCustomizeMode);
    }

    if (addBlockBtn) {
      addBlockBtn.addEventListener('click', () => openBlockModal('add'));
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterLinks(e.target.value);
      });

      // Escape key clears search
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          filterLinks('');
          searchInput.blur();
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterLinks('');
        searchInput.focus();
      });
    }

    // Keyboard shortcut: Ctrl+E or Cmd+E toggles customize mode, "/" focuses search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggleCustomizeMode();
      } else if (e.key === '/' && document.activeElement !== searchInput && !activeModal) {
        e.preventDefault();
        searchInput?.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
