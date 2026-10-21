/* ==========================================================
   SCRIPT.JS: shared by products.html and contact.html

   PART 1  Storage helpers        save/load the pickup list in the browser
   PART 2  Pickup list feature    (products.html) "+ Add" buttons + saved list
   PART 3  Form pre-fill          (contact.html) fills the form from the list
   PART 4  Form validation        (contact.html) messages next to each field

   Each part only runs if its elements exist on the current page,
   so one file can safely load on both pages.
   ========================================================== */

/* ---------- PART 1: STORAGE HELPERS ---------- */

// Unique name for this site's saved data in the visitor's browser.
const STORAGE_KEY = 'north-star-bakery-pickup-list';

// The saved data is an ARRAY of OBJECTS, for example:
// [ { id: 'sample-item-a', name: 'Sample item A', price: 10 }, ... ]
function loadList() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return []; // storage blocked or data damaged: start with an empty list
  }
}

function saveList(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // Storage is unavailable (for example private browsing). The page still works, it just won't remember.
  }
}

function formatPrice(number) {
  return '$' + number;
}

function getTotal(list) {
  return list.reduce((sum, item) => sum + item.price, 0);
}

/* ---------- PART 2: PICKUP LIST FEATURE (products.html) ---------- */

let pickupList = loadList();

function isInList(id) {
  return pickupList.some((item) => item.id === id);
}

function addItem(item) {
  pickupList.push(item);
  saveList(pickupList);
}

function removeItem(id) {
  pickupList = pickupList.filter((item) => item.id !== id);
  saveList(pickupList);
}

function clearList() {
  pickupList = [];
  saveList(pickupList);
}

// Read one item's data from its button's data-* attributes.
function itemFromButton(button) {
  return {
    id: button.dataset.id,
    name: button.dataset.name,
    price: Number(button.dataset.price),
  };
}

function announce(message) {
  const status = document.getElementById('pickup-status');
  if (status) status.textContent = message;
}

// Make every "+ Add" button match the saved list (✓ Added or + Add).
function updateButtons() {
  document.querySelectorAll('.add-btn').forEach((button) => {
    const added = isInList(button.dataset.id);
    button.setAttribute('aria-pressed', String(added));
    button.textContent = added ? '✓ Added' : '+ Add';
    button.setAttribute('aria-label', (added ? 'Remove ' : 'Add ') + button.dataset.name + (added ? ' from' : ' to') + ' pickup list');
  });
}

function createListRow(item) {
  const row = document.createElement('li');

  const name = document.createElement('span');
  name.textContent = item.name;

  const price = document.createElement('span');
  price.textContent = formatPrice(item.price);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-btn';
  remove.textContent = 'Remove';
  remove.setAttribute('aria-label', 'Remove ' + item.name + ' from pickup list');
  remove.addEventListener('click', () => handleRemove(item));

  row.append(name, price, remove);
  return row;
}

// Rebuild the "Your pickup list" panel from the data.
function renderPanel() {
  const listEl = document.getElementById('pickup-items');
  const emptyEl = document.getElementById('pickup-empty');
  const totalEl = document.getElementById('pickup-total');
  const actionsEl = document.getElementById('pickup-actions');
  const hasItems = pickupList.length > 0;

  listEl.replaceChildren(...pickupList.map(createListRow));
  emptyEl.hidden = hasItems;
  actionsEl.hidden = !hasItems;
  totalEl.hidden = !hasItems;
  totalEl.textContent = 'Estimated total: ' + formatPrice(getTotal(pickupList)) + ' (' + pickupList.length + (pickupList.length === 1 ? ' item' : ' items') + ')';
}

function refreshPickup() {
  updateButtons();
  renderPanel();
}

function handleAddClick(event) {
  const item = itemFromButton(event.currentTarget);
  if (isInList(item.id)) {
    removeItem(item.id);
    announce(item.name + ' removed. ' + pickupList.length + ' items on your list.');
  } else {
    addItem(item);
    announce(item.name + ' added. ' + pickupList.length + ' items on your list.');
  }
  refreshPickup();
}

function handleRemove(item) {
  removeItem(item.id);
  announce(item.name + ' removed. ' + pickupList.length + ' items on your list.');
  refreshPickup();
}

function handleClear() {
  clearList();
  announce('Pickup list cleared.');
  refreshPickup();
}

function initPickup() {
  const buttons = document.querySelectorAll('.add-btn');
  if (buttons.length === 0) return; // not the products page
  buttons.forEach((button) => button.addEventListener('click', handleAddClick));
  document.getElementById('pickup-clear').addEventListener('click', handleClear);
  refreshPickup(); // show whatever was saved on an earlier visit
}

/* ---------- PART 3: FORM PRE-FILL (contact.html) ---------- */

function buildListText(list) {
  const lines = list.map((item) => '- ' + item.name + ' (' + formatPrice(item.price) + ')');
  return 'Pickup list:\n' + lines.join('\n') + '\nEstimated total: ' + formatPrice(getTotal(list));
}

function prefillDetails() {
  const details = document.getElementById('details');
  const note = document.getElementById('prefill-note');
  const list = loadList();
  // Only fill an empty box, so we never overwrite what the visitor typed.
  if (!details || list.length === 0 || details.value.trim() !== '') return;
  details.value = buildListText(list);
  details.rows = list.length + 3; // make the box tall enough to show the whole list
  note.hidden = false;
}

/* ---------- PART 4: FORM VALIDATION (contact.html) ---------- */

const MAX_DETAILS_LENGTH = 600;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function todayString() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the visitor's own time zone
}

// Each field has a list of checks. The FIRST check that fails supplies the message.
// To add a rule, add { isValid: (value) => ..., message: '...' } to the list.
const validationRules = {
  name: [
    { isValid: (v) => v.trim() !== '', message: 'Please enter your name.' },
    { isValid: (v) => v.trim().length >= 2, message: 'Your name needs at least 2 characters.' },
  ],
  email: [
    { isValid: (v) => v.trim() !== '', message: 'Please enter your email address.' },
    { isValid: (v) => EMAIL_PATTERN.test(v.trim()), message: 'That email looks incomplete. Try something like name@example.com.' },
  ],
  phone: [
    // Optional field: only checked when the visitor types something.
    { isValid: (v) => v.trim() === '' || v.replace(/\D/g, '').length >= 10, message: 'Please enter a 10-digit phone number, like (555) 555-0100.' },
  ],
  'preferred-date': [
    { isValid: (v) => v !== '', message: 'Please choose a preferred date.' },
    { isValid: (v) => v >= todayString(), message: 'Please choose today or a future date.' },
  ],
  'request-type': [
    { isValid: (v) => v !== '', message: 'Please choose what we can help with.' },
  ],
  details: [
    { isValid: (v) => v.length <= MAX_DETAILS_LENGTH, message: 'Please keep this under ' + MAX_DETAILS_LENGTH + ' characters.' },
  ],
};

// Returns the error message for one field, or '' if the field is fine.
function getErrorMessage(field) {
  const rules = validationRules[field.id] || [];
  const failed = rules.find((rule) => !rule.isValid(field.value));
  return failed ? failed.message : '';
}

function showError(field, message) {
  const errorEl = document.getElementById(field.id + '-error');
  errorEl.textContent = message;
  errorEl.hidden = false;
  field.setAttribute('aria-invalid', 'true');
}

function clearError(field) {
  const errorEl = document.getElementById(field.id + '-error');
  errorEl.textContent = '';
  errorEl.hidden = true;
  field.removeAttribute('aria-invalid');
}

// Check one field and show or clear its message. Returns true if valid.
function validateField(field) {
  const message = getErrorMessage(field);
  if (message) {
    showError(field, message);
    return false;
  }
  clearError(field);
  return true;
}

function setStatus(message) {
  document.getElementById('form-status').textContent = message;
}

function handleSubmit(event, form) {
  const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((f) => validationRules[f.id]);
  const invalidFields = fields.filter((field) => !validateField(field));

  if (invalidFields.length > 0) {
    event.preventDefault(); // stop the form from being sent
    invalidFields[0].focus(); // jump to the first problem
    setStatus('Please fix ' + invalidFields.length + (invalidFields.length === 1 ? ' field' : ' fields') + ' marked below.');
    return;
  }
  setStatus('Thank you! Opening your email app to send your request.');
}

function initForm() {
  const form = document.getElementById('request-form');
  if (!form) return; // not the contact page

  const dateField = document.getElementById('preferred-date');
  dateField.min = todayString(); // the date picker greys out past days

  prefillDetails();

  form.addEventListener('submit', (event) => handleSubmit(event, form));

  // Check a field when the visitor leaves it, and re-check as they fix it.
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    if (!validationRules[field.id]) return;
    field.addEventListener('blur', () => { if (field.value !== '' || field.hasAttribute('aria-invalid')) validateField(field); });
    const recheck = () => { if (field.hasAttribute('aria-invalid')) validateField(field); };
    field.addEventListener('input', recheck);
    field.addEventListener('change', recheck);
  });
}

/* ---------- START ---------- */
initPickup();
initForm();
