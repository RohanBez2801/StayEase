/* ==========================================
   StayEase - Dashboard Page
   Shows summary statistics and recent bookings
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

/** Load all dashboard data and update the display. */
function loadDashboard() {
    var rooms = getRooms();
    var guests = getGuests();
    var bookings = getBookings();

    document.getElementById('totalRooms').textContent = rooms.length;
    document.getElementById('availableRooms').textContent =
        rooms.filter(function(r) { return r.status === 'Available'; }).length;
    document.getElementById('totalBookings').textContent = bookings.length;
    document.getElementById('checkedInGuests').textContent =
        bookings.filter(function(b) { return b.status === 'Checked In'; }).length;

    renderRecentBookings(bookings, guests, rooms);
}

/** Display the 5 most recent bookings in a table. */
function renderRecentBookings(bookings, guests, rooms) {
    var tbody = document.getElementById('recentBookingsBody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-table">No bookings yet. <a href="bookings.html">Create your first booking</a>.</td></tr>';
        return;
    }

    var recent = bookings.slice().sort(function(a, b) {
        return new Date(b.checkIn) - new Date(a.checkIn);
    }).slice(0, 5);

    var html = '';
    for (var i = 0; i < recent.length; i++) {
        var booking = recent[i];
        var guest = guests.find(function(g) { return g.id === booking.guestId; });
        var room = rooms.find(function(r) { return r.number === booking.roomNumber; });
        var nights = calculateNights(booking.checkIn, booking.checkOut);
        var total = nights * (room ? room.price : 0);

        html += '<tr>' +
            '<td>' + booking.id + '</td>' +
            '<td>' + (guest ? guest.name : 'Unknown') + '</td>' +
            '<td>Room ' + booking.roomNumber + '</td>' +
            '<td>' + formatDate(booking.checkIn) + '</td>' +
            '<td>' + formatCurrency(total) + '</td>' +
            '<td><span class="badge badge-' + getStatusClass(booking.status) + '">' + booking.status + '</span></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}
