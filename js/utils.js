/* ==========================================
   StayEase - Utility Functions
   Shared helper functions used across all pages
   ========================================== */

// --- Currency Formatting ---
/** Format a number as South African Rand currency. */
function formatCurrency(amount) {
    return 'R ' + Number(amount).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// --- Date Formatting ---
/** Format a date string (YYYY-MM-DD) into a readable format like "18 Sep 2026". */
function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    var options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-ZA', options);
}

// --- Night Calculation ---
/** Calculate the number of nights between two dates. */
function calculateNights(checkIn, checkOut) {
    var start = new Date(checkIn);
    var end = new Date(checkOut);
    var diffTime = end.getTime() - start.getTime();
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

// --- Validation ---
/** Check if an email address is in a valid format. */
function validateEmail(email) {
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/** Check if a value is not empty (after trimming whitespace). */
function isNotEmpty(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

// --- Toast Notifications ---
/** Show a temporary notification message at the top-right of the screen. */
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

    toast.innerHTML =
        '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
        '<span class="toast-message">' + message + '</span>';

    container.appendChild(toast);

    // Trigger slide-in animation
    setTimeout(function() { toast.classList.add('show'); }, 10);

    // Remove after 4 seconds
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

// --- Modal System ---
/** Open the modal dialog with a title and HTML content. */
function openModal(title, bodyHtml, size) {
    size = size || 'medium';
    var overlay = document.getElementById('modalOverlay');
    var modal = document.getElementById('modal');
    var modalTitle = document.getElementById('modalTitle');
    var modalBody = document.getElementById('modalBody');

    if (!overlay || !modal) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.className = 'modal modal-' + size;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/** Close the modal dialog. */
function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside or pressing Escape
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'modalOverlay') { closeModal(); }
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeModal(); }
});

// --- Navigation ---
/** Highlight the current page link in the sidebar navigation. */
function setActiveNav() {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';

    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('active');
        var href = links[i].getAttribute('href');
        if (href === filename || (filename === '' && href === 'index.html')) {
            links[i].classList.add('active');
        }
    }
}

/** Toggle the mobile sidebar menu open or closed. */
function toggleMobileMenu() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

// --- Overlap Detection ---
/**
 * Check if a room has any overlapping bookings for the given dates.
 * Two date ranges overlap if: start1 < end2 AND start2 < end1
 */
function hasDateOverlap(roomNumber, checkIn, checkOut, excludeBookingId) {
    var bookings = getBookings();

    for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        if (booking.id === excludeBookingId) continue;
        if (booking.roomNumber !== roomNumber) continue;
        if (booking.status === 'Cancelled' || booking.status === 'Checked Out') continue;

        var existStart = new Date(booking.checkIn);
        var existEnd = new Date(booking.checkOut);
        var newStart = new Date(checkIn);
        var newEnd = new Date(checkOut);

        if (newStart < existEnd && existStart < newEnd) {
            return true;
        }
    }
    return false;
}

/** Update a room's status in localStorage. */
function updateRoomStatus(roomNumber, newStatus) {
    var rooms = getRooms();
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].number === roomNumber) {
            rooms[i].status = newStatus;
            break;
        }
    }
    saveRooms(rooms);
}

/** Check if a room has any active (non-cancelled, non-checked-out) bookings. */
function roomHasActiveBookings(roomNumber) {
    var bookings = getBookings();
    for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].roomNumber === roomNumber &&
            bookings[i].status !== 'Cancelled' &&
            bookings[i].status !== 'Checked Out') {
            return true;
        }
    }
    return false;
}

// --- Get status badge CSS class ---
function getStatusClass(status) {
    switch (status) {
        case 'Confirmed': return 'info';
        case 'Checked In': return 'success';
        case 'Checked Out': return 'warning';
        case 'Cancelled': return 'danger';
        case 'Available': return 'success';
        case 'Booked': return 'info';
        case 'Maintenance': return 'warning';
        default: return 'info';
    }
}

// Initialise navigation highlighting on page load
document.addEventListener('DOMContentLoaded', function() {
    setActiveNav();
});
