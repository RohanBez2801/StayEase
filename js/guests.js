/* ==========================================
   StayEase - Guest Management
   Add, edit, view, delete, and search guests
   ========================================== */

let cachedGuests = [];

document.addEventListener('DOMContentLoaded', async function() {
    await fetchAndRenderGuests();
    document.getElementById('guestSearch').addEventListener('input', renderGuests);
});

async function fetchAndRenderGuests() {
    cachedGuests = await getGuests();
    renderGuests();
}

/** Display all guests in a table with search filtering. */
function renderGuests() {
    var guests = cachedGuests;
    var searchTerm = document.getElementById('guestSearch').value.toLowerCase();

    var filtered = guests.filter(function(guest) {
        return guest.id.toLowerCase().includes(searchTerm) ||
            guest.name.toLowerCase().includes(searchTerm) ||
            guest.email.toLowerCase().includes(searchTerm) ||
            guest.phone.includes(searchTerm);
    });

    var tbody = document.getElementById('guestsTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-table">' +
            (guests.length === 0 ? '👥 No guests yet. Click <strong>Add Guest</strong> to add your first guest.'
            : '🔍 No guests match your search.') + '</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var guest = filtered[i];
        html += '<tr><td><strong>' + guest.id + '</strong></td>' +
            '<td>' + guest.name + '</td><td>' + guest.phone + '</td>' +
            '<td>' + guest.email + '</td><td>' + (guest.idNumber || 'N/A') + '</td>' +
            '<td class="table-actions">' +
            '<button class="btn btn-sm btn-secondary" onclick="viewGuest(\'' + guest.id + '\')" title="View">👁️</button>' +
            '<button class="btn btn-sm btn-secondary" onclick="openEditGuestModal(\'' + guest.id + '\')" title="Edit">✏️</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteGuest(\'' + guest.id + '\')" title="Delete">🗑️</button>' +
            '</td></tr>';
    }
    tbody.innerHTML = html;
}

/** Open the modal to add a new guest. */
function openAddGuestModal() {
    openModal('Add New Guest', getGuestFormHtml(null));
}

/** Open the modal to edit an existing guest. */
function openEditGuestModal(guestId) {
    var guest = cachedGuests.find(function(g) { return g.id === guestId; });
    if (!guest) return;
    openModal('Edit Guest', getGuestFormHtml(guest));
}

/** Generate the HTML form for adding/editing a guest. */
function getGuestFormHtml(guest) {
    var isEdit = guest !== null;
    return '<form id="guestForm" onsubmit="saveGuest(event, ' + (isEdit ? "'" + guest.id + "'" : 'null') + ')">' +
        '<div class="form-group"><label for="guestName">Full Name *</label>' +
        '<input type="text" id="guestName" value="' + (guest ? guest.name : '') + '" required placeholder="e.g. John Smith"></div>' +
        '<div class="form-row"><div class="form-group"><label for="guestPhone">Phone Number *</label>' +
        '<input type="tel" id="guestPhone" value="' + (guest ? guest.phone : '') + '" required placeholder="e.g. 071 234 5678"></div>' +
        '<div class="form-group"><label for="guestEmail">Email Address *</label>' +
        '<input type="email" id="guestEmail" value="' + (guest ? guest.email : '') + '" required placeholder="e.g. john@email.com"></div></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save Changes' : 'Add Guest') + '</button></div></form>';
}

/** Save a new or edited guest. */
async function saveGuest(event, editingId) {
    event.preventDefault();
    var name = document.getElementById('guestName').value.trim();
    var phone = document.getElementById('guestPhone').value.trim();
    var email = document.getElementById('guestEmail').value.trim();

    if (!name || !phone || !email) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    var btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    var res = await apiFetch('/api/guests.php', 'POST', {
        action: 'save',
        id: editingId,
        name: name,
        phone: phone,
        email: email
    });

    btn.disabled = false;

    if (res.success) {
        showToast('Guest saved successfully!', 'success');
        closeModal();
        await fetchAndRenderGuests();
    } else {
        showToast(res.error || 'Failed to save guest.', 'error');
    }
}

/** View a guest's details and booking history in a modal. */
async function viewGuest(guestId) {
    var guest = cachedGuests.find(function(g) { return g.id === guestId; });
    if (!guest) return;

    var allBookings = await getBookings();
    var bookings = allBookings.filter(function(b) { return b.guestId === guestId; });
    var rooms = await getRooms();

    var bookingRows = '';
    if (bookings.length === 0) {
        bookingRows = '<tr><td colspan="5" class="empty-table">No bookings found for this guest.</td></tr>';
    } else {
        for (var i = 0; i < bookings.length; i++) {
            var b = bookings[i];
            var room = rooms.find(function(r) { return r.number === b.roomNumber; });
            var nights = calculateNights(b.checkIn, b.checkOut);
            var total = nights * (room ? room.price : 0);
            bookingRows += '<tr><td>' + b.id + '</td><td>Room ' + b.roomNumber + '</td>' +
                '<td>' + formatDate(b.checkIn) + ' — ' + formatDate(b.checkOut) + '</td>' +
                '<td>' + formatCurrency(total) + '</td>' +
                '<td><span class="badge badge-' + getStatusClass(b.status) + '">' + b.status + '</span></td></tr>';
        }
    }

    var html = '<div class="guest-details"><div class="detail-grid">' +
        '<div class="detail-item"><span class="detail-label">Guest ID</span><span class="detail-value">' + guest.id + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">' + guest.name + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">' + guest.phone + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">' + guest.email + '</span></div>' +
        '</div>' +
        '<h3 style="margin-top:1.5rem;margin-bottom:0.75rem;">Booking History</h3>' +
        '<div class="table-responsive"><table class="data-table"><thead><tr>' +
        '<th>Booking</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>' +
        '<tbody>' + bookingRows + '</tbody></table></div></div>';

    openModal('Guest Details — ' + guest.name, html, 'large');
}

/** Delete a guest after confirmation. */
async function deleteGuest(guestId) {
    if (confirm('Are you sure you want to delete this guest?')) {
        var res = await apiFetch('/api/guests.php', 'DELETE', { id: guestId });
        if (res.success) {
            showToast('Guest deleted.', 'success');
            await fetchAndRenderGuests();
        } else {
            showToast(res.error || 'Failed to delete guest.', 'error');
        }
    }
}
