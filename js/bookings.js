/* ==========================================
   StayEase - Booking Management
   Create, edit, cancel, delete, and filter bookings
   ========================================== */

let cachedBookings = [];
let cachedGuestsForBookings = [];
let cachedRoomsForBookings = [];

document.addEventListener('DOMContentLoaded', async function() {
    await fetchAndRenderBookings();
    document.getElementById('bookingSearch').addEventListener('input', renderBookings);
    document.getElementById('filterBookingStatus').addEventListener('change', renderBookings);
    document.getElementById('filterBookingRoom').addEventListener('change', renderBookings);
});

async function fetchAndRenderBookings() {
    cachedBookings = await getBookings();
    cachedGuestsForBookings = await getGuests();
    cachedRoomsForBookings = await getRooms();
    populateRoomFilter();
    renderBookings();
}

/** Populate the room filter dropdown. */
function populateRoomFilter() {
    var select = document.getElementById('filterBookingRoom');
    if (!select) return;
    
    // Clear existing options except first
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    for (var i = 0; i < cachedRoomsForBookings.length; i++) {
        var option = document.createElement('option');
        option.value = cachedRoomsForBookings[i].number;
        option.textContent = 'Room ' + cachedRoomsForBookings[i].number;
        select.appendChild(option);
    }
}

/** Display all bookings in a table. */
function renderBookings() {
    var bookings = cachedBookings;
    var guests = cachedGuestsForBookings;
    var rooms = cachedRoomsForBookings;
    var searchTerm = document.getElementById('bookingSearch').value.toLowerCase();
    var filterStatus = document.getElementById('filterBookingStatus').value;
    var filterRoom = document.getElementById('filterBookingRoom').value;

    var filtered = bookings.filter(function(booking) {
        var guest = guests.find(function(g) { return g.id === booking.guestId; });
        var guestName = guest ? guest.name.toLowerCase() : '';
        var matchesSearch = booking.id.toLowerCase().includes(searchTerm) ||
            guestName.includes(searchTerm) || booking.roomNumber.includes(searchTerm);
        var matchesStatus = filterStatus === '' || booking.status === filterStatus;
        var matchesRoom = filterRoom === '' || booking.roomNumber === filterRoom;
        return matchesSearch && matchesStatus && matchesRoom;
    });

    var tbody = document.getElementById('bookingsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-table">' +
            (bookings.length === 0 ? '📅 No bookings yet. Click <strong>New Booking</strong> to create one.'
            : '🔍 No bookings match your search/filter criteria.') + '</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var booking = filtered[i];
        var guest = guests.find(function(g) { return g.id === booking.guestId; });
        var room = rooms.find(function(r) { return r.number === booking.roomNumber; });
        var nights = calculateNights(booking.checkIn, booking.checkOut);
        var total = nights * (room ? room.price : 0);

        var actions = '<button class="btn btn-sm btn-secondary" onclick="showReceipt(\'' + booking.id + '\')" title="Receipt">🧾</button>';
        if (booking.status === 'Confirmed') {
            actions += '<button class="btn btn-sm btn-success" onclick="updateBookingStatus(\'' + booking.id + '\', \'Checked In\')" title="Check In">✅ In</button>' +
                '<button class="btn btn-sm btn-secondary" onclick="openEditBookingModal(\'' + booking.id + '\')" title="Edit">✏️</button>' +
                '<button class="btn btn-sm btn-warning" onclick="updateBookingStatus(\'' + booking.id + '\', \'Cancelled\')" title="Cancel">❌</button>';
        } else if (booking.status === 'Checked In') {
            actions += '<button class="btn btn-sm btn-accent" onclick="updateBookingStatus(\'' + booking.id + '\', \'Checked Out\')" title="Check Out">🚪 Out</button>';
        }

        html += '<tr><td><strong>' + booking.id + '</strong></td>' +
            '<td>' + (guest ? guest.name : 'Unknown') + '</td>' +
            '<td>Room ' + booking.roomNumber + '</td>' +
            '<td>' + formatDate(booking.checkIn) + '</td>' +
            '<td>' + formatDate(booking.checkOut) + '</td>' +
            '<td>' + nights + '</td>' +
            '<td>' + formatCurrency(total) + '</td>' +
            '<td><span class="badge badge-' + getStatusClass(booking.status) + '">' + booking.status + '</span></td>' +
            '<td class="table-actions">' + actions + '</td></tr>';
    }
    tbody.innerHTML = html;
}

/** Open the modal to create a new booking. */
function openNewBookingModal() {
    if (cachedGuestsForBookings.length === 0) { showToast('Please add at least one guest before creating a booking.', 'warning'); return; }
    if (cachedRoomsForBookings.length === 0) { showToast('Please add at least one room before creating a booking.', 'warning'); return; }
    openModal('Create New Booking', getBookingFormHtml(cachedGuestsForBookings, cachedRoomsForBookings, null), 'large');
}

/** Open the modal to edit an existing booking. */
function openEditBookingModal(bookingId) {
    var booking = cachedBookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    openModal('Edit Booking ' + bookingId, getBookingFormHtml(cachedGuestsForBookings, cachedRoomsForBookings, booking), 'large');
}

/** Generate the booking form HTML. */
function getBookingFormHtml(guests, rooms, booking) {
    var isEdit = booking !== null;
    var guestOptions = '';
    for (var i = 0; i < guests.length; i++) {
        var g = guests[i];
        guestOptions += '<option value="' + g.id + '"' + (booking && booking.guestId === g.id ? ' selected' : '') + '>' + g.name + ' (' + g.id + ')</option>';
    }
    var roomOptions = '';
    for (var j = 0; j < rooms.length; j++) {
        var r = rooms[j];
        var disabled = r.status === 'Maintenance' && !(booking && booking.roomNumber === r.number) ? ' disabled' : '';
        var statusNote = r.status === 'Maintenance' ? ' [Maintenance]' : '';
        roomOptions += '<option value="' + r.number + '"' + (booking && booking.roomNumber === r.number ? ' selected' : '') + disabled + '>Room ' + r.number + ' - ' + r.type + ' (' + formatCurrency(r.price) + '/night)' + statusNote + '</option>';
    }

    var today = new Date().toISOString().split('T')[0];
    var tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return '<form id="bookingForm" onsubmit="saveBooking(event, ' + (isEdit ? "'" + booking.id + "'" : 'null') + ')">' +
        '<div class="form-row"><div class="form-group"><label for="bookingGuest">Guest *</label>' +
        '<select id="bookingGuest" required><option value="">Select a guest...</option>' + guestOptions + '</select></div>' +
        '<div class="form-group"><label for="bookingRoom">Room *</label>' +
        '<select id="bookingRoom" required onchange="updateBookingCalc()"><option value="">Select a room...</option>' + roomOptions + '</select></div></div>' +
        '<div class="form-row"><div class="form-group"><label for="bookingCheckIn">Check-In Date *</label>' +
        '<input type="date" id="bookingCheckIn" required value="' + (booking ? booking.checkIn : today) + '" onchange="updateBookingCalc()"></div>' +
        '<div class="form-group"><label for="bookingCheckOut">Check-Out Date *</label>' +
        '<input type="date" id="bookingCheckOut" required value="' + (booking ? booking.checkOut : tomorrow) + '" onchange="updateBookingCalc()"></div></div>' +
        '<div class="form-group"><label for="bookingNumGuests">Number of Guests *</label>' +
        '<input type="number" id="bookingNumGuests" required min="1" value="' + (booking ? booking.numGuests : 1) + '"></div>' +
        '<div class="booking-summary" id="bookingSummary">' +
        '<div class="summary-row"><span>Nights:</span><span id="calcNights">—</span></div>' +
        '<div class="summary-row"><span>Price per Night:</span><span id="calcPrice">—</span></div>' +
        '<div class="summary-row"><span>Subtotal:</span><span id="calcSubtotal">—</span></div>' +
        '<div class="summary-row" style="color:var(--success)"><span>Discount (>3 nights):</span><span id="calcDiscount">—</span></div>' +
        '<div class="summary-row"><span>Tax (15%):</span><span id="calcTax">—</span></div>' +
        '<div class="summary-row summary-total"><span>Total Cost:</span><span id="calcTotal">—</span></div></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update Booking' : 'Confirm Booking') + '</button></div></form>' +
        '<script>updateBookingCalc();<\/script>';
}

/** Update the cost calculation display in the booking form. */
function updateBookingCalc() {
    var roomSel = document.getElementById('bookingRoom');
    var checkInEl = document.getElementById('bookingCheckIn');
    var checkOutEl = document.getElementById('bookingCheckOut');
    var calcNights = document.getElementById('calcNights');
    var calcPrice = document.getElementById('calcPrice');
    var calcSubtotal = document.getElementById('calcSubtotal');
    var calcDiscount = document.getElementById('calcDiscount');
    var calcTax = document.getElementById('calcTax');
    var calcTotal = document.getElementById('calcTotal');
    if (!calcNights || !roomSel || !checkInEl || !checkOutEl) return;

    var roomNumber = roomSel.value;
    var checkIn = checkInEl.value;
    var checkOut = checkOutEl.value;

    if (roomNumber && checkIn && checkOut) {
        var rooms = cachedRoomsForBookings;
        var room = rooms.find(function(r) { return r.number === roomNumber; });
        if (room) {
            var nights = calculateNights(checkIn, checkOut);
            var subtotal = nights * room.price;
            var discount = nights > 3 ? subtotal * 0.10 : 0;
            var tax = (subtotal - discount) * 0.15;
            var total = subtotal - discount + tax;
            calcNights.textContent = nights + (nights === 1 ? ' night' : ' nights');
            calcPrice.textContent = formatCurrency(room.price);
            if (calcSubtotal) calcSubtotal.textContent = formatCurrency(subtotal);
            if (calcDiscount) calcDiscount.textContent = '-' + formatCurrency(discount);
            if (calcTax) calcTax.textContent = formatCurrency(tax);
            calcTotal.textContent = formatCurrency(total);
            return;
        }
    }
    calcNights.textContent = '—';
    calcPrice.textContent = '—';
    if (calcSubtotal) calcSubtotal.textContent = '—';
    if (calcDiscount) calcDiscount.textContent = '—';
    if (calcTax) calcTax.textContent = '—';
    calcTotal.textContent = '—';
}

/** Save a new or edited booking. */
async function saveBooking(event, editingId) {
    event.preventDefault();
    var guestId = document.getElementById('bookingGuest').value;
    var roomNumber = document.getElementById('bookingRoom').value;
    var checkIn = document.getElementById('bookingCheckIn').value;
    var checkOut = document.getElementById('bookingCheckOut').value;
    var numGuests = parseInt(document.getElementById('bookingNumGuests').value);

    if (!guestId || !roomNumber || !checkIn || !checkOut || isNaN(numGuests)) {
        showToast('Please fill in all required fields.', 'error'); return;
    }
    
    var btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    var res = await apiFetch('/api/bookings.php', 'POST', {
        action: 'save',
        id: editingId,
        guestId: guestId,
        roomNumber: roomNumber,
        checkIn: checkIn,
        checkOut: checkOut,
        numGuests: numGuests
    });
    
    btn.disabled = false;
    
    if (res.success) {
        showToast('Booking saved successfully!', 'success');
        closeModal();
        await fetchAndRenderBookings();
    } else {
        showToast(res.error || 'Failed to save booking.', 'error');
    }
}

/** Update a booking's status. */
async function updateBookingStatus(bookingId, newStatus) {
    var label = newStatus === 'Checked In' ? 'check in this guest' : (newStatus === 'Checked Out' ? 'check out this guest' : 'cancel this booking');
    if (!confirm('Are you sure you want to ' + label + '?')) return;

    var res = await apiFetch('/api/bookings.php', 'POST', {
        action: 'status',
        id: bookingId,
        status: newStatus
    });

    if (res.success) {
        showToast('Booking status updated to "' + newStatus + '".', 'success');
        await fetchAndRenderBookings();
    } else {
        showToast(res.error || 'Failed to update status.', 'error');
    }
}

/** Show a receipt/confirmation for a booking. */
function showReceipt(bookingId) {
    var booking = cachedBookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    var guest = cachedGuestsForBookings.find(function(g) { return g.id === booking.guestId; });
    var room = cachedRoomsForBookings.find(function(r) { return r.number === booking.roomNumber; });
    var nights = calculateNights(booking.checkIn, booking.checkOut);
    var pricePerNight = room ? room.price : 0;
    var subtotal = nights * pricePerNight;
    var discount = nights > 3 ? subtotal * 0.10 : 0;
    var tax = (subtotal - discount) * 0.15;
    var total = subtotal - discount + tax;

    var html = '<div class="receipt" id="receiptContent">' +
        '<div class="receipt-header"><h2>🏨 Shipiki Hotels</h2><p>Booking Confirmation Receipt</p></div>' +
        '<div class="receipt-section"><h4>Booking Information</h4>' +
        '<div class="receipt-row"><span>Booking ID:</span><strong>' + booking.id + '</strong></div>' +
        '<div class="receipt-row"><span>Status:</span><span class="badge badge-' + getStatusClass(booking.status) + '">' + booking.status + '</span></div></div>' +
        '<div class="receipt-section"><h4>Guest Details</h4>' +
        '<div class="receipt-row"><span>Name:</span><span>' + (guest ? guest.name : 'Unknown') + '</span></div>' +
        '<div class="receipt-row"><span>Email:</span><span>' + (guest ? guest.email : '—') + '</span></div></div>' +
        '<div class="receipt-section"><h4>Room Details</h4>' +
        '<div class="receipt-row"><span>Room:</span><span>Room ' + booking.roomNumber + ' (' + (room ? room.type : '—') + ')</span></div>' +
        '<div class="receipt-row"><span>Guests:</span><span>' + booking.numGuests + '</span></div></div>' +
        '<div class="receipt-section"><h4>Stay Details</h4>' +
        '<div class="receipt-row"><span>Check-In:</span><span>' + formatDate(booking.checkIn) + '</span></div>' +
        '<div class="receipt-row"><span>Check-Out:</span><span>' + formatDate(booking.checkOut) + '</span></div>' +
        '<div class="receipt-row"><span>Number of Nights:</span><span>' + nights + '</span></div></div>' +
        '<div class="receipt-section receipt-total">' +
        '<div class="receipt-row"><span>Price per Night:</span><span>' + formatCurrency(pricePerNight) + '</span></div>' +
        '<div class="receipt-row"><span>Subtotal:</span><span>' + formatCurrency(subtotal) + '</span></div>' +
        '<div class="receipt-row" style="color:var(--success)"><span>Discount (>3 nights):</span><span>-' + formatCurrency(discount) + '</span></div>' +
        '<div class="receipt-row"><span>Tax (15%):</span><span>' + formatCurrency(tax) + '</span></div>' +
        '<div class="receipt-row total-row"><span>Total Cost:</span><strong>' + formatCurrency(total) + '</strong></div></div>' +
        '<div class="receipt-footer"><p>Thank you for choosing Shipiki Hotels!</p></div></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>' +
        '<button type="button" class="btn btn-primary" onclick="printReceipt()">🖨️ Print Receipt</button></div>';

    openModal('Booking Receipt', html, 'medium');
}

/** Print the receipt using a new browser window. */
function printReceipt() {
    var content = document.getElementById('receiptContent');
    if (!content) return;
    var printWindow = window.open('', '_blank');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Book with Shipiki - Receipt</title>' +
        '<style>body{font-family:Inter,Arial,sans-serif;padding:40px;color:#2d3748}' +
        '.receipt-header{text-align:center;margin-bottom:30px;border-bottom:2px solid #16a596;padding-bottom:15px}' +
        '.receipt-header h2{color:#1a1a2e;margin:0;font-size:24px}.receipt-header p{color:#718096;margin:5px 0 0}' +
        '.receipt-section{margin-bottom:20px}.receipt-section h4{color:#16a596;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px}' +
        '.receipt-row{display:flex;justify-content:space-between;padding:4px 0}' +
        '.receipt-total{border-top:2px solid #1a1a2e;padding-top:15px;margin-top:20px}' +
        '.total-row{font-size:18px;color:#1a1a2e}.receipt-footer{text-align:center;margin-top:30px;color:#718096;font-style:italic}' +
        '.badge{padding:2px 8px;border-radius:4px;font-size:12px}' +
        '.badge-info{background:#bee3f8;color:#2b6cb0}.badge-success{background:#c6f6d5;color:#276749}' +
        '.badge-warning{background:#fefcbf;color:#744210}.badge-danger{background:#fed7d7;color:#9b2c2c}</style>' +
        '</head><body>' + content.innerHTML + '</body></html>');
    printWindow.document.close();
    printWindow.print();
}
