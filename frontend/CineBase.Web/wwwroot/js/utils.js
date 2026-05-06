// Formattazione data ISO -> DD/MM/YYYY
function formatDate(isoDate) {
  if (!isoDate) return '-';
  var datePart = isoDate.split('T')[0];
  var parts = datePart.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatDateForInput(isoDate) {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
}

function formatTime(timeString) {
  if (!timeString || timeString === '00:00:00') return '';
  if (timeString.includes('T')) return timeString.split('T')[1].substring(0, 5);
  return timeString.substring(0, 5);
}

function truncateText(text, maxLength) {
  if (!text) return '';
  maxLength = maxLength || 50;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeRole(role) {
  if (role == null) return 'anonimo';
  var value = String(role).trim().toLowerCase();
  if (value === '2' || value === 'admin') return 'admin';
  if (value === '1' || value === 'poweruser') return 'poweruser';
  if (value === '0' || value === 'user') return 'user';
  return 'anonimo';
}

function normalizeCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data && data.$values)) return data.$values;
  if (Array.isArray(data && data.items)) return data.items;
  return [];
}

function handleApiError(error) {
  console.error('API Error:', error);
  var message = 'Si è verificato un errore';
  if (error.status === 0) {
    message = error.message || 'Backend non raggiungibile';
    showToast(message, 'danger');
    return message;
  }
  switch (error.status) {
    case 400:
      message = error.errors ? Object.values(error.errors).flat().join(', ') : (error.message || 'Dati non validi');
      break;
    case 404:
      message = error.message || 'Elemento non trovato';
      break;
    case 409:
      message = error.message || 'Conflitto';
      break;
    case 500:
      message = error.message || 'Errore del server';
      break;
    default:
      message = error.message || message;
  }
  showToast(message, 'danger');
  return message;
}

function showToast(message, type) {
  var container = document.getElementById('toast-container');
  if (!container) return;
  type = type || 'success';
  var colors = { success: 'bg-emerald-500', danger: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };
  var toastId = 'toast-' + Date.now();
  var toastHtml = '<div id="' + toastId + '" class="' + (colors[type] || 'bg-emerald-500') + ' text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in"><span>' + escapeHtml(message) + '</span><button onclick="this.parentElement.remove()" class="hover:bg-white/20 rounded p-1"><i class="fa-solid fa-xmark"></i></button></div>';
  container.insertAdjacentHTML('beforeend', toastHtml);
  setTimeout(function () {
    var toast = document.getElementById(toastId);
    if (toast) toast.remove();
  }, 3000);
}

function confirmDelete(itemName, callback) {
  if (confirm('Sei sicuro di voler eliminare "' + itemName + '"?')) callback();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

function sanitizeRedirect(url) {
  if (!url) return '/index.html';
  if (url.indexOf('/') === 0 && url.indexOf('//') !== 0 && url.indexOf('\\') === -1) return url;
  return '/index.html';
}
