/* ==========================================
   StayEase - Reports & Analytics
   Display statistics, charts, and export data
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    loadReports();
});

/** Load and display all report data. */
function loadReports() {
    var bookings = getBookings();
    var rooms = getRooms();
    var guests = getGuests();

    var activeBookings = bookings.filter(function(b) { return b.status !== 'Cancelled'; });
    var totalIncome = 0;
    for (var i = 0; i < activeBookings.length; i++) {
        var room = rooms.find(function(r) { return r.number === activeBookings[i].roomNumber; });
        if (room) {
            totalIncome += calculateNights(activeBookings[i].checkIn, activeBookings[i].checkOut) * room.price;
        }
    }

    var availableRooms = rooms.filter(function(r) { return r.status === 'Available'; }).length;
    var bookedRooms = rooms.filter(function(r) { return r.status === 'Booked'; }).length;
    var maintenanceRooms = rooms.filter(function(r) { return r.status === 'Maintenance'; }).length;
    var occupancyRate = rooms.length > 0 ? Math.round((bookedRooms / rooms.length) * 100) : 0;

    document.getElementById('reportTotalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('reportTotalBookings').textContent = activeBookings.length;
    document.getElementById('reportOccupancyRate').textContent = occupancyRate + '%';
    document.getElementById('reportTotalGuests').textContent = guests.length;

    renderRoomStatusChart(availableRooms, bookedRooms, maintenanceRooms, rooms.length);
    renderBookingStatusChart(bookings);
    renderBookingTimeline(bookings, guests, rooms);
    renderReportTable(bookings, guests, rooms);
}

/** Render a horizontal bar chart showing room occupancy. */
function renderRoomStatusChart(available, booked, maintenance, total) {
    var container = document.getElementById('roomStatusChart');
    if (!container || total === 0) return;
    var availPct = Math.round((available / total) * 100);
    var bookedPct = Math.round((booked / total) * 100);
    var maintPct = Math.round((maintenance / total) * 100);

    container.innerHTML = '<div class="chart-bar-group">' +
        '<div class="chart-bar-item"><div class="chart-bar-label"><span class="chart-dot" style="background:var(--success)"></span>Available (' + available + ')</div>' +
        '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + availPct + '%;background:var(--success)">' + availPct + '%</div></div></div>' +
        '<div class="chart-bar-item"><div class="chart-bar-label"><span class="chart-dot" style="background:var(--info)"></span>Booked (' + booked + ')</div>' +
        '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + bookedPct + '%;background:var(--info)">' + (bookedPct > 5 ? bookedPct + '%' : '') + '</div></div></div>' +
        '<div class="chart-bar-item"><div class="chart-bar-label"><span class="chart-dot" style="background:var(--warning)"></span>Maintenance (' + maintenance + ')</div>' +
        '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + maintPct + '%;background:var(--warning)">' + (maintPct > 5 ? maintPct + '%' : '') + '</div></div></div></div>';
}

/** Render a visual breakdown of booking statuses. */
function renderBookingStatusChart(bookings) {
    var container = document.getElementById('bookingStatusChart');
    if (!container) return;
    var counts = { 'Confirmed': 0, 'Checked In': 0, 'Checked Out': 0, 'Cancelled': 0 };
    for (var i = 0; i < bookings.length; i++) {
        if (counts.hasOwnProperty(bookings[i].status)) counts[bookings[i].status]++;
    }
    var total = bookings.length;
    if (total === 0) { container.innerHTML = '<p class="text-muted">No booking data to display.</p>'; return; }

    var colors = { 'Confirmed': 'var(--info)', 'Checked In': 'var(--success)', 'Checked Out': 'var(--warning)', 'Cancelled': 'var(--danger)' };
    var segments = '';
    var legend = '';
    var statuses = ['Confirmed', 'Checked In', 'Checked Out', 'Cancelled'];
    for (var j = 0; j < statuses.length; j++) {
        var status = statuses[j];
        var count = counts[status];
        if (count > 0) {
            var pct = Math.round((count / total) * 100);
            segments += '<div class="stacked-segment" style="width:' + pct + '%;background:' + colors[status] + '" title="' + status + ': ' + count + '"></div>';
        }
        legend += '<div class="chart-legend-item"><span class="chart-dot" style="background:' + colors[status] + '"></span>' + status + ': <strong>' + count + '</strong></div>';
    }

    container.innerHTML = '<div class="stacked-bar">' + segments + '</div><div class="chart-legend">' + legend + '</div>';
}

/** Render the full bookings report table. */
function renderReportTable(bookings, guests, rooms) {
    var tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    if (bookings.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-table">No bookings to display.</td></tr>'; return; }

    var html = '';
    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        var guest = guests.find(function(g) { return g.id === b.guestId; });
        var room = rooms.find(function(r) { return r.number === b.roomNumber; });
        var nights = calculateNights(b.checkIn, b.checkOut);
        var total = nights * (room ? room.price : 0);
        html += '<tr><td>' + b.id + '</td><td>' + (guest ? guest.name : 'Unknown') + '</td>' +
            '<td>Room ' + b.roomNumber + '</td><td>' + formatDate(b.checkIn) + '</td>' +
            '<td>' + formatDate(b.checkOut) + '</td><td>' + nights + '</td>' +
            '<td>' + formatCurrency(total) + '</td>' +
            '<td><span class="badge badge-' + getStatusClass(b.status) + '">' + b.status + '</span></td></tr>';
    }
    tbody.innerHTML = html;
}

/** Render a timeline grouped by upcoming check-in dates. */
function renderBookingTimeline(bookings, guests, rooms) {
    var container = document.getElementById('bookingTimeline');
    if (!container) return;
    
    var todayStr = new Date().toISOString().split('T')[0];
    
    // Group active bookings by check-in date
    var upcoming = bookings.filter(function(b) { 
        return b.status !== 'Cancelled' && b.status !== 'Checked Out' && b.checkIn >= todayStr;
    }).sort(function(a,b) { return new Date(a.checkIn) - new Date(b.checkIn); });
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-muted">No upcoming check-ins.</p>';
        return;
    }
    
    var groups = {};
    for (var i=0; i<upcoming.length; i++) {
        var date = upcoming[i].checkIn;
        if (!groups[date]) groups[date] = [];
        groups[date].push(upcoming[i]);
    }
    
    var html = '<div class="timeline">';
    for (var date in groups) {
        if (groups.hasOwnProperty(date)) {
            html += '<div class="timeline-group"><h4 style="margin-top:15px; margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:5px; color:var(--primary);">' + formatDate(date) + '</h4>';
            for (var j=0; j<groups[date].length; j++) {
                var b = groups[date][j];
                var guest = guests.find(function(g){return g.id === b.guestId;});
                var gName = guest ? guest.name : 'Unknown';
                html += '<div style="background:#f7fafc; padding:10px; border-radius:4px; margin-bottom:8px; border-left:4px solid var(--info);">' +
                        '<strong>' + gName + '</strong> - Room ' + b.roomNumber + ' (' + b.numGuests + ' Guests)<br>' +
                        '<small class="text-muted">Check-out: ' + formatDate(b.checkOut) + ' | Ref: ' + b.id + '</small>' +
                        '</div>';
            }
            html += '</div>';
        }
    }
    html += '</div>';
    container.innerHTML = html;
}

/** Export all booking data as a CSV file. */
function exportCSV() {
    var bookings = getBookings();
    var guests = getGuests();
    var rooms = getRooms();
    if (bookings.length === 0) { showToast('No bookings to export.', 'warning'); return; }

    var csv = 'Booking ID,Guest Name,Guest Email,Room Number,Room Type,Check-In,Check-Out,Nights,Price Per Night,Total Cost,Status\n';
    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        var guest = guests.find(function(g) { return g.id === b.guestId; });
        var room = rooms.find(function(r) { return r.number === b.roomNumber; });
        var nights = calculateNights(b.checkIn, b.checkOut);
        var price = room ? room.price : 0;
        csv += b.id + ',"' + (guest ? guest.name : 'Unknown') + '",' + (guest ? guest.email : '') + ',' +
            b.roomNumber + ',' + (room ? room.type : '') + ',' + b.checkIn + ',' + b.checkOut + ',' +
            nights + ',' + price.toFixed(2) + ',' + (nights * price).toFixed(2) + ',' + b.status + '\n';
    }

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'stayease_bookings_report.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV report downloaded successfully!', 'success');
}
