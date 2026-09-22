/* ==========================================
   StayEase - Booking Management
   Create, edit, cancel, delete, and filter bookings
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    populateRoomFilter();
    renderBookings();
    document.getElementById('bookingSearch').addEventListener('input', renderBookings);
    document.getElementById('filterBookingStatus').addEventListener('change', renderBookings);
    document.getElementById('filterBookingRoom').addEventListener('change', renderBookings);
});

/** Populate the room filter dropdown. */
function populateRoomFilter() {
    var rooms = getRooms();
    var select = document.getElementById('filterBookingRoom');
    for (var i = 0; i < rooms.length; i++) {
        var option = document.createElement('option');
        option.value = rooms[i].number;
        option.textContent = 'Room ' + rooms[i].number;
        select.appendChild(option);
    }
}

/** Display all bookings in a table. */
function renderBookings() {
    var bookings = getBookings();
    var guests = getGuests();
    var rooms = getRooms();
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

    filtered.sort(function(a, b) { return new Date(b.checkIn) - new Date(a.checkIn); });

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
                '<button class="btn btn-sm btn-warning" onclick="cancelBooking(\'' + booking.id + '\')" title="Cancel">❌</button>';
        } else if (booking.status === 'Checked In') {
            actions += '<button class="btn btn-sm btn-accent" onclick="updateBookingStatus(\'' + booking.id + '\', \'Checked Out\')" title="Check Out">🚪 Out</button>';
        } else {
            actions += '<button class="btn btn-sm btn-danger" onclick="deleteBooking(\'' + booking.id + '\')" title="Delete">🗑️</button>';
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
    var guests = getGuests();
    var rooms = getRooms();
    if (guests.length === 0) { showToast('Please add at least one guest before creating a booking.', 'warning'); return; }
    if (rooms.length === 0) { showToast('Please add at least one room before creating a booking.', 'warning'); return; }
    openModal('Create New Booking', getBookingFormHtml(guests, rooms, null), 'large');
}

/** Open the modal to edit an existing booking. */
function openEditBookingModal(bookingId) {
    var bookings = getBookings();
    var booking = bookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    openModal('Edit Booking ' + bookingId, getBookingFormHtml(getGuests(), getRooms(), booking), 'large');
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
        var statusNote = r.status !== 'Available' ? ' [' + r.status + ']' : '';
        var disabled = r.status === 'Maintenance' && !(booking && booking.roomNumber === r.number) ? ' disabled' : '';
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
        '<input type="number" id="bookingNumGuests" required min="1" value="' + (booking ? booking.numGuests : 1) + '" placeholder="e.g. 2"></div>' +
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
        var rooms = getRooms();
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
function saveBooking(event, editingId) {
    event.preventDefault();
    var guestId = document.getElementById('bookingGuest').value;
    var roomNumber = document.getElementById('bookingRoom').value;
    var checkIn = document.getElementById('bookingCheckIn').value;
    var checkOut = document.getElementById('bookingCheckOut').value;
    var numGuests = parseInt(document.getElementById('bookingNumGuests').value);

    if (!guestId || !roomNumber || !checkIn || !checkOut || isNaN(numGuests)) {
        showToast('Please fill in all required fields.', 'error'); return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
        showToast('Check-out date must be after the check-in date.', 'error'); return;
    }
    var rooms = getRooms();
    var room = rooms.find(function(r) { return r.number === roomNumber; });
    if (room && numGuests > room.capacity) {
        showToast('Number of guests (' + numGuests + ') exceeds room capacity (' + room.capacity + ').', 'error'); return;
    }
    if (room && room.status === 'Maintenance' && !editingId) {
        showToast('Room ' + roomNumber + ' is currently under maintenance.', 'error'); return;
    }
    if (hasDateOverlap(roomNumber, checkIn, checkOut, editingId)) {
        showToast('Room ' + roomNumber + ' is already booked for these dates. Please choose different dates.', 'error'); return;
    }

    var bookings = getBookings();
    if (editingId) {
        for (var i = 0; i < bookings.length; i++) {
            if (bookings[i].id === editingId) {
                var oldRoom = bookings[i].roomNumber;
                bookings[i].guestId = guestId;
                bookings[i].roomNumber = roomNumber;
                bookings[i].checkIn = checkIn;
                bookings[i].checkOut = checkOut;
                bookings[i].numGuests = numGuests;
                saveBookings(bookings);
                if (oldRoom !== roomNumber && !roomHasActiveBookings(oldRoom)) {
                    updateRoomStatus(oldRoom, 'Available');
                }
                updateRoomStatus(roomNumber, 'Booked');
                showToast('Booking ' + editingId + ' updated successfully!', 'success');
                break;
            }
        }
        closeModal();
        renderBookings();
    } else {
        window.tempBookingData = { guestId: guestId, roomNumber: roomNumber, checkIn: checkIn, checkOut: checkOut, numGuests: numGuests };
        showPaymentModal();
    }
}

/** Show mock payment screen before finalizing a new booking. */
function showPaymentModal() {
    var html = '<div class="payment-modal">' +
        '<div class="alert alert-warning" style="background:#fefcbf; color:#744210; padding:15px; margin-bottom:20px; border-radius:4px;">' +
        '<strong>Demo Payment Only</strong> — No Real Payment Is Processed.' +
        '</div>' +
        '<div class="form-group"><label>Name on Card *</label><input type="text" id="payName" value="Shipiki Guest" required></div>' +
        '<div class="form-group"><label>Card Number *</label><input type="text" id="payCard" value="4111 1111 1111 1111" required></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Expiry Date *</label><input type="text" id="payExp" value="12/28" required></div>' +
        '<div class="form-group"><label>CVV *</label><input type="text" id="payCvv" value="123" required></div>' +
        '</div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel Booking</button>' +
        '<button type="button" class="btn btn-primary" onclick="processMockPayment()">Pay & Confirm</button></div>' +
        '</div>';
    openModal('Secure Checkout', html, 'medium');
}

/** Process the mock payment and finalize booking. */
function processMockPayment() {
    var payName = document.getElementById('payName').value.trim();
    var payCard = document.getElementById('payCard').value.trim();
    if (!payName || !payCard) {
        showToast('Please fill in card details.', 'error');
        return;
    }
    showToast('Payment Processed Successfully (Mock).', 'success');
    
    var data = window.tempBookingData;
    var bookings = getBookings();
    var newId = generateId('BK', bookings);
    bookings.push({ id: newId, guestId: data.guestId, roomNumber: data.roomNumber, checkIn: data.checkIn, checkOut: data.checkOut, numGuests: data.numGuests, status: 'Confirmed' });
    saveBookings(bookings);
    updateRoomStatus(data.roomNumber, 'Booked');
    closeModal();
    showReceipt(newId);
    renderBookings();
}

/** Update a booking's status. */
function updateBookingStatus(bookingId, newStatus) {
    var label = newStatus === 'Checked In' ? 'check in this guest' : 'check out this guest';
    if (!confirm('Are you sure you want to ' + label + '?')) return;

    var bookings = getBookings();
    var booking = bookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    booking.status = newStatus;
    saveBookings(bookings);

    if (newStatus === 'Checked Out') {
        var otherActive = bookings.some(function(b) {
            return b.id !== bookingId && b.roomNumber === booking.roomNumber &&
                (b.status === 'Confirmed' || b.status === 'Checked In');
        });
        if (!otherActive) updateRoomStatus(booking.roomNumber, 'Available');
    }
    showToast('Booking ' + bookingId + ' status updated to "' + newStatus + '".', 'success');
    renderBookings();
}

/** Cancel a booking. */
function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? The room will become available again.')) return;
    var bookings = getBookings();
    var booking = bookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    booking.status = 'Cancelled';
    saveBookings(bookings);
    var otherActive = bookings.some(function(b) {
        return b.id !== bookingId && b.roomNumber === booking.roomNumber &&
            (b.status === 'Confirmed' || b.status === 'Checked In');
    });
    if (!otherActive) updateRoomStatus(booking.roomNumber, 'Available');
    showToast('Booking ' + bookingId + ' has been cancelled.', 'warning');
    renderBookings();
}

/** Delete a booking permanently. */
function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to permanently delete this booking? This cannot be undone.')) return;
    var bookings = getBookings().filter(function(b) { return b.id !== bookingId; });
    saveBookings(bookings);
    showToast('Booking deleted.', 'success');
    renderBookings();
}

/** Show a receipt/confirmation for a booking. */
function showReceipt(bookingId) {
    var bookings = getBookings();
    var booking = bookings.find(function(b) { return b.id === bookingId; });
    if (!booking) return;
    var guest = getGuests().find(function(g) { return g.id === booking.guestId; });
    var room = getRooms().find(function(r) { return r.number === booking.roomNumber; });
    var nights = calculateNights(booking.checkIn, booking.checkOut);
    var pricePerNight = room ? room.price : 0;
    var subtotal = nights * pricePerNight;
    var discount = nights > 3 ? subtotal * 0.10 : 0;
    var tax = (subtotal - discount) * 0.15;
    var total = subtotal - discount + tax;

    var html = '<div class="receipt" id="receiptContent">' +
        '<div class="receipt-header"><h2>🏨 Shipiki Hotels</h2><p>Prototype Booking Confirmation (Not a Real Email)</p></div>' +
        '<div class="receipt-section"><h4>Booking Information</h4>' +
        '<div class="receipt-row"><span>Booking ID:</span><strong>' + booking.id + '</strong></div>' +
        '<div class="receipt-row"><span>Status:</span><span class="badge badge-' + getStatusClass(booking.status) + '">' + booking.status + '</span></div></div>' +
        '<div class="receipt-section"><h4>Guest Details</h4>' +
        '<div class="receipt-row"><span>Name:</span><span>' + (guest ? guest.name : 'Unknown') + '</span></div>' +
        '<div class="receipt-row"><span>Phone:</span><span>' + (guest ? guest.phone : '—') + '</span></div>' +
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
        '<div class="receipt-footer"><p>Thank you for choosing Shipiki Hotels! (Demo Only)</p></div></div>' +
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

/** Open the Search Available Rooms modal. */
function openSearchRoomsModal() {
    var today = new Date().toISOString().split('T')[0];
    var tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    var html = '<div class="form-row">' +
        '<div class="form-group"><label>Check-In Date</label><input type="date" id="searchIn" value="' + today + '"></div>' +
        '<div class="form-group"><label>Check-Out Date</label><input type="date" id="searchOut" value="' + tomorrow + '"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Number of Guests</label><input type="number" id="searchGuests" value="1" min="1"></div>' +
        '<div class="form-group"><label>City / Branch</label><input type="text" id="searchBranch" placeholder="e.g. Cape Town"></div>' +
        '</div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>' +
        '<button type="button" class="btn btn-primary" onclick="performRoomSearch()">Search</button></div>' +
        '<div id="searchResults" style="margin-top:20px;"></div>';
    openModal('Search Available Rooms', html, 'medium');
}

/** Perform the room search based on modal inputs. */
function performRoomSearch() {
    var checkIn = document.getElementById('searchIn').value;
    var checkOut = document.getElementById('searchOut').value;
    var guests = parseInt(document.getElementById('searchGuests').value) || 1;
    var branch = document.getElementById('searchBranch').value.toLowerCase().trim();
    var resultsDiv = document.getElementById('searchResults');
    
    if (new Date(checkOut) <= new Date(checkIn)) {
        resultsDiv.innerHTML = '<p style="color:var(--danger)">Check-out date must be after check-in date.</p>';
        return;
    }
    
    var rooms = getRooms();
    var available = rooms.filter(function(r) {
        if (r.status === 'Maintenance') return false;
        if (r.capacity < guests) return false;
        if (branch && (!r.branch || !r.branch.toLowerCase().includes(branch))) return false;
        if (hasDateOverlap(r.number, checkIn, checkOut, null)) return false;
        return true;
    });
    
    if (available.length === 0) {
        resultsDiv.innerHTML = '<p>No available rooms found for these criteria.</p>';
        return;
    }
    
    var resHtml = '<h4>Available Rooms (' + available.length + ')</h4><ul style="padding:0; list-style:none;">';
    for (var i=0; i<available.length; i++) {
        resHtml += '<li style="margin-bottom:10px; padding:10px; border:1px solid #e2e8f0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; background:#fff;">' +
                   '<div><strong>Room ' + available[i].number + ' (' + available[i].type + ')</strong><br>' +
                   '<small style="color:#718096;">' + (available[i].branch || 'Unknown') + ' - ' + formatCurrency(available[i].price) + ' / night</small></div>' +
                   '<button class="btn btn-sm btn-primary" onclick="bookFromSearch(\'' + available[i].number + '\', \'' + checkIn + '\', \'' + checkOut + '\', ' + guests + ')">Book</button>' +
                   '</li>';
    }
    resHtml += '</ul>';
    resultsDiv.innerHTML = resHtml;
}

/** Open booking modal pre-filled from search. */
function bookFromSearch(roomNumber, checkIn, checkOut, guestsCount) {
    closeModal();
    openNewBookingModal();
    setTimeout(function() {
        var roomEl = document.getElementById('bookingRoom');
        var checkInEl = document.getElementById('bookingCheckIn');
        var checkOutEl = document.getElementById('bookingCheckOut');
        var guestsEl = document.getElementById('bookingNumGuests');
        
        if (roomEl) roomEl.value = roomNumber;
        if (checkInEl) checkInEl.value = checkIn;
        if (checkOutEl) checkOutEl.value = checkOut;
        if (guestsEl) guestsEl.value = guestsCount;
        
        updateBookingCalc();
    }, 150);
}

/** Open the Guest Lookup modal. */
function openGuestLookupModal() {
    var html = '<p style="margin-bottom:15px; color:#718096;">Enter your booking reference and email address to view your confirmation receipt.</p>' +
        '<div class="form-group"><label>Booking Reference (e.g. BK-001) *</label><input type="text" id="lookupId" required></div>' +
        '<div class="form-group"><label>Email Address *</label><input type="email" id="lookupEmail" required></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button type="button" class="btn btn-primary" onclick="performGuestLookup()">Find My Booking</button></div>';
    openModal('Find My Booking', html, 'small');
}

/** Perform the lookup. */
function performGuestLookup() {
    var id = document.getElementById('lookupId').value.trim().toUpperCase();
    var email = document.getElementById('lookupEmail').value.trim().toLowerCase();
    
    if (!id || !email) {
        showToast('Please enter both booking reference and email.', 'warning'); return;
    }
    
    var bookings = getBookings();
    var guests = getGuests();
    
    var booking = bookings.find(function(b) { return b.id === id; });
    if (!booking) {
        showToast('Booking not found. Please check your reference number.', 'error'); return;
    }
    var guest = guests.find(function(g) { return g.id === booking.guestId; });
    if (!guest || guest.email.toLowerCase() !== email) {
        showToast('Booking found, but the email address does not match.', 'error'); return;
    }
    closeModal();
    showReceipt(booking.id);
}
