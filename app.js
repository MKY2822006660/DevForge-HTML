const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const TIMING = {
  appBoot: 5000,
  splitTransition: 0,
  modelLoad: 1500,
  textResponse: 650,
  appBuilderResponse: 3000,
  imageGeneration: 3000,
  videoGeneration: 3000,
  mediaSwapFade: 200,
  toastDuration: 3000,
  toastExit: 300,
  copyFeedback: 2000,
  sandboxSpin: 400,
  fallbackTransition: 650
};

const SAMPLE_SANDBOX_URL = 'https://example.com';

const state = {
  isSplitMode: false,
  isModelLoaded: false,
  isProcessing: false,
  currentMode: 'flux44',
  selectedModelName: '',
  appReady: false,
  theme: 'dark'
};



const MODELS = [
  {
    id: 'llama-3-8b-q4',
    name: 'Llama-3-8B-Instruct',
    family: 'Llama',
    quant: 'Q4_K_M',
    size: '4.9 GB',
    memoryReq: '~5.8 GB',
    context: '8,192',
    speed: '~45 t/s',
    desc: 'Meta\'s latest efficient instruction-tuned model. Optimized for dialogue use cases.',
    arch: 'Decoder-only Transformer (GQA)',
    license: 'Llama 3 Community',
    files: [
      { name: 'llama-3-8b-instruct.Q4_K_M.gguf', path: '/', type: 'GGUF', size: '4.92 GB' },
      { name: 'tokenizer.json', path: '/', type: 'JSON', size: '1.5 MB' },
      { name: 'special_tokens_map.json', path: '/', type: 'JSON', size: '24 KB' }
    ],
    tech: {
      params: '8.0 Billion',
      tensors: '291',
      dtype: 'F16 / Q4_K',
      vocab: '128,256',
      tokenizer: 'TikToken (BPE)',
      rope: 'Linear (Base 500k)',
      heads: '32 (Q), 8 (KV)',
      layers: '32',
      embedding: '4096'
    },
    hash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    date: 'May 24, 2026 at 10:42 AM',
    hardware: [
      { metric: 'VRAM Load', value: '5.8 GB', status: 'OK' },
      { metric: 'KV Cache (8k)', value: '+1.2 GB', status: 'OK' },
      { metric: 'Metal Support', value: 'Yes (Accelerated)', status: 'Active' },
      { metric: 'Flash Attention', value: 'Supported', status: 'On' }
    ]
  },
  {
    id: 'qwen-2-72b-q2',
    name: 'Qwen-2-72B-Instruct',
    family: 'Qwen',
    quant: 'Q2_K',
    size: '28.4 GB',
    memoryReq: '~30.5 GB',
    context: '32,768',
    speed: '~8 t/s',
    desc: 'Alibaba Cloud\'s flagship large language model. Massive parameter count requiring high unified memory.',
    arch: 'Decoder-only Transformer (SwiGLU)',
    license: 'Apache 2.0',
    files: [
      { name: 'qwen-2-72b.Q2_K.gguf', path: '/', type: 'GGUF', size: '28.4 GB' },
      { name: 'config.json', path: '/', type: 'JSON', size: '4 KB' }
    ],
    tech: {
      params: '72.0 Billion',
      tensors: '740',
      dtype: 'F16 / Q2_K',
      vocab: '151,643',
      tokenizer: 'Qwen Tokenizer',
      rope: 'YaRN (Dynamic)',
      heads: '64 (Q), 4 (KV)',
      layers: '80',
      embedding: '8192'
    },
    hash: 'sha256:9988776655443322110099887766554433221100998877665544332211009988',
    date: 'May 20, 2026 at 09:15 AM',
    hardware: [
      { metric: 'VRAM Load', value: '30.5 GB', status: 'Warning (High)' },
      { metric: 'KV Cache (32k)', value: '+8.4 GB', status: 'Critical' },
      { metric: 'Metal Support', value: 'Yes', status: 'Active' },
      { metric: 'Swap Usage', value: 'Likely', status: 'Slow' }
    ]
  }
];

let currentModel = null;

/**
 * ==========================================
 * CORE FUNCTIONS
 * ==========================================
 */
/**
 * ==========================================
 * CORE FUNCTIONS (MODELS EXPLORER)
 * ==========================================
 */
function initModelsExplorer() {
  renderList();

  // Search Listener
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.list-item');
    items.forEach(item => {
      const txt = item.innerText.toLowerCase();
      item.style.display = txt.includes(term) ? 'flex' : 'none';
    });
  });
}


class TerminalTab {
  constructor(id) {
    this.id = id;
    this.title = `zsh`;
    this.pwd = '~';
    this.outputHTML = `<div class="output-line dim">Last login: ${new Date().toString().split(' GMT')[0]} on ttys00${id}</div>`;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentInput = '';
  }
}

// DOM Elements
const tabsContainer = document.getElementById('tabs-container');
const outputEl = document.getElementById('output');
const inputEl = document.getElementById('cmd-input');
const wrapperEl = document.getElementById('terminal-wrapper');
const pwdEl = document.getElementById('pwd-display');

// State
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Initialization
function initTerminal() {
  createNewTab();

  // Focus input anywhere in terminal body
  wrapperEl.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection.toString().length === 0) {
      inputEl.focus();
    }
  });
}

// Tab Management
function createNewTab() {
  saveCurrentTabState();
  const newTab = new TerminalTab(nextTabId++);
  tabs.push(newTab);
  activeTabId = newTab.id;
  renderTabs();
  loadTabState();
}

function switchTab(id) {
  if (activeTabId === id) return;
  saveCurrentTabState();
  activeTabId = id;
  renderTabs();
  loadTabState();
}

function closeTab(id, event) {
  event.stopPropagation();

  // If only one tab left, just reset it
  if (tabs.length === 1) {
    restartTerminal();
    return;
  }

  saveCurrentTabState();
  const tabIndex = tabs.findIndex(t => t.id === id);
  tabs = tabs.filter(t => t.id !== id);

  // Determine new active tab if the closed one was active
  if (activeTabId === id) {
    const newIndex = Math.min(tabIndex, tabs.length - 1);
    activeTabId = tabs[newIndex].id;
  }

  renderTabs();
  loadTabState();
}

function restartTerminal() {
  tabs = [];
  activeTabId = null;
  nextTabId = 1;
  createNewTab();
}

// State Sync
function saveCurrentTabState() {
  if (!activeTabId) return;
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.outputHTML = outputEl.innerHTML;
    activeTab.currentInput = inputEl.value;
  }
}

function loadTabState() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    outputEl.innerHTML = activeTab.outputHTML;
    inputEl.value = activeTab.currentInput;
    pwdEl.textContent = activeTab.pwd;
    scrollToBottom();
    inputEl.focus();
  }
}

function renderTabs() {
  tabsContainer.innerHTML = '';
  tabs.forEach(tab => {
    const tabDiv = document.createElement('div');
    tabDiv.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
    tabDiv.onclick = () => switchTab(tab.id);

    tabDiv.innerHTML = `
                <div class="tab-title">
                    <span class="tab-icon">❯_</span>
                    <span>${tab.title}</span>
                </div>
                <div class="close-tab" title="Close Tab">×</div>
            `;

    tabDiv.querySelector('.close-tab').onclick = (e) => closeTab(tab.id, e);
    tabsContainer.appendChild(tabDiv);
  });
}

// Terminal Logic
function printLine(htmlText, isDim = false) {
  const div = document.createElement('div');
  div.className = `output-line ${isDim ? 'dim' : ''}`;
  div.innerHTML = htmlText;
  outputEl.appendChild(div);
}

function scrollToBottom() {
  wrapperEl.scrollTop = wrapperEl.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Input Handling
inputEl.addEventListener('keydown', function (e) {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;

  if (e.key === 'Enter') {
    const cmd = inputEl.value.trim();

    if (cmd !== '') {
      activeTab.commandHistory.push(cmd);
    }
    activeTab.historyIndex = activeTab.commandHistory.length;

    // Print prompt and command
    printLine(`<span class="prompt">username@mac ${activeTab.pwd} %</span> ${escapeHTML(cmd)}`);

    inputEl.value = '';
    executeCommand(cmd, activeTab);
    scrollToBottom();
    saveCurrentTabState();

  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (activeTab.historyIndex > 0) {
      activeTab.historyIndex--;
      inputEl.value = activeTab.commandHistory[activeTab.historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (activeTab.historyIndex < activeTab.commandHistory.length - 1) {
      activeTab.historyIndex++;
      inputEl.value = activeTab.commandHistory[activeTab.historyIndex];
    } else {
      activeTab.historyIndex = activeTab.commandHistory.length;
      inputEl.value = '';
    }
  }
});

// Command Execution
function executeCommand(cmd, tab) {
  if (cmd === '') return;

  const parts = cmd.split(' ').filter(p => p !== '');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (command) {
    case 'help':
      printLine('Available commands:');
      printLine('  help    - list all commands');
      printLine('  clear   - clear the terminal output');
      printLine('  echo    - print text to the terminal');
      printLine('  ls      - show files in directory');
      printLine('  pwd     - show working directory');
      printLine('  date    - show current date/time');
      printLine('  reset   - restart the entire terminal setup');
      printLine('  about   - show info about the terminal');
      break;
    case 'clear':
      outputEl.innerHTML = '';
      break;
    case 'echo':
      printLine(escapeHTML(args));
      break;
    case 'ls':
      printLine('<span style="color:#64b5f6">Desktop</span>    <span style="color:#64b5f6">Documents</span>  <span style="color:#64b5f6">Downloads</span>  <span style="color:#64b5f6">Library</span>    <span style="color:#64b5f6">Movies</span>     <span style="color:#64b5f6">Music</span>      <span style="color:#64b5f6">Pictures</span>   <span style="color:#64b5f6">Public</span>');
      break;
    case 'pwd':
      printLine(`/Users/username${tab.pwd === '~' ? '' : tab.pwd.replace('~', '')}`);
      break;
    case 'date':
      printLine(new Date().toString());
      break;
    case 'reset':
      restartTerminal();
      break;
    case 'about':
      printLine('macOS Fullscreen Terminal Emulator');
      printLine('Features: Tab management, isolated command history, dynamic environment.');
      break;
    default:
      printLine(`zsh: command not found: ${escapeHTML(command)}`);
  }
}

// Button Listeners
document.getElementById('new-tab-btn').addEventListener('click', createNewTab);
document.getElementById('restart-btn').addEventListener('click', restartTerminal);




function renderList() {
  const list = document.getElementById('modelList');
  list.innerHTML = '';

  if (MODELS.length === 0) {
    list.innerHTML = '<div style="padding:20px; text-align:center; color:#555">No models found.</div>';
    return;
  }

  MODELS.forEach(m => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.onclick = () => inspectModel(m.id); // FIX: Changed from loadModel to inspectModel
    div.innerHTML = `
            <div class="item-name">${m.name}</div>
            <div class="item-meta">
                <span>${m.quant}</span>
                <span>${m.size}</span>
            </div>
        `;
    list.appendChild(div);
  });
}

// FIX: Renamed from loadModel(id) to inspectModel(id) to prevent namespace collision
function inspectModel(id) {
  currentModel = MODELS.find(m => m.id === id);
  if (!currentModel) return;

  // Update Active UI
  document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));

  // Show Panel
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('detailView').style.display = 'flex';

  // Populate Overview
  document.getElementById('modelName').innerText = currentModel.name;
  document.getElementById('modelPath').innerText = `~/Models/${currentModel.family}/${currentModel.id}`;
  document.getElementById('ov-memory').innerText = currentModel.memoryReq;
  document.getElementById('ov-quant').innerText = currentModel.quant;
  document.getElementById('ov-context').innerText = currentModel.context;
  document.getElementById('ov-speed').innerText = currentModel.speed;
  document.getElementById('ov-desc').innerText = currentModel.desc;
  document.getElementById('ov-arch').innerText = currentModel.arch;
  document.getElementById('ov-license').innerText = currentModel.license;

  // Populate Technical
  const tech = currentModel.tech;
  const techBody = document.getElementById('tech-table-body');
  techBody.innerHTML = `
        <tr><td>Total Parameters</td><td class="card-mono">${tech.params}</td></tr>
        <tr><td>Tensor Count</td><td>${tech.tensors}</td></tr>
        <tr><td>Data Types</td><td>${tech.dtype}</td></tr>
        <tr><td>Attention Heads</td><td>${tech.heads}</td></tr>
        <tr><td>Layer Count</td><td>${tech.layers}</td></tr>
        <tr><td>Embedding Size</td><td>${tech.embedding}</td></tr>
    `;
  document.getElementById('tech-tokenizer').innerText = tech.tokenizer;
  document.getElementById('tech-vocab').innerText = tech.vocab;
  document.getElementById('tech-rope').innerText = tech.rope;

  // Populate Files
  document.getElementById('file-hash').innerText = currentModel.hash;
  document.getElementById('file-date').innerText = currentModel.date;

  const filePreview = document.getElementById('file-list-preview');
  const modalList = document.getElementById('modal-file-list');
  let fileHTML = '';

  currentModel.files.forEach(f => {
    fileHTML += `
            <div class="file-row">
                <div>${f.name}</div>
                <div style="color:var(--text-secondary)">...${f.path}</div>
                <div><span class="tag">${f.type}</span></div>
                <div style="text-align:right; font-family:var(--font-mono)">${f.size}</div>
            </div>
        `;
  });

  filePreview.innerHTML = fileHTML;
  modalList.innerHTML = fileHTML;

  // Populate Hardware
  const hwBody = document.getElementById('hw-table-body');
  hwBody.innerHTML = currentModel.hardware.map(h => `
        <tr>
            <td>${h.metric}</td>
            <td>${h.value}</td>
            <td>
                <span class="tag ${h.status.includes('OK') || h.status.includes('Active') || h.status.includes('On') ? 'green' : ''} ${h.status.includes('Critical') ? 'danger' : ''}" 
                      style="${h.status.includes('Warning') ? 'background:rgba(255,159,10,0.2); color:var(--accent-orange)' : ''}">
                    ${h.status}
                </span>
            </td>
        </tr>
    `).join('');

  // Reset Tab
  switchTab('overview');
}

function switchTab(tabName) {
  // Hide all contents
  ['overview', 'technical', 'files', 'hardware'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = 'none';
  });
  // Remove active class from headers
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  // Show selected
  document.getElementById(`tab-${tabName}`).style.display = 'block';
  // Add active class to clicked header (simple traversal)
  event.target.classList.add('active');
}

/* --- ACTIONS --- */

function openFolder() {
  alert(`[SYSTEM]\nOpening Finder window:\n${document.getElementById('modelPath').innerText}`);
}

function zipModel() {
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Zipping...`;
  setTimeout(() => {
    btn.innerHTML = originalText;
    alert("Model successfully zipped to Desktop.");
  }, 1500);
}

/* --- FILE MODAL --- */
function openFileModal() {
  document.getElementById('fileModal').classList.add('active');
}
function closeFileModal() {
  document.getElementById('fileModal').classList.remove('active');
}

/* --- DELETE WORKFLOW --- */
function confirmDelete() {
  if (!currentModel) return;
  document.getElementById('deleteTargetName').innerText = currentModel.name;
  document.getElementById('deleteModal').classList.add('active');

  // Reset Modal State
  document.getElementById('deleteProgressArea').style.display = 'none';
  document.getElementById('deleteFooter').style.display = 'flex';
  document.getElementById('deleteProgressBar').style.width = '0%';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
}

function executeDelete() {
  // UI Updates
  document.getElementById('deleteFooter').style.display = 'none';
  document.getElementById('deleteProgressArea').style.display = 'block';

  const bar = document.getElementById('deleteProgressBar');
  const status = document.getElementById('deleteStatusText');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;

    if (progress < 30) status.innerText = "Removing tensors...";
    else if (progress < 70) status.innerText = "Clearing cache...";
    else if (progress < 90) status.innerText = "Finalizing...";
    else status.innerText = "Done.";

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        // Remove from data
        const idx = MODELS.findIndex(m => m.id === currentModel.id);
        if (idx > -1) MODELS.splice(idx, 1);

        closeDeleteModal();
        renderList();

        // Reset View
        currentModel = null;
        document.getElementById('detailView').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
      }, 500);
    }
  }, 100);
}

// Close modals on outside click
window.onclick = function (event) {
  if (event.target == document.getElementById('fileModal')) closeFileModal();
  if (event.target == document.getElementById('deleteModal')) closeDeleteModal();
}

const dom = {
  body: document.body,
  mainApp: qs('#main-app'),
  loader: qs('#loader'),
  loaderPanel: qs('#panel'),
  dotsEl: qs('.dots'),
  toastContainer: qs('#toast-container'),
  modalOverlay: qs('#modalOverlay'),
  settingsWindow: qs('#settingsWindow'),
  openSettingsBtn: qs('#openSettings'),
  closeSettingsBtn: qs('#closeBtn'),
  mainInput: qs('#main-input'),
  submitBtn: qs('#submit-btn'),
  outputArea: qs('#output-area'),
  selectedModelNameDisplay: qs('#selected-model-name'),
  modelLoading: qs('#model-loading'),
  ejectBtn: qs('#eject-btn'),
  configModal: qs('#config-modal'),
  closeModalBtn: qs('#close-modal'),
  confirmLoadBtn: qs('#confirm-load-btn'),
  modalTitle: qs('#modal-title'),
  leftSplit: qs('#left-split'),
  rightSplit: qs('#right-split'),
  resizer: qs('#resizer'),
  buildingAnim: qs('#building-anim'),
  previewIframe: qs('#preview-iframe'),
  sandboxReloadBtn: qs('#sandbox-reload'),
  sandboxSelect: qs('#sandbox-page-select'),
  modelDropdownTrigger: qs('#model-dropdown-trigger'),
  customModelDropdown: qs('#custom-model-dropdown'),
  modelSearchInput: qs('#model-search-input'),
  modelItems: qsa('.model-row'),
  manualParamsToggle: qs('#manual-params-toggle'),
  sidebarIcons: qsa('.sidebar-icon[data-view]'),
  mainViews: qsa('.main-view'),
  topNavTitle: qs('#top-nav-title'),
  modelCenterNav: qs('#model-center-nav'),
  tabNavItems: qsa('.nav-item[data-tab], .sidebar-footer[data-tab]'),
  tabContents: qsa('.tab-content'),
  modesPanel: qs('#modesPanel'),
  modeCards: qsa('.mode-card'),
  modeViews: qsa('.mode-view'),
  downloadsModal: qs('#downloads-modal'),
  closeDownloadsBtn: qs('#close-downloads-modal'),
};

function openDownloadsModal() {
  dom.downloadsModal?.classList.add('active');

  // 1. Remove highlight from all sidebar icons, then add it ONLY to tab-four
  dom.sidebarIcons.forEach(icon => {
    icon.classList.toggle('active', icon.getAttribute('data-view') === 'tab-four');
  });
}

function closeDownloadsModal() {
  dom.downloadsModal?.classList.remove('active');

  // 1. Find which page is still sitting open in the background
  const activeMainView = document.querySelector('.main-view.active');
  const activeViewId = activeMainView ? activeMainView.id : 'chat-view';

  // 2. Restore the highlight to that background page's icon, and remove it from tab-four
  dom.sidebarIcons.forEach(icon => {
    icon.classList.toggle('active', icon.getAttribute('data-view') === activeViewId);
  });
}

const imageVersionData = {
  'v1.0': { dimensions: '1024 × 1024 px', size: '2.4 MB', seed: '492847103' },
  'v1.1': { dimensions: '1024 × 1024 px', size: '2.6 MB', seed: '492847104' },
  'v1.2': { dimensions: '1024 × 1024 px', size: '2.5 MB', seed: '492847105' },
  'v2.0': { dimensions: '1024 × 1024 px', size: '2.8 MB', seed: '492847106' }
};

const videoVersionData = {
  'v1.0': { resolution: '1920 × 1080', duration: '0:15', fps: '30 fps', size: '12.4 MB', seed: '847291056' },
  'v1.1': { resolution: '1920 × 1080', duration: '0:15', fps: '30 fps', size: '13.1 MB', seed: '847291057' },
  'v1.2': { resolution: '1920 × 1080', duration: '0:15', fps: '30 fps', size: '12.8 MB', seed: '847291058' },
  'v2.0': { resolution: '1920 × 1080', duration: '0:15', fps: '30 fps', size: '14.2 MB', seed: '847291059' }
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function iconMarkup(type) {
  if (type === 'error') {
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>`;
  }

  return `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;
}



function aiAvatarSvg() {
  return `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <path d="M9 16c1 .8 5 .8 6 0"></path>
    </svg>`;
}

function userAvatarSvg() {
  return `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`;
}

function showToast(message, type = 'success') {
  if (!dom.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${iconMarkup(type)}<span>${escapeHtml(message)}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s var(--ease-out) forwards';
    setTimeout(() => toast.remove(), TIMING.toastExit);
  }, TIMING.toastDuration);
}

window.copyText = function copyText(text, btnElement) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(() => {
    if (!btnElement) return;
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10b981" stroke-width="2" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    setTimeout(() => {
      btnElement.innerHTML = originalHTML;
    }, TIMING.copyFeedback);
  }).catch(() => {
    showToast('Could not copy to clipboard.', 'error');
  });
};

function openSettings() {
  if (!dom.modalOverlay || !dom.settingsWindow) return;
  dom.modalOverlay.classList.add('active');
  dom.settingsWindow.classList.add('active');
}

function closeSettings() {
  if (!dom.modalOverlay || !dom.settingsWindow) return;
  dom.modalOverlay.classList.remove('active');
  dom.settingsWindow.classList.remove('active');
}

function updateTopNavForView(viewId) {
  if (!dom.topNavTitle || !dom.modelCenterNav) return;

  // Toggle the System Monitor Button visibility
  const widgetToggle = qs('#widgetToggle');
  if (widgetToggle) {
    widgetToggle.style.display = (viewId === 'chat-view') ? 'flex' : 'none';
  }

  if (viewId === 'chat-view') {
    dom.modelCenterNav.style.display = 'flex';
    dom.topNavTitle.style.display = 'none';
    return;
  }

  if (viewId === 'chat-view') {
    dom.modelCenterNav.style.display = 'flex';
    dom.topNavTitle.style.display = 'none';
    return;
  }

  dom.modelCenterNav.style.display = 'none';
  dom.topNavTitle.style.display = 'block';

  // Add your new tab names here!
  if (viewId === 'models-view') dom.topNavTitle.textContent = 'Developer Tab';
  else if (viewId === 'tab-one') dom.topNavTitle.textContent = 'Models Explorer';
  else if (viewId === 'tab-two') dom.topNavTitle.textContent = 'Terminal';
  else if (viewId === 'tab-three') dom.topNavTitle.textContent = 'Extensions & Plugins';
  else if (viewId === 'tab-four') dom.topNavTitle.textContent = 'Model Downloads';
  else if (viewId === 'tab-five') dom.topNavTitle.textContent = 'Models Explorer';
  else if (viewId === 'tab-six') dom.topNavTitle.textContent = 'Terminal';
  else if (viewId === 'tab-seven') dom.topNavTitle.textContent = 'Extensions & Plugins';
  else if (viewId === 'tab-eight') dom.topNavTitle.textContent = 'Model Downloads';
  else if (viewId === 'tab-nine') dom.topNavTitle.textContent = 'Activity Monitor';
}

function setMainView(targetViewId) {
  dom.mainViews.forEach(view => {
    const isActive = view.id === targetViewId;
    view.classList.toggle('active', isActive);
    view.style.display = isActive ? (view.id === 'chat-view' ? 'flex' : 'block') : 'none';
  });

  dom.sidebarIcons.forEach(icon => {
    icon.classList.toggle('active', icon.getAttribute('data-view') === targetViewId);
  });

  updateTopNavForView(targetViewId);
}

function setActiveTab(tabId) {
  dom.tabNavItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabId);

  });

  dom.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

function closeModelDropdown() {
  dom.customModelDropdown?.classList.remove('active');
}

function openModelConfig(modelName) {
  state.selectedModelName = modelName;
  if (dom.selectedModelNameDisplay) {
    dom.selectedModelNameDisplay.textContent = modelName;
    dom.selectedModelNameDisplay.classList.remove('placeholder');
  }
  if (dom.modalTitle) {
    dom.modalTitle.innerHTML = `${escapeHtml(modelName)} <span>Config</span>`;
  }
  dom.configModal?.classList.add('active');
}

function closeModelConfig() {
  dom.configModal?.classList.remove('active');
  if (!state.isModelLoaded && dom.selectedModelNameDisplay) {
    dom.selectedModelNameDisplay.textContent = 'Select a model to load...';
    dom.selectedModelNameDisplay.classList.add('placeholder');
    state.selectedModelName = '';
  }
}

function syncSliderInput(sliderId, inputId) {
  const slider = qs(`#${sliderId}`);
  const input = qs(`#${inputId}`);
  if (!slider || !input) return;

  slider.addEventListener('input', () => {
    input.value = slider.value;
  });

  input.addEventListener('change', () => {
    slider.value = input.value;
  });
}

function loadModel() {
  const modelName = state.selectedModelName || dom.selectedModelNameDisplay?.textContent?.trim();
  if (!modelName || modelName === 'Select a model to load...') {
    showToast('Please select a model first.', 'error');
    return;
  }

  state.isModelLoaded = true;
  dom.configModal?.classList.remove('active');

  // 1. Hide all eject buttons while loading
  document.querySelectorAll('.eject-btn').forEach(btn => btn.style.display = 'none');

  if (dom.modelLoading) {
    dom.modelLoading.classList.remove('loading');
    void dom.modelLoading.offsetWidth;
    dom.modelLoading.classList.add('loading');
  }

  setTimeout(() => {
    // 2. Show all eject buttons once the model is successfully loaded into memory
    document.querySelectorAll('.eject-btn').forEach(btn => btn.style.display = 'flex');
    showToast(`${modelName} loaded into memory.`);
  }, TIMING.modelLoad);
}

function ejectModel() {
  state.isModelLoaded = false;
  state.selectedModelName = '';

  if (dom.selectedModelNameDisplay) {
    dom.selectedModelNameDisplay.textContent = 'Select a model to load...';
    dom.selectedModelNameDisplay.classList.add('placeholder');
  }

  // Hide all eject buttons when ejected from memory
  document.querySelectorAll('.eject-btn').forEach(btn => btn.style.display = 'none');

  dom.modelLoading?.classList.remove('loading');
  showToast('Model ejected from memory.', 'error');
}

// Add click handling for all eject buttons (the top nav one and the meta view one)
document.addEventListener('click', function (e) {
  if (e.target.closest('.eject-btn')) {
    ejectModel();
  }
});

function showModeView(mode) {
  dom.modeViews.forEach(view => {
    const isActive = view.id === `mode-${mode}`;
    view.style.display = isActive ? 'flex' : 'none';
  });

  if (dom.rightSplit) {
    dom.rightSplit.style.alignItems = (mode === 'image' || mode === 'video') ? 'center' : 'stretch';
    dom.rightSplit.style.justifyContent = (mode === 'image' || mode === 'video') ? 'center' : 'flex-start';
  }
}

function triggerSplitMode() {
  if (state.isSplitMode) return;
  state.isSplitMode = true;
  dom.body?.classList.add('split-mode');

  if (dom.leftSplit) dom.leftSplit.style.width = '50%';
  if (dom.rightSplit) {
    dom.rightSplit.style.display = 'flex';
    dom.rightSplit.style.width = '50%';
  }
  if (dom.resizer) dom.resizer.style.display = 'block';

  setTimeout(() => {
    if (dom.leftSplit) dom.leftSplit.style.transition = 'none';
    if (dom.rightSplit) dom.rightSplit.style.transition = 'none';
  }, TIMING.splitTransition);
}

function closeSplitMode() {
  if (!state.isSplitMode) return;
  state.isSplitMode = false;
  dom.body?.classList.remove('split-mode');

  if (dom.leftSplit) {
    dom.leftSplit.style.transition = 'width var(--transition-speed) var(--ease-fluid)';
    dom.leftSplit.style.width = '100%';
  }
  if (dom.rightSplit) {
    dom.rightSplit.style.transition = 'width var(--transition-speed) var(--ease-fluid)';
    dom.rightSplit.style.width = '0%';
  }
  if (dom.resizer) dom.resizer.style.display = 'none';

  setTimeout(() => {
    if (!state.isSplitMode && dom.rightSplit) {
      dom.rightSplit.style.display = 'none';
    }
  }, TIMING.splitTransition);
}

function createMessage(role, content, metricsHtml = '') {
  const isUser = role === 'User';
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ? 'msg-user' : 'msg-ai'}`;
  const safeContent = escapeHtml(content).replace(/\n/g, '<br>');
  const jsSafe = JSON.stringify(content);

  msgDiv.innerHTML = `
    <div class="msg-avatar">${isUser ? userAvatarSvg() : aiAvatarSvg()}</div>
    <div class="msg-content">
      <div class="msg-header">${escapeHtml(role)}</div>
      <div class="msg-text">${safeContent}</div>
      ${metricsHtml}
    </div>
    <button class="copy-btn" type="button" title="Copy text" onclick='copyText(${jsSafe}, this)'>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>`;

  return msgDiv;
}

function buildMetricsHtml() {
  const timeSecs = (Math.random() * 3 + 1).toFixed(2);
  const tps = Math.floor(Math.random() * 40 + 20);
  const ttft = (Math.random() * 0.3 + 0.1).toFixed(2);

  return `
    <div class="metrics">
      <div class="metric metric-time"><span>${timeSecs}s</span></div>
      <div class="metric metric-speed"><span>${tps} t/s</span></div>
      <div class="metric metric-ttft"><span>${ttft}s TTFT</span></div>
    </div>`;
}

function completeAIResponse() {
  const modelName = (dom.selectedModelNameDisplay?.textContent || 'Assistant').split(' Config')[0].trim() || 'Assistant';
  let aiText = 'I have processed your request in the workspace on the right.';

  if (state.currentMode === 'text') {
    aiText = 'Here is the response to your prompt. This is placeholder text generation running in full-screen chat mode.';
  } else if (state.currentMode === 'flux44') {
    aiText = 'The page has been rendered in the sandbox on the right based on your specifications. You can interact with it or switch routes using the dropdown in the sandbox header.';
  } else if (state.currentMode === 'image') {
    aiText = 'Your image generation is complete and the result is now visible in the workspace.';
  } else if (state.currentMode === 'video') {
    aiText = 'Your video generation is complete and the preview is now ready to play.';
  } else if (state.currentMode === '3d') {
    aiText = 'Your 3D workspace is ready. You can inspect the model, rotate it, and switch camera angles.';
  }

  dom.outputArea?.appendChild(createMessage(modelName, aiText, buildMetricsHtml()));
  if (dom.outputArea) dom.outputArea.scrollTop = dom.outputArea.scrollHeight;
}

function simulateVideoGeneration() {
  const root = qs('#mode-video');
  if (!root) return;
  const loadingOverlay = qs('#loadingOverlay', root);
  const videoContainer = qs('#videoContainer', root);
  const actionsBar = qs('.actions-bar', root);
  const metadataPanel = qs('.metadata-panel', root);
  const generatedVideo = qs('#generatedVideo', root);
  const playOverlay = qs('#playOverlay', root);

  if (videoContainer) videoContainer.style.display = 'none';
  actionsBar?.classList.remove('visible');
  metadataPanel?.classList.remove('visible');
  loadingOverlay?.classList.remove('hidden');

  if (playOverlay) playOverlay.classList.add('visible');
  if (generatedVideo) {
    generatedVideo.pause();
    generatedVideo.currentTime = 0;
  }

  setTimeout(() => {
    loadingOverlay?.classList.add('hidden');
    if (videoContainer) {
      videoContainer.style.display = 'flex';
      videoContainer.style.opacity = '1';
    }
    actionsBar?.classList.add('visible');
    metadataPanel?.classList.add('visible');
  }, TIMING.videoGeneration);
}

function simulateImageGeneration() {
  const root = qs('#mode-image');
  if (!root) return;
  const loadingOverlay = qs('#loadingOverlay', root);
  const imageContainer = qs('#imageContainer', root);
  const actionsBar = qs('.actions-bar', root);
  const metadataPanel = qs('.metadata-panel', root);

  if (imageContainer) imageContainer.style.display = 'none';
  actionsBar?.classList.remove('visible');
  metadataPanel?.classList.remove('visible');
  loadingOverlay?.classList.remove('hidden');

  setTimeout(() => {
    loadingOverlay?.classList.add('hidden');
    if (imageContainer) {
      imageContainer.style.display = 'flex';
      imageContainer.style.opacity = '1';
    }
    actionsBar?.classList.add('visible');
    metadataPanel?.classList.add('visible');
  }, TIMING.imageGeneration);
}

function updateImageMetadata(root, version) {
  const data = imageVersionData[version];
  if (!data) return;

  const dimensions = qs('#dimensions', root);
  const fileSize = qs('#fileSize', root);
  const seed = qs('#seed', root);
  if (dimensions) dimensions.textContent = data.dimensions;
  if (fileSize) fileSize.textContent = data.size;
  if (seed) seed.textContent = data.seed;
}

function initCustomApiModal() {
  const customApiTrigger = document.querySelector('#custom-api-trigger');
  const apiModal = document.querySelector('#api-modal');
  const closeApiModal = document.querySelector('#close-api-modal');
  const connectApiBtn = document.querySelector('#connect-api-btn');

  if (!customApiTrigger || !apiModal) return;

  customApiTrigger.addEventListener('click', () => {
    closeModelDropdown(); // Hide the big model list
    apiModal.classList.add('active'); // Show the API modal
  });

  closeApiModal?.addEventListener('click', () => {
    apiModal.classList.remove('active');
  });

  // Close on outside click
  apiModal.addEventListener('click', (e) => {
    if (e.target === apiModal) apiModal.classList.remove('active');
  });

  connectApiBtn?.addEventListener('click', () => {
    const modelInput = document.querySelector('#api-model-input');
    const modelName = modelInput?.value.trim() || 'Custom API Model';

    apiModal.classList.remove('active');
    openModelConfig(modelName); // Boot up the loading sequence
  });
}

function updateVideoMetadata(root, version) {
  const data = videoVersionData[version];
  if (!data) return;

  const resolution = qs('#resolution', root);
  const duration = qs('#duration', root);
  const frameRate = qs('#frameRate', root);
  const fileSize = qs('#fileSize', root);
  const seed = qs('#seed', root);

  if (resolution) resolution.textContent = data.resolution;
  if (duration) duration.textContent = data.duration;
  if (frameRate) frameRate.textContent = data.fps;
  if (fileSize) fileSize.textContent = data.size;
  if (seed) seed.textContent = data.seed;
}

function initImageMode() {
  const root = qs('#mode-image');
  if (!root) return;

  const versionBadge = qs('#versionBadge', root);
  const versionTrigger = qs('#versionTrigger', root);
  const versionDropdown = qs('#versionDropdown', root);
  const selectedVersion = qs('#selectedVersion', root);
  const versionItems = qsa('.version-item', root);
  const generatedImage = qs('#generatedImage', root);
  const downloadBtn = qs('#downloadBtn', root);

  updateImageMetadata(root, selectedVersion?.textContent?.trim() || 'v1.0');

  versionTrigger?.addEventListener('click', e => {
    e.stopPropagation();
    versionTrigger.classList.toggle('active');
    versionDropdown?.classList.toggle('open');
  });

  versionDropdown?.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('click', () => {
    versionTrigger?.classList.remove('active');
    versionDropdown?.classList.remove('open');
  });

  versionItems.forEach(item => {
    item.addEventListener('click', () => {
      const version = item.dataset.version;
      const imageUrl = item.dataset.image;
      versionItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (versionBadge) versionBadge.textContent = version;
      if (selectedVersion) selectedVersion.textContent = version;
      updateImageMetadata(root, version);

      if (generatedImage && imageUrl) {
        generatedImage.style.opacity = '0';
        setTimeout(() => {
          generatedImage.src = imageUrl;
          generatedImage.onload = () => {
            generatedImage.style.opacity = '1';
          };
        }, TIMING.mediaSwapFade);
      }

      versionDropdown?.classList.remove('open');
      versionTrigger?.classList.remove('active');
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = generatedImage?.src || '';
    link.download = `ai-generated-${selectedVersion?.textContent || 'image'}.png`;
    link.click();
  });
}

function initVideoMode() {
  const root = qs('#mode-video');
  if (!root) return;

  const versionBadge = qs('#versionBadge', root);
  const versionTrigger = qs('#versionTrigger', root);
  const versionDropdown = qs('#versionDropdown', root);
  const selectedVersion = qs('#selectedVersion', root);
  const versionItems = qsa('.version-item', root);
  const generatedVideo = qs('#generatedVideo', root);
  const videoWrapper = qs('#videoWrapper', root);
  const playOverlay = qs('#playOverlay', root);
  const downloadBtn = qs('#downloadBtn', root);

  updateVideoMetadata(root, selectedVersion?.textContent?.trim() || 'v1.0');

  versionTrigger?.addEventListener('click', e => {
    e.stopPropagation();
    versionTrigger.classList.toggle('active');
    versionDropdown?.classList.toggle('open');
  });

  versionDropdown?.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('click', () => {
    versionTrigger?.classList.remove('active');
    versionDropdown?.classList.remove('open');
  });

  playOverlay?.addEventListener('click', () => {
    if (!generatedVideo) return;
    if (generatedVideo.paused) {
      generatedVideo.play();
      playOverlay.classList.remove('visible');
    }
  });

  generatedVideo?.addEventListener('ended', () => playOverlay?.classList.add('visible'));
  generatedVideo?.addEventListener('pause', () => {
    if (!generatedVideo.ended) playOverlay?.classList.add('visible');
  });
  generatedVideo?.addEventListener('play', () => playOverlay?.classList.remove('visible'));

  versionItems.forEach(item => {
    item.addEventListener('click', () => {
      const version = item.dataset.version;
      const videoUrl = item.dataset.video;
      versionItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (versionBadge) versionBadge.textContent = version;
      if (selectedVersion) selectedVersion.textContent = version;
      updateVideoMetadata(root, version);

      if (generatedVideo && videoWrapper && videoUrl) {
        videoWrapper.style.opacity = '0';
        setTimeout(() => {
          generatedVideo.src = videoUrl;
          generatedVideo.load();
          videoWrapper.style.opacity = '1';
          playOverlay?.classList.add('visible');
        }, TIMING.mediaSwapFade);
      }

      versionDropdown?.classList.remove('open');
      versionTrigger?.classList.remove('active');
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = generatedVideo?.currentSrc || generatedVideo?.src || '';
    link.download = `ai-generated-${selectedVersion?.textContent || 'video'}.mp4`;
    link.click();
  });
}

function setMode(mode) {
  state.currentMode = mode;
  dom.modeCards.forEach(card => {
    card.classList.toggle('selected', card.dataset.mode === mode);
  });
}

function processGenerationFlow() {
  showModeView(state.currentMode);

  if (state.currentMode === 'flux44') {
    dom.previewIframe?.classList.remove('active');
    if (dom.previewIframe) dom.previewIframe.src = '';
    dom.buildingAnim?.classList.add('active');

    setTimeout(() => {
      dom.buildingAnim?.classList.remove('active');
      if (dom.previewIframe) {
        dom.previewIframe.src = SAMPLE_SANDBOX_URL;
        dom.previewIframe.classList.add('active');
      }
      completeAIResponse();
      state.isProcessing = false;
    }, TIMING.appBuilderResponse);
    return;
  }

  if (state.currentMode === 'image') {
    simulateImageGeneration();
    setTimeout(() => {
      completeAIResponse();
      state.isProcessing = false;
    }, TIMING.imageGeneration);
    return;
  }

  if (state.currentMode === 'video') {
    simulateVideoGeneration();
    setTimeout(() => {
      completeAIResponse();
      state.isProcessing = false;
    }, TIMING.videoGeneration);
    return;
  }

  if (state.currentMode === '3d') {
    setTimeout(() => {
      completeAIResponse();
      state.isProcessing = false;
    }, TIMING.textResponse);
    return;
  }

  setTimeout(() => {
    completeAIResponse();
    state.isProcessing = false;
  }, TIMING.textResponse);
}

// --- 1. Globalizing file arrays for chat retention ---
window.activeUploads = [];
window.chatFilesStore = {};

// --- 3. Update the submitPrompt function to clear files and pass them to the chat ---
function submitPrompt() {
  if (state.isProcessing) return;

  const text = dom.mainInput?.value.trim();
  const hasFiles = window.activeUploads && window.activeUploads.length > 0;

  if (!text && !hasFiles) return; // Allows sending if there's only an attachment

  if (!state.isModelLoaded) {
    showToast('System error: No model loaded.', 'error');
    return;
  }

  state.isProcessing = true;
  dom.body?.classList.add('chat-active');

  if (state.currentMode === 'text') closeSplitMode();
  else triggerSplitMode();

  // Copy current active uploads for the message
  const currentFiles = hasFiles ? [...window.activeUploads] : [];

  // Pass files into createMessage
  dom.outputArea?.appendChild(createMessage('User', text, '', currentFiles));

  // Reset Input Field
  if (dom.mainInput) {
    dom.mainInput.value = '';
    resizeTextarea();
  }

  // Clear Active Uploads
  if (window.activeUploads) window.activeUploads.length = 0;
  const attachmentsContainer = qs('#attachments-container');
  if (attachmentsContainer) attachmentsContainer.innerHTML = '';

  if (dom.outputArea) dom.outputArea.scrollTop = dom.outputArea.scrollHeight;

  setTimeout(() => {
    processGenerationFlow();
  }, TIMING.splitTransition);
}

// --- 4. Update createMessage to render attachments underneath text ---
function createMessage(role, content, metricsHtml = '', files = []) {
  const isUser = role === 'User';
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ? 'msg-user' : 'msg-ai'}`;
  const safeContent = content ? escapeHtml(content).replace(/\n/g, '<br>') : '';
  const jsSafe = JSON.stringify(content);

  let filesHtml = '';
  if (files && files.length > 0) {
    filesHtml = `<div class="msg-attachments-grid" style="display:flex; gap:12px; margin-top:12px; flex-wrap:wrap;">` +
      files.map(f => {
        const cat = getFileCategory(f.file.name);
        const svg = fileSVGs[cat] || fileSVGs.fallback;
        // ... inside createMessage function, inside the .map() loop:
        return `
  <div class="attachment-item chat-attachment" data-id="${f.id}" title="${escapeHtml(f.file.name)}" style="position:relative; display:flex; flex-direction:column; align-items:center; width:70px; background:#1f2937; border-radius:12px; padding:8px; cursor:pointer; border:1px solid var(--border-color); transition: border-color 0.2s, transform 0.2s;">
    <div style="width:40px; height:40px; margin-bottom:6px; pointer-events:none; display:flex; justify-content:center; align-items:center;">
        ${svg}
    </div>
    <div class="file-name" style="font-size:10px; color:var(--text-secondary); text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(f.file.name)}</div>
  </div>`;
      }).join('') +
      `</div>`;
  }

  msgDiv.innerHTML = `
    <div class="msg-avatar">${isUser ? userAvatarSvg() : aiAvatarSvg()}</div>
    <div class="msg-content">
      <div class="msg-header">${escapeHtml(role)}</div>
      ${safeContent ? `<div class="msg-text">${safeContent}</div>` : ''}
      ${filesHtml}
      ${metricsHtml}
    </div>
    <button class="copy-btn" type="button" title="Copy text" onclick='copyText(${jsSafe}, this)'>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>`;

  // Make attachments clickable to open preview modal
  if (files && files.length > 0) {
    setTimeout(() => {
      msgDiv.querySelectorAll('.chat-attachment').forEach(el => {
        el.addEventListener('click', () => {
          if (window.openPreview) window.openPreview(el.dataset.id);
        });
      });
    }, 0);
  }

  return msgDiv;
}

// --- 5. Update initFileAttachments & openPreview logic ---
function initFileAttachments() {
  const attachBtn = qs('#attach-btn');
  const attachDropdown = qs('#attach-dropdown');
  const uploadOption = qs('#upload-file-option');
  const hiddenFileInput = qs('#hidden-file-input');
  const attachmentsContainer = qs('#attachments-container');
  const previewModal = qs('#file-preview-modal');
  const closePreviewBtn = qs('#close-preview-btn');
  const previewContentArea = qs('#preview-content-area');
  const previewTitle = qs('#preview-title');

  attachBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    attachDropdown?.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.attach-wrapper')) attachDropdown?.classList.remove('open');
  });

  uploadOption?.addEventListener('click', () => {
    hiddenFileInput?.click();
    attachDropdown?.classList.remove('open');
  });

  hiddenFileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const id = Math.random().toString(36).substring(7);
      const fileObj = { id, file, url: URL.createObjectURL(file) };
      window.activeUploads.push(fileObj);
      window.chatFilesStore[id] = fileObj;
      renderAttachmentItem(file, id);
    });
    hiddenFileInput.value = '';
  });

  function renderAttachmentItem(file, id) {
    const category = getFileCategory(file.name);
    const svgContent = fileSVGs[category] || fileSVGs.fallback;

    const item = document.createElement('div');
    item.className = 'attachment-item';
    item.dataset.id = id;
    item.innerHTML = `
        ${svgContent}
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="attachment-remove" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
    `;

    // Only allow removing from the active input area
    qs('.attachment-remove', item).addEventListener('click', (e) => {
      e.stopPropagation();
      const index = window.activeUploads.findIndex(f => f.id === id);
      if (index > -1) {
        window.activeUploads.splice(index, 1);
        URL.revokeObjectURL(window.chatFilesStore[id].url);
        delete window.chatFilesStore[id];
      }
      item.remove();
    });

    item.addEventListener('click', () => window.openPreview(id));
    attachmentsContainer?.appendChild(item);
  }

  // Bind to window so chat messages can trigger it too
  window.openPreview = function (id) {
    const fileObj = window.chatFilesStore[id];
    if (!fileObj) return;

    const category = getFileCategory(fileObj.file.name);
    previewTitle.textContent = fileObj.file.name;
    previewContentArea.innerHTML = '';

    if (category === 'image') {
      previewContentArea.innerHTML = `<img src="${fileObj.url}" class="media-preview" alt="Preview">`;
    } else if (category === 'video') {
      previewContentArea.innerHTML = `<video src="${fileObj.url}" class="media-preview" controls autoplay></video>`;
    } else if (category === 'model3d') {

      // Injecting 3D Model Viewer with integrated controls
      previewContentArea.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; position:relative;">
            <model-viewer id="modal-mv" src="${fileObj.url}" camera-controls auto-rotate auto-rotate-delay="0" shadow-intensity="1.2" environment-image="neutral" interaction-prompt="none" style="flex:1; width:100%; background: radial-gradient(circle at center, #2a2a2a 0%, #111 100%);"></model-viewer>
            <div style="height:55px; background:#1a1a1a; border-top:1px solid #3f3f46; display:flex; align-items:center; justify-content:center; gap:12px; flex-shrink:0; box-shadow: 0 -4px 10px rgba(0,0,0,0.4);">
                <button class="tool-btn" id="modal-reset" title="Reset Camera" style="background:none; border:none; color:#999; cursor:pointer; padding:8px 12px; border-radius:6px; transition:0.2s;">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                </button>
                <button class="tool-btn active" id="modal-rotate" title="Auto Rotate" style="background:rgba(242, 139, 37, 0.1); border:none; color:#f28b25; cursor:pointer; padding:8px 12px; border-radius:6px; transition:0.2s;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button class="tool-btn active" id="modal-env" title="Environment Lighting" style="background:rgba(242, 139, 37, 0.1); border:none; color:#f28b25; cursor:pointer; padding:8px 12px; border-radius:6px; transition:0.2s;">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM12 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/></svg>
                </button>
            </div>
        </div>`;

      const mv = qs('#modal-mv', previewContentArea);
      const btnReset = qs('#modal-reset', previewContentArea);
      const btnRotate = qs('#modal-rotate', previewContentArea);
      const btnEnv = qs('#modal-env', previewContentArea);

      btnReset.addEventListener('click', () => {
        if (mv.autoRotate) { mv.autoRotate = false; btnRotate.style.color = '#999'; btnRotate.style.background = 'none'; }
        mv.cameraTarget = 'auto auto auto'; mv.cameraOrbit = 'auto auto auto';
      });
      btnRotate.addEventListener('click', () => {
        mv.autoRotate = !mv.autoRotate;
        if (mv.autoRotate) {
          btnRotate.style.color = '#f28b25'; btnRotate.style.background = 'rgba(242, 139, 37, 0.1)';
        } else {
          btnRotate.style.color = '#999'; btnRotate.style.background = 'none';
        }
      });
      btnEnv.addEventListener('click', () => {
        const isNeutral = mv.environmentImage === 'neutral';
        mv.environmentImage = isNeutral ? 'legacy' : 'neutral';
        if (!isNeutral) {
          btnEnv.style.color = '#f28b25'; btnEnv.style.background = 'rgba(242, 139, 37, 0.1)';
        } else {
          btnEnv.style.color = '#999'; btnEnv.style.background = 'none';
        }
      });

    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const numbersHtml = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
        previewContentArea.innerHTML = `
            <div class="code-preview">
                <div class="code-lines">${numbersHtml}</div>
                <div class="code-content">${escapeHtml(text)}</div>
            </div>`;
      };
      reader.readAsText(fileObj.file);
    }
    previewModal?.classList.add('active');
  }

  closePreviewBtn?.addEventListener('click', () => {
    previewModal?.classList.remove('active');
    previewContentArea.innerHTML = '';
  });

  previewModal?.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.classList.remove('active');
      previewContentArea.innerHTML = '';
    }
  });
}

function initResizer() {
  if (!dom.resizer || !dom.leftSplit || !dom.rightSplit) return;

  let isResizing = false;

  dom.resizer.addEventListener('mousedown', () => {
    if (!state.isSplitMode) return;
    isResizing = true;
    dom.resizer.classList.add('active');
    dom.body?.classList.add('dragging');
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const workspace = qs('#workspace');
    if (!workspace) return;
    const workspaceRect = workspace.getBoundingClientRect();
    let newLeftWidth = e.clientX - workspaceRect.left;
    const minWidth = workspaceRect.width * 0.25;
    const maxWidth = workspaceRect.width * 0.75;

    newLeftWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));

    const leftPercentage = (newLeftWidth / workspaceRect.width) * 100;
    const rightPercentage = 100 - leftPercentage;
    dom.leftSplit.style.width = `${leftPercentage}%`;
    dom.rightSplit.style.width = `${rightPercentage}%`;
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    dom.resizer.classList.remove('active');
    dom.body?.classList.remove('dragging');
  });
}

window.selectSegment = function selectSegment(el, type) {
  const parent = el.parentElement;
  if (!parent) return;
  parent.querySelectorAll('.segment-option').forEach(opt => opt.classList.remove('active-yes', 'active-no'));
  if (type === 'yes') el.classList.add('active-yes');
  else el.classList.add('active-no');
};

window.togglePanel = function togglePanel(id, btnRef = null) {
  const el = qs(`#${id}`);
  if (!el) return;

  const openDisplay = id === 'viewGrid' ? 'grid' : 'block';
  const isOpen = el.style.display === 'block' || el.style.display === 'grid';
  el.style.display = isOpen ? 'none' : openDisplay;
  if (btnRef) btnRef.classList.toggle('active', !isOpen);
};

function initCustomSelects() {
  qsa('[data-select]').forEach(wrapper => {
    const trigger = qs('.custom-select-trigger', wrapper);
    const dropdown = qs('.custom-select-dropdown', wrapper);
    const options = qsa('.custom-select-option', wrapper);
    const label = qs('span:first-child', trigger);

    trigger?.addEventListener('click', e => {
      e.stopPropagation();
      qsa('.custom-select-dropdown.open').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
          d.previousElementSibling?.classList.remove('open');
        }
      });
      trigger.classList.toggle('open');
      dropdown?.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        options.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        if (label) label.textContent = option.dataset.value || option.textContent.trim();
        trigger?.classList.remove('open');
        dropdown?.classList.remove('open');
      });
    });

    dropdown?.addEventListener('click', e => e.stopPropagation());
  });

  document.addEventListener('click', () => {
    qsa('.custom-select-trigger.open').forEach(t => t.classList.remove('open'));
    qsa('.custom-select-dropdown.open').forEach(d => d.classList.remove('open'));
  });
}

function initModes() {
  dom.modeCards.forEach(card => {
    card.addEventListener('click', () => {
      setMode(card.dataset.mode || 'flux44');
      dom.modesPanel?.setAttribute('aria-hidden', 'true');
    });
  });
}

function initSidebarViews() {
  dom.sidebarIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const targetViewId = icon.getAttribute('data-view');
      if (!targetViewId) return;

      // Intercept Tab 4 and open the modal instead of switching pages
      if (targetViewId === 'tab-four') {
        openDownloadsModal();
        return;
      }

      setMainView(targetViewId);
    });
  });
}

function initTabs() {
  dom.tabNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      if (!tabId) return;
      setActiveTab(tabId);
    });
  });
}


// Locate your widget toggle logic in app.js
const perfWidgetBtn = document.getElementById('perf-widget-btn');
const perfWidgetDropdown = document.getElementById('perf-widget-dropdown');

if (perfWidgetBtn && perfWidgetDropdown) {
  perfWidgetBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Toggle the visible class
    const isOpen = perfWidgetDropdown.classList.toggle('active'); // or 'show' depending on your code

    // FIX: If the dropdown just opened, force Chart.js to recalculate its visible size
    if (isOpen || perfWidgetDropdown.classList.contains('active') || perfWidgetDropdown.classList.contains('show')) {
      // Small timeout ensures the browser has rendered the display block change before resizing
      setTimeout(() => {
        if (typeof wCpuChart !== 'undefined') { wCpuChart.resize(); wCpuChart.update('none'); }
        if (typeof wRamChart !== 'undefined') { wRamChart.resize(); wRamChart.update('none'); }
        if (typeof wGpuChart !== 'undefined') { wGpuChart.resize(); wGpuChart.update('none'); }
        if (typeof wNetChart !== 'undefined') { wNetChart.resize(); wNetChart.update('none'); }
      }, 50);
    }
  });
}


function refreshWidgetCharts() {
  if (window.wCpuChart) {
    window.wCpuChart.resize();
    window.wCpuChart.update('none');
  }
  if (window.wRamChart) {
    window.wRamChart.resize();
    window.wRamChart.update('none');
  }
  if (window.wGpuChart) {
    window.wGpuChart.resize();
    window.wGpuChart.update('none');
  }
  if (window.wNetChart) {
    window.wNetChart.resize();
    window.wNetChart.update('none');
  }
}


function initModelViewer() {
  const viewer = qs('#mv');
  if (!viewer) return;

  const progressBar = qs('.progress-bar');
  const updateBar = qs('.update-bar');
  const statusOverlay = qs('#statusOverlay');
  const viewGrid = qs('#viewGrid');
  const meshDetailsPanel = qs('#meshDetailsPanel');
  const btnViews = qs('#btnViews');
  const btnMeshStats = qs('#btnMeshStats');
  const btnRotate = qs('#btnRotate');
  const btnReset = qs('#btnReset');
  const btnEnv = qs('#btnEnv');
  const btnFullscreen = qs('#btnFullscreen');

  viewer.addEventListener('pointerdown', () => {
    if (viewGrid?.style.display === 'grid') {
      viewGrid.style.display = 'none';
      btnViews?.classList.remove('active');
    }
    if (meshDetailsPanel?.style.display === 'block') {
      meshDetailsPanel.style.display = 'none';
      btnMeshStats?.classList.remove('active');
    }
  });

  viewer.addEventListener('progress', event => {
    const progress = event.detail.totalProgress;
    if (progress === 1) {
      progressBar?.classList.add('hide');
      if (statusOverlay) statusOverlay.style.display = 'none';
    } else {
      progressBar?.classList.remove('hide');
      if (updateBar) updateBar.style.width = `${progress * 100}%`;
    }
  });

  viewer.addEventListener('load', updateMeshDetails);

  function updateMeshDetails() {
    if (!viewer.model) return;
    try {
      const size = viewer.getDimensions();
      const sx = size.x.toFixed(2);
      const sy = size.y.toFixed(2);
      const sz = size.z.toFixed(2);
      const statDimensions = qs('#statDimensions');
      const statMaterials = qs('#statMaterials');
      const statTriangles = qs('#statTriangles');
      const statVertices = qs('#statVertices');

      if (statDimensions) statDimensions.innerText = `${sx} × ${sy} × ${sz} m`;
      const matCount = viewer.model.materials ? viewer.model.materials.length : 0;
      if (statMaterials) statMaterials.innerText = matCount;

      let triangles = 0;
      let vertices = 0;
      const sceneSymbol = Object.getOwnPropertySymbols(viewer).find(s => s.description === 'scene' || s.description === 'scene-graph');
      const internalScene = sceneSymbol ? viewer[sceneSymbol] : null;

      if (internalScene) {
        internalScene.traverse(child => {
          if (!child.isMesh || !child.geometry) return;
          const geo = child.geometry;
          if (geo.attributes?.position) vertices += geo.attributes.position.count;
          if (geo.index) triangles += geo.index.count / 3;
          else if (geo.attributes?.position) triangles += geo.attributes.position.count / 3;
        });
      }

      if (statTriangles) statTriangles.innerText = Number.isFinite(triangles) ? triangles.toLocaleString() : 'N/A';
      if (statVertices) statVertices.innerText = Number.isFinite(vertices) ? vertices.toLocaleString() : 'N/A';
    } catch (err) {
      console.error('Could not calculate mesh details:', err);
    }
  }

  btnMeshStats?.addEventListener('click', e => togglePanel('meshDetailsPanel', e.currentTarget));

  btnRotate?.addEventListener('click', e => {
    viewer.autoRotate = !viewer.autoRotate;
    e.currentTarget.classList.toggle('active', viewer.autoRotate);
  });

  btnReset?.addEventListener('click', () => {
    if (viewer.autoRotate) {
      viewer.autoRotate = false;
      btnRotate?.classList.remove('active');
    }
    viewer.cameraTarget = 'auto auto auto';
    viewer.cameraOrbit = 'auto auto auto';
  });

  btnViews?.addEventListener('click', e => togglePanel('viewGrid', e.currentTarget));

  viewGrid?.addEventListener('click', e => {
    const btn = e.target.closest('.grid-btn');
    if (!btn) return;

    const view = btn.dataset.view;
    let orbit = null;
    switch (view) {
      case 'top': orbit = '0deg 0deg 105%'; break;
      case 'bottom': orbit = '0deg 180deg 105%'; break;
      case 'front': orbit = '0deg 90deg 105%'; break;
      case 'back': orbit = '180deg 90deg 105%'; break;
      case 'left': orbit = '90deg 90deg 105%'; break;
      case 'right': orbit = '-90deg 90deg 105%'; break;
      case 'isometric': orbit = '45deg 54.7deg 105%'; break;
      case 'dimetric': orbit = '20.7deg 62.1deg 105%'; break;
      case 'trimetric': orbit = '18deg 74.4deg 105%'; break;
      default: break;
    }

    if (orbit) viewer.cameraOrbit = orbit;
    viewGrid.style.display = 'none';
    btnViews?.classList.remove('active');
    if (viewer.autoRotate) {
      viewer.autoRotate = false;
      btnRotate?.classList.remove('active');
    }
  });

  btnEnv?.addEventListener('click', e => {
    if (viewer.environmentImage === 'neutral') {
      viewer.environmentImage = 'legacy';
      e.currentTarget.classList.remove('active');
    } else {
      viewer.environmentImage = 'neutral';
      e.currentTarget.classList.add('active');
    }
  });

  btnFullscreen?.addEventListener('click', () => {
    const viewport = qs('#viewport');
    if (!viewport) return;
    if (!document.fullscreenElement) {
      viewport.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen();
    }
  });

  window.addEventListener('dragover', e => {
    e.preventDefault();
    document.body.classList.add('dragover');
  });

  window.addEventListener('dragleave', e => {
    e.preventDefault();
    if (e.clientX === 0 || e.clientY === 0) {
      document.body.classList.remove('dragover');
    }
  });

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key.toLowerCase()) {
      case 'r': btnReset?.click(); break;
      case 'f': btnFullscreen?.click(); break;
      case 'm':
      case 'i': btnMeshStats?.click(); break;
      case 'v': btnViews?.click(); break;
      case ' ':
        e.preventDefault();
        btnRotate?.click();
        break;
      default:
        break;
    }
  });
}

function initSandboxControls() {
  dom.sandboxReloadBtn?.addEventListener('click', () => {
    if (!dom.previewIframe?.src) return;
    const svg = dom.sandboxReloadBtn.querySelector('svg');
    if (svg) {
      svg.style.transition = 'transform 0.4s';
      svg.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        svg.style.transition = 'none';
        svg.style.transform = 'rotate(0deg)';
      }, TIMING.sandboxSpin);
    }
    dom.previewIframe.src = dom.previewIframe.src;
  });

  dom.sandboxSelect?.addEventListener('change', () => {
    if (dom.previewIframe?.classList.contains('active')) {
      dom.previewIframe.src = SAMPLE_SANDBOX_URL;
    }
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (dom.configModal?.classList.contains('active') && e.ctrlKey && e.key === 'Enter') {
      loadModel();
    }
    if (dom.configModal?.classList.contains('active') && e.key === 'Escape') {
      closeModelConfig();
    }
  });
}

function initModelPicker() {
  dom.modelDropdownTrigger?.addEventListener('click', e => {
    e.stopPropagation();
    dom.customModelDropdown?.classList.toggle('active');
    if (dom.customModelDropdown?.classList.contains('active')) {
      dom.modelSearchInput?.focus();
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#model-center-nav')) closeModelDropdown();
  });

  dom.modelSearchInput?.addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    dom.modelItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });

  dom.modelItems.forEach(item => {
    item.addEventListener('click', () => {
      const modelName = item.getAttribute('data-value');
      if (!modelName) return;
      closeModelDropdown();
      openModelConfig(modelName);
    });
  });

  dom.manualParamsToggle?.addEventListener('click', () => {
    dom.manualParamsToggle.classList.toggle('active');
  });
}

function initModalActions() {
  dom.closeModalBtn?.addEventListener('click', closeModelConfig);
  dom.configModal?.addEventListener('click', e => {
    if (e.target === dom.configModal) closeModelConfig();
  });
  dom.confirmLoadBtn?.addEventListener('click', loadModel);
  dom.ejectBtn?.addEventListener('click', e => {
    e.stopPropagation();
    ejectModel();
  });

  // --- ADD THESE NEW LINES FOR TAB 4 MODAL ---
  dom.closeDownloadsBtn?.addEventListener('click', closeDownloadsModal);
  dom.downloadsModal?.addEventListener('click', e => {
    // Closes when clicking the dark overlay outside the window
    if (e.target === dom.downloadsModal) closeDownloadsModal();
  });
}

window.resizeTextarea = function resizeTextarea() {
  if (!dom.mainInput) return;

  // 1. Briefly reset height to 'auto' to calculate the true height
  dom.mainInput.style.height = 'auto';

  // 2. Simply set it to its natural scroll height (this eliminates the jump!)
  dom.mainInput.style.height = `${dom.mainInput.scrollHeight}px`;
};

function initChatInput() {
  dom.mainInput?.addEventListener('input', resizeTextarea);
  dom.submitBtn?.addEventListener('click', submitPrompt);
  dom.mainInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  });
}

function initSettingsModal() {
  dom.openSettingsBtn?.addEventListener('click', openSettings);
  dom.closeSettingsBtn?.addEventListener('click', closeSettings);
  dom.modalOverlay?.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeSettings();
  });
}

const Loader = {
  loader: dom.loader,
  panel: dom.loaderPanel,
  app: dom.mainApp,
  dotsEl: dom.dotsEl,
  isHiding: false,
  rafId: null,
  targetRotX: 0,
  targetRotY: 0,
  currentRotX: 2,
  currentRotY: -1,

  init() {
    if (!this.loader || !this.panel) return;

    const updateDots = () => {
      if (!this.dotsEl) return;
      const count = Math.max(0, Math.floor(Date.now() / 450) % 4);
      this.dotsEl.textContent = '.'.repeat(count);
    };

    const onMove = event => {
      const rect = this.panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      this.targetRotY = x * 8;
      this.targetRotX = -y * 8;
    };

    const resetTilt = () => {
      this.targetRotX = 2;
      this.targetRotY = -1;
    };

    const smoothTilt = () => {
      this.currentRotX += (this.targetRotX - this.currentRotX) * 0.08;
      this.currentRotY += (this.targetRotY - this.currentRotY) * 0.08;
      this.panel.style.transform = `perspective(1200px) rotateX(${this.currentRotX}deg) rotateY(${this.currentRotY}deg)`;
      updateDots();
      this.rafId = requestAnimationFrame(smoothTilt);
    };

    this.panel.addEventListener('mousemove', onMove);
    this.panel.addEventListener('mouseleave', resetTilt);
    smoothTilt();
  },

  hide() {
    if (this.isHiding || !this.loader) return;
    this.isHiding = true;
    cancelAnimationFrame(this.rafId);
    this.loader.classList.add('is-hidden');

    const onComplete = () => {
      this.loader?.remove();
      if (this.app) {
        this.app.style.display = 'block';
        requestAnimationFrame(() => {
          this.app.style.opacity = '1';
          this.app.classList.add('is-visible');
        });
      }
      document.body.style.overflow = 'auto';
      this.isHiding = false;
    };

    this.loader.addEventListener('transitionend', onComplete, { once: true });
    setTimeout(onComplete, TIMING.fallbackTransition);
  }
};


const fileExtData = {
  video: ["mp4", "mov", "mkv", "avi", "webm", "mpeg", "mpg", "m4v"],
  image: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico"],
  code: ["html", "css", "js", "jsx", "ts", "tsx", "py", "json", "xml", "cpp"],
  model3d: ["glb", "gltf", "obj", "stl", "fbx"]
};

const fileSVGs = {
  video: `<svg class="file-icon" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="transparent"/><polygon points="52,48 52,72 74,60" fill="#6b7280"/></svg>`,
  image: `<svg class="file-icon" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="transparent"/><polygon points="35,85 60,50 85,85" fill="#4b5563"/><polygon points="45,85 65,62 85,85" fill="#6b7280"/><circle cx="88" cy="42" r="6" fill="#6b7280"/></svg>`,
  code: `<svg class="file-icon" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="transparent"/><path d="M50 42 L38 58 L50 74" stroke="#6b7280" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 42 L82 58 L70 74" stroke="#6b7280" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line x1="64" y1="76" x2="56" y2="40" stroke="#6b7280" stroke-width="3" stroke-linecap="round"/></svg>`,
  model3d: `<svg class="file-icon" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="transparent"/><polygon points="60,35 85,48 60,61 35,48" fill="#4b5563" stroke="#6b7280" stroke-width="1.5"/><polygon points="85,48 85,76 60,89 60,61" fill="#374151" stroke="#6b7280" stroke-width="1.5"/><polygon points="60,61 60,89 35,76 35,48" fill="#1f2937" stroke="#6b7280" stroke-width="1.5"/></svg>`,
  fallback: `<svg class="file-icon" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="transparent"/><path d="M32 25 H66 L88 47 V95 H32 V25 Z" fill="#374151" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/><path d="M66 25 L88 47 H66 V25 Z" fill="#2d3748" stroke="#4b5563" stroke-width="1.5" stroke-linejoin="round"/><line x1="42" y1="50" x2="78" y2="50" stroke="#4b5563" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="60" x2="78" y2="60" stroke="#4b5563" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="70" x2="65" y2="70" stroke="#4b5563" stroke-width="2" stroke-linecap="round"/></svg>`
};

// --- 1. Globalizing file arrays for chat retention ---
window.activeUploads = [];
window.chatFilesStore = {};

function getFileCategory(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  for (const [category, extensions] of Object.entries(fileExtData)) {
    if (extensions.includes(ext)) return category;
  }
  return 'fallback';
}

window.resizeTextarea = function resizeTextarea() {
  if (!dom.mainInput) return;

  dom.mainInput.style.height = 'auto';

  if (dom.mainInput.value === '') {
    dom.mainInput.style.height = '32px'; // Matches the new CSS min-height
    return;
  }

  dom.mainInput.style.height = `${dom.mainInput.scrollHeight}px`;
};

// --- 3. Unified submitPrompt (Sends files to chat message) ---
window.submitPrompt = function submitPrompt() {
  if (state.isProcessing) return;

  const text = dom.mainInput?.value.trim();
  const hasFiles = window.activeUploads && window.activeUploads.length > 0;

  if (!text && !hasFiles) return;

  if (!state.isModelLoaded) {
    showToast('System error: No model loaded.', 'error');
    return;
  }

  state.isProcessing = true;
  dom.body?.classList.add('chat-active');

  if (state.currentMode === 'text') closeSplitMode();
  else triggerSplitMode();

  // Capture current uploads to pass into the message
  const currentFiles = hasFiles ? [...window.activeUploads] : [];

  // Append message WITH files
  dom.outputArea?.appendChild(createMessage('User', text, '', currentFiles));

  // Reset Input
  if (dom.mainInput) {
    dom.mainInput.value = '';
    resizeTextarea();
  }

  // Clear active uploads from the input box
  window.activeUploads.length = 0;
  const attachmentsContainer = qs('#attachments-container');
  if (attachmentsContainer) attachmentsContainer.innerHTML = '';

  if (dom.outputArea) dom.outputArea.scrollTop = dom.outputArea.scrollHeight;

  setTimeout(() => {
    processGenerationFlow();
  }, TIMING.splitTransition);
};

// --- 4. Unified createMessage (Renders previews in the chat) ---
window.createMessage = function createMessage(role, content, metricsHtml = '', files = []) {
  const isUser = role === 'User';
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ? 'msg-user' : 'msg-ai'}`;
  const safeContent = content ? escapeHtml(content).replace(/\n/g, '<br>') : '';
  const jsSafe = JSON.stringify(content || '');

  let filesHtml = '';
  if (files && files.length > 0) {
    filesHtml = `<div class="msg-attachments-grid" style="display:flex; gap:12px; margin-top:12px; flex-wrap:wrap;">` +
      files.map(f => {
        const cat = getFileCategory(f.file.name);
        const svg = fileSVGs[cat] || fileSVGs.fallback;
        // Notice: NO close button here, just the preview!
        // ... inside createMessage function, inside the .map() loop:
        return `
  <div class="attachment-item chat-attachment" data-id="${f.id}" title="${escapeHtml(f.file.name)}" style="position:relative; display:flex; flex-direction:column; align-items:center; width:70px; background:#1f2937; border-radius:12px; padding:8px; cursor:pointer; border:1px solid var(--border-color); transition: border-color 0.2s, transform 0.2s;">
    <div style="width:40px; height:40px; margin-bottom:6px; pointer-events:none; display:flex; justify-content:center; align-items:center;">
        ${svg}
    </div>
    <div class="file-name" style="font-size:10px; color:var(--text-secondary); text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(f.file.name)}</div>
  </div>`;
      }).join('') +
      `</div>`;
  }

  msgDiv.innerHTML = `
    <div class="msg-avatar">${isUser ? userAvatarSvg() : aiAvatarSvg()}</div>
    <div class="msg-content">
      <div class="msg-header">${escapeHtml(role)}</div>
      ${safeContent ? `<div class="msg-text">${safeContent}</div>` : ''}
      ${filesHtml}
      ${metricsHtml}
    </div>
    <button class="copy-btn" type="button" title="Copy text" onclick='copyText(${jsSafe}, this)'>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>`;

  // Make the attachments in the chat message clickable to preview
  if (files && files.length > 0) {
    setTimeout(() => {
      msgDiv.querySelectorAll('.chat-attachment').forEach(el => {
        el.addEventListener('click', () => {
          if (window.openPreview) window.openPreview(el.dataset.id);
        });
      });
    }, 0);
  }

  return msgDiv;
};

// --- 5. Unified File Attachments Init ---
function initFileAttachments() {
  const attachBtn = qs('#attach-btn');
  const attachDropdown = qs('#attach-dropdown');
  const uploadOption = qs('#upload-file-option');
  const hiddenFileInput = qs('#hidden-file-input');
  const attachmentsContainer = qs('#attachments-container');
  const previewModal = qs('#file-preview-modal');
  const closePreviewBtn = qs('#close-preview-btn');
  const previewContentArea = qs('#preview-content-area');
  const previewTitle = qs('#preview-title');

  attachBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    attachDropdown?.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.attach-wrapper')) attachDropdown?.classList.remove('open');
  });

  uploadOption?.addEventListener('click', () => {
    hiddenFileInput?.click();
    attachDropdown?.classList.remove('open');
  });

  hiddenFileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const id = Math.random().toString(36).substring(7);
      const fileObj = { id, file, url: URL.createObjectURL(file) };
      window.activeUploads.push(fileObj);
      window.chatFilesStore[id] = fileObj;
      renderAttachmentItem(file, id);
    });
    hiddenFileInput.value = '';
  });

  function renderAttachmentItem(file, id) {
    const category = getFileCategory(file.name);
    const svgContent = fileSVGs[category] || fileSVGs.fallback;

    const item = document.createElement('div');
    item.className = 'attachment-item';
    item.dataset.id = id;
    item.innerHTML = `
        ${svgContent}
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="attachment-remove" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
    `;

    qs('.attachment-remove', item).addEventListener('click', (e) => {
      e.stopPropagation();
      const index = window.activeUploads.findIndex(f => f.id === id);
      if (index > -1) {
        window.activeUploads.splice(index, 1);
      }
      item.remove();
    });

    item.addEventListener('click', () => window.openPreview(id));
    attachmentsContainer?.appendChild(item);
  }

  window.openPreview = function (id) {
    const fileObj = window.chatFilesStore[id];
    if (!fileObj) return;

    const category = getFileCategory(fileObj.file.name);
    previewTitle.textContent = fileObj.file.name;
    previewContentArea.innerHTML = '';

    if (category === 'image') {
      previewContentArea.innerHTML = `<img src="${fileObj.url}" class="media-preview" alt="Preview">`;
    } else if (category === 'video') {
      previewContentArea.innerHTML = `<video src="${fileObj.url}" class="media-preview" controls autoplay></video>`;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const numbersHtml = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
        previewContentArea.innerHTML = `
            <div class="code-preview">
                <div class="code-lines">${numbersHtml}</div>
                <div class="code-content">${escapeHtml(text)}</div>
            </div>`;
      };
      reader.readAsText(fileObj.file);
    }
    previewModal?.classList.add('active');
  };

  closePreviewBtn?.addEventListener('click', () => {
    previewModal?.classList.remove('active');
    previewContentArea.innerHTML = '';
  });

  previewModal?.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.classList.remove('active');
      previewContentArea.innerHTML = '';
    }
  });
}

// --- 6. Main App Initialization ---
function init() {
  try {
    if (typeof Loader !== 'undefined') Loader.init();
    initSettingsModal();
    initModelPicker();
    initModalActions();
    initKeyboardShortcuts();
    initTerminal(); // <-- Add this line right here!
    initSystemMonitor();
    initChatInput();
    initSandboxControls();
    initSidebarViews();
    initTabs();
    initCustomSelects();
    initCustomApiModal();
    initResizer();
    initModes();
    initModelViewer();
    initImageMode();
    initVideoMode();
    initFileAttachments(); // Buttons work again!
    initModelsExplorer();
    syncSliderInput('ctx-slider', 'ctx-input');
    syncSliderInput('gpu-slider', 'gpu-input');
    syncSliderInput('cpu-slider', 'cpu-input');

    setMainView('chat-view');
    setActiveTab('general');
    setMode('flux44');
    showModeView('flux44');
    resizeTextarea();

    if (typeof Loader !== 'undefined') Loader.hide();
  } catch (err) {
    console.error('Init error:', err);
  }
}

init();


// Sample log entries
const logEntries = [
  { level: 'DEBUG', message: 'common_init_from_params: warming up the model with an empty run - please wait ... (--no-warmup to disable)' },
  { level: 'DEBUG', message: 'srv load_model: initializing slots, n_slots = 4' },
  { level: 'DEBUG', message: 'no implementations specified for speculative decoding' },
  { level: 'DEBUG', message: 'slot load_model: id 0 | task -1 | new slot, n_ctx = 4096' },
  { level: 'DEBUG', message: 'slot load_model: id 1 | task -1 | new slot, n_ctx = 4096' },
  { level: 'DEBUG', message: 'slot load_model: id 2 | task -1 | new slot, n_ctx = 4096' },
  { level: 'DEBUG', message: 'slot load_model: id 3 | task -1 | new slot, n_ctx = 4096' },
  { level: 'DEBUG', message: 'srv load_model: prompt cache is enabled, size limit: 8192 MiB' },
  { level: 'DEBUG', message: 'srv load_model: use `--cache-ram 0` to disable the prompt cache' },
  { level: 'DEBUG', message: 'srv load_model: for more info see https://github.com/ggml-org/llama.cpp/pull/16391' },
  { level: 'DEBUG', message: 'init: chat template, example_format: \'You are a helpful assistant\\n\\nHello there!how are you?\'' },
  { level: 'DEBUG', message: 'init: chat template, thinking = 0' },
  { level: 'DEBUG', message: 'srv update_slots: all slots are idle' },
  { level: 'DEBUG', message: 'sched_reserve: fused Gated Delta Net (autoregressive) enabled' },
  { level: 'DEBUG', message: 'sched_reserve: fused Gated Delta Net (chunked) enabled' },
  { level: 'DEBUG', message: 'sched_reserve: Vulkan_Host compute buffer size = 100.00 MiB' },
  { level: 'DEBUG', message: 'sched_reserve: Vulkan_Host compute buffer size = 20.01 MiB' },
  { level: 'DEBUG', message: 'sched_reserve: graph nodes = 778' },
  { level: 'DEBUG', message: 'sched_reserve: graph splits = 2' },
  { level: 'DEBUG', message: 'sched_reserve: reserve took 181.80 ms, sched copies = 1' },
  { level: 'DEBUG', message: 'scneo_reserve: fused Gated Delta Net (autoregressive) enabled' },
  { level: 'DEBUG', message: 'sched_reserve: Vulkan_Host compute buffer size = 100.00 MiB' },
  { level: 'DEBUG', message: 'llama_kv_cache_size: kv (self-attention) = 99.75 MiB (1280 layers, 4/4 seqs, K (f16): 24.00 MiB, V (f16): 24.00 MiB' },
  { level: 'DEBUG', message: 'llama_kv_cache_size: kv (cross-attention) = 0.00 MiB (0 layers, 0 seqs)' },
  { level: 'DEBUG', message: 'llama_kv_cache_size: total = 99.75 MiB' },
  { level: 'DEBUG', message: 'llama_context: llama_kv_cache_size (4096) < n_ctx_train (8192) -- the full capacity of the model will not be utilized' }
];

function getTimestamp() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${date} ${h}:${m}:${s}`;
}

function addLog(entry) {
  const logsContent = document.getElementById('logsContent');
  const logDiv = document.createElement('div');
  logDiv.className = 'log-entry';
  logDiv.innerHTML = `<span class="timestamp">${getTimestamp()}</span><span class="log-level">[${entry.level}]</span><span class="log-message">${entry.message}</span>`;
  logsContent.appendChild(logDiv);
  logsContent.scrollTop = logsContent.scrollHeight;
}

function initLogs() {
  const logsContent = document.getElementById('logsContent');
  logsContent.innerHTML = '';
  logEntries.forEach((entry, index) => {
    setTimeout(() => {
      addLog(entry);
    }, index * 80);
  });
  setInterval(() => {
    const randomEntry = logEntries[Math.floor(Math.random() * logEntries.length)];
    addLog(randomEntry);
  }, 3000);
}

// Toggle expandable sections
function toggleSection(header) {
  const content = header.nextElementSibling;
  header.classList.toggle('active');
  content.classList.toggle('active');
}

function toggleInferenceSection(header) {
  const content = header.nextElementSibling;
  header.classList.toggle('active');
  content.classList.toggle('active');
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const tabName = this.dataset.tab;
    document.getElementById('infoTab').style.display = tabName === 'info' ? 'block' : 'none';
    document.getElementById('loadTab').style.display = tabName === 'load' ? 'block' : 'none';
    document.getElementById('inferenceTab').style.display = tabName === 'inference' ? 'block' : 'none';
  });
});

// Dropdowns
function toggleDropdown(btnId, dropdownId) {
  const btn = document.getElementById(btnId);
  const dropdown = document.getElementById(dropdownId);

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
}

toggleDropdown('serverSettingsBtn', 'serverSettingsDropdown');
toggleDropdown('logsMenuBtn', 'logsDropdown');

document.addEventListener('click', function () {
  document.querySelectorAll('.dropdown-menu, .cursor-dropdown, .settings-dropdown').forEach(d => d.classList.remove('open'));
});

document.querySelectorAll('.settings-dropdown, .cursor-dropdown').forEach(d => {
  d.addEventListener('click', e => e.stopPropagation());
});

// Range slider value display
document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener('input', function () {
    const valueDisplay = this.parentElement.querySelector('.slider-value');
    if (valueDisplay) {
      valueDisplay.textContent = this.value;
    }
  });
});

// Initialize
window.addEventListener('load', initLogs);





function initSystemMonitor() {
  const toggle = document.getElementById('widgetToggle');
  const panel = document.getElementById('widgetPanel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => panel.classList.toggle('open'));
  const closeBtn = document.getElementById('widgetClose');
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  document.querySelectorAll('.widget-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.widget-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Chart logic
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
  Chart.defaults.color = '#ebebf599';

  const chartCfg = (color, titleLabel, unit) => ({
    type: 'line',
    data: {
      labels: Array(20).fill('').map((_, i) => `${20 - i}s ago`),
      datasets: [{
        label: titleLabel,
        data: Array(20).fill().map(() => Math.random() * 60 + 10),
        borderColor: color,
        backgroundColor: color + '25',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(30, 30, 34, 0.85)',
          titleColor: '#ebebf599',
          bodyColor: '#fff',
          callbacks: {
            title: () => '',
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}${unit}`
          }
        }
      },
      scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } }
    }
  });

  window.wCpuChart = new Chart(document.getElementById('wCpuChart'), chartCfg('#0A84FF', 'CPU Load', '%'));
  window.wRamChart = new Chart(document.getElementById('wRamChart'), chartCfg('#32D74B', 'Memory Usage', '%'));
  window.wGpuChart = new Chart(document.getElementById('wGpuChart'), chartCfg('#FF9F0A', 'GPU Load', '%'));
  window.wNetChart = new Chart(document.getElementById('wNetChart'), chartCfg('#30D158', 'Traffic', ' MB/s'));


  function updateGauge(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.strokeDashoffset = 276.46 - (pct / 100) * 276.46;
  }

  function pushData(chart, val) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(val);
    chart.update('none');
  }

  function simulate() {
    const cpu = Math.floor(Math.random() * 50) + 15, ram = Math.floor(Math.random() * 40) + 35, gpu = Math.floor(Math.random() * 60) + 10, temp = Math.floor(Math.random() * 25) + 45;

    updateGauge('wCpuGauge', cpu);
    const cpuVal = document.getElementById('wCpuVal');
    if (cpuVal) cpuVal.textContent = cpu + '%';
    pushData(wCpuChart, cpu);

    updateGauge('wRamGauge', ram);
    const ramVal = document.getElementById('wRamVal');
    if (ramVal) ramVal.textContent = ram + '%';
    pushData(wRamChart, ram);

    updateGauge('wGpuGauge', gpu);
    const gpuVal = document.getElementById('wGpuVal');
    if (gpuVal) gpuVal.textContent = gpu + '%';
    pushData(wGpuChart, gpu);

    const netDown = document.getElementById('wNetDown');
    if (netDown) {
      netDown.textContent = (Math.random() * 8 + 1).toFixed(1);
      pushData(wNetChart, parseFloat(netDown.textContent) * 10);
    }
  }
  simulate();
  setInterval(simulate, 2000);
}


function prewarmSystemMonitorTabs() {
  const panel = document.getElementById('widgetPanel');
  if (!panel) return;

  const tabIds = ['w-cpu', 'w-ram', 'w-gpu', 'w-net', 'w-bat'];
  const originalActive = panel.querySelector('.widget-tab.active')?.dataset.tab || 'w-cpu';

  panel.style.visibility = 'hidden';
  panel.style.pointerEvents = 'none';
  panel.classList.add('open');

  let i = 0;

  function clickNextTab() {
    if (i >= tabIds.length) {
      const originalTab = panel.querySelector(`.widget-tab[data-tab="${originalActive}"]`);
      if (originalTab) originalTab.click();

      setTimeout(() => {
        panel.classList.remove('open');
        panel.style.visibility = '';
        panel.style.pointerEvents = '';
      }, 60);

      return;
    }

    const tab = panel.querySelector(`.widget-tab[data-tab="${tabIds[i]}"]`);
    if (tab) tab.click();

    i += 1;
    setTimeout(clickNextTab, 80);
  }

  setTimeout(clickNextTab, 80);
}

window.addEventListener('load', () => {
  setTimeout(prewarmSystemMonitorTabs, 800);
});


