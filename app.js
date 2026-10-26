/**
 * SAO Form 002A Waiver & Authorization Generator
 * Client-Side Application Engine
 * Supports MALAYA & JISSA
 */

// Global State
const state = {
  organization: 'MALAYA', // 'MALAYA' | 'JISSA'
  renderMode: 'vector',   // 'vector' | 'scanned'
  
  // Form Fields
  orgName: 'MALAYA',
  formDate: 'October 29, 2026',
  revNo: '01',
  revDate: 'August 2026',
  
  studentName: '',
  studentNumber: '',
  studentProgram: '',
  
  parentName: '',
  relationship: 'PARENT / LEGAL GUARDIAN',

  // Signature States
  studentSigMode: 'draw',     // 'draw' | 'upload'
  studentSigBlank: false,
  studentSigData: null,      // DataURL
  studentPenColor: '#0f172a',
  
  parentSigMode: 'draw',       // 'draw' | 'upload'
  parentSigBlank: false,
  parentSigData: null,        // DataURL
  parentPenColor: '#0f172a',

  // Interactive Box Offsets (percentage or pixel positions relative to 580x752)
  boxPositions: {
    revNo: { top: 24, left: 380 },
    revDate: { top: 24, left: 450 },
    formDate: { top: 48, left: 450 },
    parentName: { top: 310, left: 45 },
    studentName: { top: 330, left: 45 },
    studentNumber: { top: 330, left: 360 },
    orgName: { top: 350, left: 240 },
    parentSig: { top: 435, left: 160 },
    parentPrintedName: { top: 485, left: 120 },
    studentSig: { top: 610, left: 160 },
    studentPrintedName: { top: 660, left: 120 }
  }
};

// Default initial coordinates for layout reset
const defaultBoxPositions = JSON.parse(JSON.stringify(state.boxPositions));

// Scanned background image object
let scannedTemplateImg = null;

// Drawing Pad instances
let studentPad = null;
let parentPad = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initDrawingPads();
  initDraggableBoxes();
  loadSavedState();
  loadTemplateImage();
  renderDocument();
});

// Organization Switcher
function setOrganization(org) {
  state.organization = org;
  
  const malayaBtn = document.getElementById('btn-org-malaya');
  const jissaBtn = document.getElementById('btn-org-jissa');
  const logoBadge = document.getElementById('org-logo-badge');
  const driveBtn = document.getElementById('btn-drive-link');
  const driveLabel = document.getElementById('txt-drive-label');
  const submitDriveBtn = document.getElementById('btn-submit-drive-action');
  const orgNameInput = document.getElementById('input-org-name');

  if (org === 'MALAYA') {
    malayaBtn.className = 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30';
    jissaBtn.className = 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all';
    
    logoBadge.textContent = 'M';
    logoBadge.className = 'w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20';
    
    const driveUrl = 'https://drive.google.com/drive/u/0/folders/1vDQ7dbCxyB2_UHL032OnlZZRJxUHrACl';
    driveBtn.href = driveUrl;
    driveLabel.textContent = 'Malaya Drive';
    submitDriveBtn.href = driveUrl;

    if (state.orgName === 'JISSA' || !state.orgName) {
      state.orgName = 'MALAYA';
      orgNameInput.value = 'MALAYA';
    }
  } else {
    jissaBtn.className = 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30';
    malayaBtn.className = 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all';
    
    logoBadge.textContent = 'J';
    logoBadge.className = 'w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20';
    
    const driveUrl = 'https://drive.google.com/drive/folders/1OT8x7mthyEwdF_QPkgRDgA-uH2Wv3DPd';
    driveBtn.href = driveUrl;
    driveLabel.textContent = 'JISSA Drive';
    submitDriveBtn.href = driveUrl;

    if (state.orgName === 'MALAYA' || !state.orgName) {
      state.orgName = 'JISSA';
      orgNameInput.value = 'JISSA';
    }
  }

  updateFilenameDisplay();
  renderDocument();
  saveState();
}

// Update field helper
function updateField(key, value) {
  state[key] = value;
  
  // Synchronize on-canvas labels
  const labelElem = document.getElementById(`label-${key}`);
  if (labelElem) {
    if (key === 'studentName') {
      labelElem.textContent = value || '[STUDENT FULL NAME]';
    } else if (key === 'parentName') {
      labelElem.textContent = value || '[PARENT/GUARDIAN NAME]';
    } else if (key === 'studentNumber') {
      labelElem.textContent = value || '2026XXXXXX';
    } else if (key === 'orgName') {
      labelElem.textContent = value || state.organization;
    } else {
      labelElem.textContent = value;
    }
  }

  // Update printed name boxes
  if (key === 'studentName') {
    document.getElementById('label-studentPrintedName').textContent = value 
      ? `${value} / ${state.formDate}` 
      : 'SIGNATURE OVER PRINTED NAME OF STUDENT / DATE';
    updateFilenameDisplay();
  }

  if (key === 'parentName') {
    document.getElementById('label-parentPrintedName').textContent = value 
      ? `${value} / ${state.formDate}` 
      : 'SIGNATURE OVER PRINTED NAME OF PARENT/LEGAL GUARDIAN / DATE';
  }

  if (key === 'formDate') {
    if (state.studentName) {
      document.getElementById('label-studentPrintedName').textContent = `${state.studentName} / ${value}`;
    }
    if (state.parentName) {
      document.getElementById('label-parentPrintedName').textContent = `${state.parentName} / ${value}`;
    }
  }

  renderDocument();
  saveState();
}

// Update Target Filename Display
function updateFilenameDisplay() {
  const code = document.getElementById('txt-target-filename');
  let lastName = 'LASTNAME';
  if (state.studentName.trim()) {
    // Extract last name from "DELA CRUZ, JUAN" or "JUAN DELA CRUZ"
    const parts = state.studentName.trim().split(',');
    if (parts.length > 1) {
      lastName = parts[0].trim().replace(/\s+/g, '_');
    } else {
      const words = state.studentName.trim().split(' ');
      lastName = words[words.length - 1].replace(/\s+/g, '_');
    }
  }
  code.textContent = `${lastName.toUpperCase()}_002A.pdf`;
}

// Render Mode (Pristine Vector vs Scanned)
function setRenderMode(mode) {
  state.renderMode = mode;
  const vectorBtn = document.getElementById('btn-mode-vector');
  const scannedBtn = document.getElementById('btn-mode-scanned');

  if (mode === 'vector') {
    vectorBtn.className = 'px-2.5 py-1 rounded-lg font-semibold text-xs bg-slate-800 text-white shadow-sm';
    scannedBtn.className = 'px-2.5 py-1 rounded-lg font-semibold text-xs text-slate-400 hover:text-white';
  } else {
    scannedBtn.className = 'px-2.5 py-1 rounded-lg font-semibold text-xs bg-slate-800 text-white shadow-sm';
    vectorBtn.className = 'px-2.5 py-1 rounded-lg font-semibold text-xs text-slate-400 hover:text-white';
  }

  renderDocument();
}

// Load background scanned template
function loadTemplateImage() {
  const img = new Image();
  img.src = 'assets/002A_single.png';
  img.onload = () => {
    scannedTemplateImg = img;
    if (state.renderMode === 'scanned') {
      renderDocument();
    }
  };
  img.onerror = () => {
    console.log('Template image asset not found; defaulting to pristine vector mode.');
  };
}

// Setup Drawing Canvas Pads
function initDrawingPads() {
  studentPad = setupPad('canvas-student-sig', (dataUrl) => {
    state.studentSigData = dataUrl;
    updateSigPreview('student');
    renderDocument();
    saveState();
  });

  parentPad = setupPad('canvas-parent-sig', (dataUrl) => {
    state.parentSigData = dataUrl;
    updateSigPreview('parent');
    renderDocument();
    saveState();
  });
}

function setupPad(canvasId, onChange) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let points = [];
  let penColor = '#0f172a';

  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    isDrawing = true;
    points = [getPos(e)];
    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
  }

  function move(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    points.push(pos);

    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function end(e) {
    if (!isDrawing) return;
    isDrawing = false;
    onChange(canvas.toDataURL('image/png'));
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);

  return {
    setColor: (c) => { penColor = c; },
    clear: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
    },
    loadData: (dataUrl) => {
      if (!dataUrl) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = dataUrl;
    }
  };
}

function setPenColor(target, color) {
  if (target === 'student') {
    state.studentPenColor = color;
    studentPad.setColor(color);
  } else {
    state.parentPenColor = color;
    parentPad.setColor(color);
  }
}

function clearSig(target) {
  if (target === 'student') {
    studentPad.clear();
    state.studentSigData = null;
    updateSigPreview('student');
  } else {
    parentPad.clear();
    state.parentSigData = null;
    updateSigPreview('parent');
  }
  renderDocument();
  saveState();
}

function setSigMode(target, mode) {
  if (target === 'student') {
    state.studentSigMode = mode;
    document.getElementById('student-draw-pane').classList.toggle('hidden', mode !== 'draw');
    document.getElementById('student-upload-pane').classList.toggle('hidden', mode !== 'upload');
    document.getElementById('btn-tab-student-draw').className = mode === 'draw' ? 'flex-1 py-1 rounded-lg font-semibold bg-slate-800 text-white' : 'flex-1 py-1 rounded-lg font-semibold text-slate-400 hover:text-white';
    document.getElementById('btn-tab-student-upload').className = mode === 'upload' ? 'flex-1 py-1 rounded-lg font-semibold bg-slate-800 text-white' : 'flex-1 py-1 rounded-lg font-semibold text-slate-400 hover:text-white';
  } else {
    state.parentSigMode = mode;
    document.getElementById('parent-draw-pane').classList.toggle('hidden', mode !== 'draw');
    document.getElementById('parent-upload-pane').classList.toggle('hidden', mode !== 'upload');
    document.getElementById('btn-tab-parent-draw').className = mode === 'draw' ? 'flex-1 py-1 rounded-lg font-semibold bg-slate-800 text-white' : 'flex-1 py-1 rounded-lg font-semibold text-slate-400 hover:text-white';
    document.getElementById('btn-tab-parent-upload').className = mode === 'upload' ? 'flex-1 py-1 rounded-lg font-semibold bg-slate-800 text-white' : 'flex-1 py-1 rounded-lg font-semibold text-slate-400 hover:text-white';
  }
}

function toggleBlankSignature(target, isBlank) {
  if (target === 'student') {
    state.studentSigBlank = isBlank;
    document.getElementById('student-sig-wrapper').classList.toggle('opacity-40', isBlank);
    document.getElementById('student-sig-wrapper').classList.toggle('pointer-events-none', isBlank);
    updateSigPreview('student');
  } else {
    state.parentSigBlank = isBlank;
    document.getElementById('parent-sig-wrapper').classList.toggle('opacity-40', isBlank);
    document.getElementById('parent-sig-wrapper').classList.toggle('pointer-events-none', isBlank);
    updateSigPreview('parent');
  }
  renderDocument();
  saveState();
}

// Handle Photo Upload of Signature with Automated Background Transparency Knockout
function handleSigUpload(target, inputElem) {
  if (!inputElem.files || !inputElem.files[0]) return;
  const file = inputElem.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    processSignatureImage(e.target.result, target);
  };
  reader.readAsDataURL(file);
}

function updateSigFromUpload(target) {
  // Re-trigger upload knockout toggle
  const inputElem = document.getElementById(target === 'student' ? 'file-student-sig' : 'file-parent-sig');
  handleSigUpload(target, inputElem);
}

function processSignatureImage(dataUrl, target) {
  const knockoutCheckbox = document.getElementById(target === 'student' ? 'check-student-knockout' : 'check-parent-knockout');
  const shouldKnockout = knockoutCheckbox ? knockoutCheckbox.checked : true;

  const img = new Image();
  img.onload = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (shouldKnockout) {
      const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Knock out light/white paper background
        if (brightness > 190) {
          data[i + 3] = 0; // Transparent
        } else {
          // Darken ink strokes to ensure deep rich signature
          data[i] = Math.max(0, r * 0.7);
          data[i + 1] = Math.max(0, g * 0.7);
          data[i + 2] = Math.max(0, b * 0.7);
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const processedDataUrl = tempCanvas.toDataURL('image/png');
    if (target === 'student') {
      state.studentSigData = processedDataUrl;
      updateSigPreview('student');
    } else {
      state.parentSigData = processedDataUrl;
      updateSigPreview('parent');
    }
    renderDocument();
    saveState();
  };
  img.src = dataUrl;
}

function updateSigPreview(target) {
  const container = document.getElementById(target === 'student' ? 'img-container-studentSig' : 'img-container-parentSig');
  const isBlank = target === 'student' ? state.studentSigBlank : state.parentSigBlank;
  const sigData = target === 'student' ? state.studentSigData : state.parentSigData;

  container.innerHTML = '';
  if (isBlank) {
    container.innerHTML = '<span class="text-[10px] text-amber-500 font-semibold italic bg-amber-50 px-1 rounded border border-amber-200">BLANK SIGNATURE (PRINT TO SIGN)</span>';
  } else if (sigData) {
    const img = document.createElement('img');
    img.src = sigData;
    img.className = 'max-h-full max-w-full object-contain';
    container.appendChild(img);
  } else {
    container.innerHTML = `<span class="text-[11px] text-slate-400 italic">(${target === 'student' ? 'Student' : 'Parent'} Signature Placeholder)</span>`;
  }
}

// DRAGGABLE BOXES INTERACTION ENGINE
function initDraggableBoxes() {
  const overlay = document.getElementById('interactive-overlay');
  const boxes = document.querySelectorAll('.draggable-box');

  boxes.forEach((box) => {
    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    function onPointerDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      isDragging = true;
      box.classList.add('active');

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      initialLeft = parseFloat(box.style.left) || 0;
      initialTop = parseFloat(box.style.top) || 0;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const newLeft = Math.max(0, Math.min(540, initialLeft + deltaX));
      const newTop = Math.max(0, Math.min(720, initialTop + deltaY));

      box.style.left = `${newLeft}px`;
      box.style.top = `${newTop}px`;

      // Update state coordinates
      const boxKey = box.id.replace('box-', '');
      if (state.boxPositions[boxKey]) {
        state.boxPositions[boxKey] = { top: newTop, left: newLeft };
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      box.classList.remove('active');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderDocument();
      saveState();
    }

    box.addEventListener('pointerdown', onPointerDown);
  });
}

function resetTextBoxPositions() {
  state.boxPositions = JSON.parse(JSON.stringify(defaultBoxPositions));
  for (const [key, pos] of Object.entries(state.boxPositions)) {
    const box = document.getElementById(`box-${key}`);
    if (box) {
      box.style.top = `${pos.top}px`;
      box.style.left = `${pos.left}px`;
    }
  }
  renderDocument();
  saveState();
}

// MASTER DOCUMENT CANVAS RENDERER (1160 x 1504 pixels, 2x Retina Scale)
function renderDocument() {
  const canvas = document.getElementById('doc-render-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;  // 1160
  const H = canvas.height; // 1504

  ctx.clearRect(0, 0, W, H);

  // Background base
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  if (state.renderMode === 'scanned' && scannedTemplateImg) {
    // 1. Draw scanned background image
    ctx.drawImage(scannedTemplateImg, 0, 0, W, H);

    // 2. White out specific template regions so user inputs blend seamlessly
    applyScannedWhiteouts(ctx, W, H);
  } else {
    // Pristine high-resolution official vector recreation
    renderPristineVectorDocument(ctx, W, H);
  }

  // Draw Dynamic Overlay Content from Text Boxes (in calibrated 2x scale)
  renderDynamicOverlayFields(ctx, W, H);
}

// Whiteout zones for Scanned Mode
function applyScannedWhiteouts(ctx, W, H) {
  ctx.fillStyle = '#FFFFFF';

  // Whiteout Revision No. & Date box in top right
  ctx.fillRect(W * 0.72, H * 0.02, W * 0.26, H * 0.06);

  // Whiteout Parent, Student, Student Number, Org fill areas
  ctx.fillRect(W * 0.06, H * 0.40, W * 0.88, H * 0.09);

  // Whiteout Parent Signature line area
  ctx.fillRect(W * 0.20, H * 0.55, W * 0.60, H * 0.08);

  // Whiteout Student Signature line area
  ctx.fillRect(W * 0.20, H * 0.80, W * 0.60, H * 0.08);
}

// Render Pristine Official CSAD 002A Document
function renderPristineVectorDocument(ctx, W, H) {
  // Border guideline margin
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;

  // Header: Institution Title
  ctx.fillStyle = '#991b1b'; // Mapua Red
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MAPÚA', 50, 48);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MALAYAN COLLEGES LAGUNA', 50, 68);

  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CENTER FOR STUDENT ACTIVITIES AND DISCIPLINE', 50, 86);

  // Form Title
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AUTHORIZATION TO JOIN STUDENT ORGANIZATIONS', 50, 122);

  // Header Box (Top Right: Revision & Code)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(740, 28, 370, 78);
  ctx.beginPath();
  ctx.moveTo(740, 68);
  ctx.lineTo(1110, 68);
  ctx.moveTo(880, 28);
  ctx.lineTo(880, 106);
  ctx.stroke();

  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('REVISION NO.:', 750, 50);
  ctx.fillText('REVISION DATE:', 890, 50);
  ctx.fillText('DATE:', 750, 90);
  ctx.fillText('FORM CODE:', 890, 90);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(state.revNo || '01', 845, 50);
  ctx.fillText(state.revDate || 'August 2026', 995, 50);
  ctx.fillText(state.formDate || '10/29/2026', 795, 90);
  ctx.fillText('CSAD-002A', 980, 90);

  // Section 1: GUIDELINES
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GUIDELINES', 50, 155);

  const guidelines = [
    '1) PLEASE ATTACH THIS FORM TOGETHER WITH ALL THE OTHER DOCUMENTS NEEDED TO APPLY / RENEW ACCREDITATION.',
    '2) ONE STUDENT PER FORM.',
    '3) AS A STUDENT OF MALAYAN COLLEGES LAGUNA WHO HAS SIGNIFIED HIS/HER INTENTION TO ORGANIZE TOGETHER WITH OTHER STUDENTS AN ORGANIZATION RECOGNIZED BY THE RULES AND REGULATIONS OF MALAYAN COLLEGES LAGUNA, ANY STUDENT BELOW THE AGE OF EIGHTEEN (18) YEARS MUST SECURE WRITTEN CONSENT FROM HIS/HER PARENT OR LEGAL GUARDIAN.',
    '4) WHILE MALAYAN COLLEGES LAGUNA IS DRIVEN TO DELIVER ACADEMIC EXCELLENCE, IT IS ALSO CONCERNED WITH THE OVER-ALL WELFARE OF ITS STUDENTS. AS SUCH, STUDENTS ARE ENCOURAGED TO PARTICIPATE IN CO-CURRICULAR AND EXTRA-CURRICULAR ACTIVITIES IN ORDER FOR THE STUDENT TO DEVELOP THEIR INTER-PERSONAL SKILLS, LEADERSHIP SKILLS AS WELL AS FOR THEM TO HAVE A BALANCED STUDENT LIFE EXPERIENCE.'
  ];

  ctx.font = '400 10.5px "Plus Jakarta Sans", sans-serif';
  let curY = 175;
  guidelines.forEach((g) => {
    curY = drawWrappedText(ctx, g, 50, curY, 1060, 16);
    curY += 4;
  });

  // Section 2: AUTHORIZATION
  curY += 12;
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AUTHORIZATION', 50, curY);

  curY += 22;
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TO THE CENTER FOR STUDENT ACTIVITIES AND DISCIPLINE:', 50, curY);

  curY += 20;
  ctx.font = '400 11.5px "Plus Jakarta Sans", sans-serif';
  const authParagraph1 = `I, ____________________________________________________, PARENT / LEGAL GUARDIAN, OF ____________________________________________________, WITH STUDENT NUMBER ________________________, GIVE MY CONSENT TO HIM/HER TO JOIN ________________________.`;
  curY = drawWrappedText(ctx, authParagraph1, 50, curY, 1060, 20);

  curY += 12;
  const authParagraph2 = 'FURTHERMORE, I UNDERSTAND THAT THIS CONSENT IS REQUIRED OF ALL MEMBERS OF AN ORGANIZATION INTENDING TO BE ACCREDITED OR IN RENEWING THEIR ACCREDITATION FROM THE CENTER FOR STUDENT ACTIVITIES AND DISCIPLINE.';
  curY = drawWrappedText(ctx, authParagraph2, 50, curY, 1060, 18);

  curY += 8;
  const authParagraph3 = 'FURTHERMORE, I HEREBY UNDERSTAND THAT THE MEMBERSHIP OF THE STUDENT IS PURELY ON HIS/HER OWN INITIATIVE AND WAS NOT IMPOSED BY ANY INSTRUMENTALITY OF MALAYAN COLLEGES LAGUNA.';
  curY = drawWrappedText(ctx, authParagraph3, 50, curY, 1060, 18);

  // Parent Signature Line
  curY += 60;
  ctx.beginPath();
  ctx.moveTo(350, curY);
  ctx.lineTo(810, curY);
  ctx.stroke();

  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('SIGNATURE OVER PRINTED NAME OF PARENT/LEGAL GUARDIAN / DATE', 580, curY + 18);
  ctx.textAlign = 'left';

  // Section 3: CONFIRMATION BY THE STUDENT
  curY += 50;
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CONFIRMATION BY THE STUDENT', 50, curY);

  curY += 22;
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TO THE CENTER FOR STUDENT ACTIVITIES AND DISCIPLINE:', 50, curY);

  curY += 20;
  ctx.font = '400 11.5px "Plus Jakarta Sans", sans-serif';
  const confParagraph = 'I HEREBY AGREE THAT SHOULD THE APPLICATION OR RENEWAL FOR ACCREDITATION OF THE STUDENT ORGANIZATION I INTEND TO JOIN BE APPROVED, MY MEMBERSHIP SHALL BE BOUND BY THE RULES AND REGULATIONS GOVERNING STUDENT ORGANIZATIONS AND APPROPRIATE SANCTIONS SHALL APPLY BASED ON THE POLICIES OF MALAYAN COLLEGES LAGUNA.';
  curY = drawWrappedText(ctx, confParagraph, 50, curY, 1060, 18);

  // Student Signature Line
  curY += 65;
  ctx.beginPath();
  ctx.moveTo(350, curY);
  ctx.lineTo(810, curY);
  ctx.stroke();

  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SIGNATURE OVER PRINTED NAME OF STUDENT / DATE', 580, curY + 18);
  ctx.textAlign = 'left';

  // Footer Notice & Code
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('THIS FORM IS AVAILABLE AT THE CENTER FOR STUDENT ACTIVITIES AND DISCIPLINE.', 50, 1470);
  ctx.textAlign = 'right';
  ctx.fillText('FORM CSAD-002A', 1110, 1470);
  ctx.textAlign = 'left';
}

// Render User Dynamic Overlays on top of Canvas
function renderDynamicOverlayFields(ctx, W, H) {
  // Scale factor: canvas is 1160 x 1504, while wrapper preview is 580 x 752 (ratio = 2.0)
  const scale = W / 580;

  // 1. Parent Signature Image / Drawing
  if (!state.parentSigBlank && state.parentSigData) {
    const pPos = state.boxPositions.parentSig;
    const pImg = new Image();
    pImg.onload = () => {
      ctx.drawImage(pImg, pPos.left * scale, pPos.top * scale, 240 * scale, 50 * scale);
    };
    pImg.src = state.parentSigData;
  }

  // 2. Student Signature Image / Drawing
  if (!state.studentSigBlank && state.studentSigData) {
    const sPos = state.boxPositions.studentSig;
    const sImg = new Image();
    sImg.onload = () => {
      ctx.drawImage(sImg, sPos.left * scale, sPos.top * scale, 240 * scale, 50 * scale);
    };
    sImg.src = state.studentSigData;
  }
}

// Text wrapping utility for HTML5 Canvas
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y;
}

// EXPORT TO PDF & PNG
async function exportDocument(format) {
  const canvas = document.getElementById('doc-render-canvas');
  if (!canvas) return;

  // Determine standard file name
  let lastName = 'LASTNAME';
  if (state.studentName.trim()) {
    const parts = state.studentName.trim().split(',');
    if (parts.length > 1) {
      lastName = parts[0].trim().replace(/\s+/g, '_');
    } else {
      const words = state.studentName.trim().split(' ');
      lastName = words[words.length - 1].replace(/\s+/g, '_');
    }
  }
  const filename = `${lastName.toUpperCase()}_002A.${format}`;

  if (format === 'png') {
    // Export PNG
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    showNotification(`Downloaded ${filename} successfully!`);
  } else if (format === 'pdf') {
    // Export PDF via jsPDF with exact 166.511mm x 215.9mm dimensions
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [166.511, 215.9]
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, 166.511, 215.9, undefined, 'FAST');
    pdf.save(filename);
    showNotification(`Generated official ${filename}!`);
  }
}

// Show Toast Notification
function showNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
  toast.innerHTML = `<span>✅</span> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Sample Data Filler
function fillSampleData() {
  updateField('studentName', 'DELA CRUZ, JUAN P.');
  document.getElementById('input-student-name').value = 'DELA CRUZ, JUAN P.';

  updateField('studentNumber', '2026108422');
  document.getElementById('input-student-number').value = '2026108422';

  updateField('studentProgram', 'BS Computer Science - 2nd Year');
  document.getElementById('input-student-program').value = 'BS Computer Science - 2nd Year';

  updateField('parentName', 'DELA CRUZ, MARIA P.');
  document.getElementById('input-parent-name').value = 'DELA CRUZ, MARIA P.';

  updateField('formDate', 'October 29, 2026');
  document.getElementById('input-form-date').value = 'October 29, 2026';

  updateField('revNo', '01');
  document.getElementById('input-rev-no').value = '01';

  updateField('revDate', 'August 2026');
  document.getElementById('input-rev-date').value = 'August 2026';

  updateFilenameDisplay();
  renderDocument();
  showNotification('Loaded sample member data!');
}

// Form Reset
function resetForm() {
  state.studentName = '';
  state.studentNumber = '';
  state.studentProgram = '';
  state.parentName = '';
  state.studentSigData = null;
  state.parentSigData = null;
  state.studentSigBlank = false;
  state.parentSigBlank = false;

  document.getElementById('input-student-name').value = '';
  document.getElementById('input-student-number').value = '';
  document.getElementById('input-student-program').value = '';
  document.getElementById('input-parent-name').value = '';
  document.getElementById('check-student-blank').checked = false;
  document.getElementById('check-parent-blank').checked = false;

  toggleBlankSignature('student', false);
  toggleBlankSignature('parent', false);
  clearSig('student');
  clearSig('parent');

  resetTextBoxPositions();
  localStorage.removeItem('sao_002a_draft');
  updateFilenameDisplay();
  renderDocument();
  showNotification('Form reset successfully.');
}

// LocalStorage Persistence
function saveState() {
  try {
    const toSave = {
      organization: state.organization,
      orgName: state.orgName,
      formDate: state.formDate,
      revNo: state.revNo,
      revDate: state.revDate,
      studentName: state.studentName,
      studentNumber: state.studentNumber,
      studentProgram: state.studentProgram,
      parentName: state.parentName,
      relationship: state.relationship,
      studentSigBlank: state.studentSigBlank,
      parentSigBlank: state.parentSigBlank,
      studentSigData: state.studentSigData,
      parentSigData: state.parentSigData,
      boxPositions: state.boxPositions
    };
    localStorage.setItem('sao_002a_draft', JSON.stringify(toSave));
  } catch (e) {
    // Quota or private browsing fallback
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem('sao_002a_draft');
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);

    // Populate inputs
    if (saved.orgName) document.getElementById('input-org-name').value = saved.orgName;
    if (saved.formDate) document.getElementById('input-form-date').value = saved.formDate;
    if (saved.revNo) document.getElementById('input-rev-no').value = saved.revNo;
    if (saved.revDate) document.getElementById('input-rev-date').value = saved.revDate;
    if (saved.studentName) document.getElementById('input-student-name').value = saved.studentName;
    if (saved.studentNumber) document.getElementById('input-student-number').value = saved.studentNumber;
    if (saved.studentProgram) document.getElementById('input-student-program').value = saved.studentProgram;
    if (saved.parentName) document.getElementById('input-parent-name').value = saved.parentName;

    if (saved.studentSigBlank) {
      document.getElementById('check-student-blank').checked = true;
      toggleBlankSignature('student', true);
    }
    if (saved.parentSigBlank) {
      document.getElementById('check-parent-blank').checked = true;
      toggleBlankSignature('parent', true);
    }

    if (saved.studentSigData && studentPad) {
      studentPad.loadData(saved.studentSigData);
      updateSigPreview('student');
    }
    if (saved.parentSigData && parentPad) {
      parentPad.loadData(saved.parentSigData);
      updateSigPreview('parent');
    }

    // Set box coordinates
    if (saved.boxPositions) {
      for (const [key, pos] of Object.entries(saved.boxPositions)) {
        const box = document.getElementById(`box-${key}`);
        if (box) {
          box.style.top = `${pos.top}px`;
          box.style.left = `${pos.left}px`;
        }
      }
    }

    if (saved.organization) {
      setOrganization(saved.organization);
    }
  } catch (e) {
    console.log('Could not load draft state', e);
  }
}
