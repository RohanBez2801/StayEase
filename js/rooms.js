/* ==========================================
   StayEase - Room Management
   Add, edit, delete, search, and filter rooms
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    renderRooms();
    document.getElementById('roomSearch').addEventListener('input', renderRooms);
    document.getElementById('filterType').addEventListener('change', renderRooms);
    document.getElementById('filterStatus').addEventListener('change', renderRooms);
});

/** Display all rooms as cards, applying current search/filter. */
function renderRooms() {
    var rooms = getRooms();
    var searchTerm = document.getElementById('roomSearch').value.toLowerCase();
    var filterType = document.getElementById('filterType').value;
    var filterStatus = document.getElementById('filterStatus').value;

    var filtered = rooms.filter(function(room) {
        var matchesSearch = room.number.toLowerCase().includes(searchTerm) ||
            room.description.toLowerCase().includes(searchTerm) ||
            room.type.toLowerCase().includes(searchTerm);
        var matchesType = filterType === '' || room.type === filterType;
        var matchesStatus = filterStatus === '' || room.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    var container = document.getElementById('roomsGrid');

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🛏️</span>' +
            '<h3>No Rooms Found</h3><p>' +
            (rooms.length === 0 ? 'Add your first room to get started.' : 'Try adjusting your search or filters.') +
            '</p></div>';
        return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var room = filtered[i];
        html += '<div class="room-card card">' +
            '<div class="room-card-header"><span class="room-number">Room ' + room.number + '</span>' +
            '<span class="badge badge-' + getStatusClass(room.status) + '">' + room.status + '</span></div>' +
            '<div class="room-card-body">' +
            '<div class="room-type">' + getRoomTypeIcon(room.type) + ' ' + room.type + ' (' + (room.branch || 'Unknown') + ')</div>' +
            '<p class="room-description">' + room.description + '</p>' +
            '<div class="room-details"><span class="room-price">' + formatCurrency(room.price) + ' <small>/ night</small></span>' +
            '<span class="room-capacity">👥 ' + room.capacity + (room.capacity === 1 ? ' Guest' : ' Guests') + '</span></div></div>' +
            '<div class="room-card-actions">' +
            '<button class="btn btn-sm btn-secondary" onclick="openEditRoomModal(\'' + room.number + '\')">✏️ Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteRoom(\'' + room.number + '\')">🗑️ Delete</button></div></div>';
    }
    container.innerHTML = html;
}

function getRoomTypeIcon(type) {
    switch (type) {
        case 'Single': return '🛏️';
        case 'Double': return '🛏️🛏️';
        case 'Family': return '👨‍👩‍👧‍👦';
        case 'Suite': return '👑';
        default: return '🛏️';
    }
}

/** Open the modal to add a new room. */
function openAddRoomModal() {
    openModal('Add New Room', getRoomFormHtml(null));
}

/** Open the modal to edit an existing room. */
function openEditRoomModal(roomNumber) {
    var rooms = getRooms();
    var room = rooms.find(function(r) { return r.number === roomNumber; });
    if (!room) return;
    openModal('Edit Room ' + roomNumber, getRoomFormHtml(room));
}

/** Generate the HTML form for adding/editing a room. */
function getRoomFormHtml(room) {
    var isEdit = room !== null;
    return '<form id="roomForm" onsubmit="saveRoom(event, ' + (isEdit ? "'" + room.number + "'" : 'null') + ')">' +
        '<div class="form-group"><label for="roomNumber">Room Number *</label>' +
        '<input type="text" id="roomNumber" value="' + (room ? room.number : '') + '" ' + (isEdit ? 'readonly' : '') + ' required placeholder="e.g. 101"></div>' +
        '<div class="form-group"><label for="roomBranch">Branch / City *</label>' +
        '<input type="text" id="roomBranch" value="' + (room && room.branch ? room.branch : '') + '" required placeholder="e.g. Cape Town"></div>' +
        '<div class="form-row"><div class="form-group"><label for="roomType">Room Type *</label>' +
        '<select id="roomType" required><option value="">Select type...</option>' +
        '<option value="Single"' + (room && room.type === 'Single' ? ' selected' : '') + '>Single</option>' +
        '<option value="Double"' + (room && room.type === 'Double' ? ' selected' : '') + '>Double</option>' +
        '<option value="Family"' + (room && room.type === 'Family' ? ' selected' : '') + '>Family</option>' +
        '<option value="Suite"' + (room && room.type === 'Suite' ? ' selected' : '') + '>Suite</option></select></div>' +
        '<div class="form-group"><label for="roomStatus">Status *</label>' +
        '<select id="roomStatus" required>' +
        '<option value="Available"' + (room && room.status === 'Available' ? ' selected' : '') + '>Available</option>' +
        '<option value="Booked"' + (room && room.status === 'Booked' ? ' selected' : '') + '>Booked</option>' +
        '<option value="Maintenance"' + (room && room.status === 'Maintenance' ? ' selected' : '') + '>Maintenance</option></select></div></div>' +
        '<div class="form-row"><div class="form-group"><label for="roomPrice">Price per Night (R) *</label>' +
        '<input type="number" id="roomPrice" value="' + (room ? room.price : '') + '" required min="1" step="0.01" placeholder="e.g. 1200"></div>' +
        '<div class="form-group"><label for="roomCapacity">Capacity (Guests) *</label>' +
        '<input type="number" id="roomCapacity" value="' + (room ? room.capacity : '') + '" required min="1" max="10" placeholder="e.g. 2"></div></div>' +
        '<div class="form-group"><label for="roomDescription">Description</label>' +
        '<textarea id="roomDescription" rows="3" placeholder="Brief description of the room...">' + (room ? room.description : '') + '</textarea></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save Changes' : 'Add Room') + '</button></div></form>';
}

/** Save a new or edited room. */
function saveRoom(event, editingNumber) {
    event.preventDefault();
    var rooms = getRooms();
    var number = document.getElementById('roomNumber').value.trim();
    var branch = document.getElementById('roomBranch').value.trim();
    var type = document.getElementById('roomType').value;
    var price = parseFloat(document.getElementById('roomPrice').value);
    var capacity = parseInt(document.getElementById('roomCapacity').value);
    var status = document.getElementById('roomStatus').value;
    var description = document.getElementById('roomDescription').value.trim();

    if (!number || !branch || !type || isNaN(price) || isNaN(capacity)) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (editingNumber) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].number === editingNumber) {
                rooms[i] = { number: number, branch: branch, type: type, price: price, capacity: capacity, status: status, description: description };
                break;
            }
        }
        saveRooms(rooms);
        showToast('Room ' + number + ' updated successfully!', 'success');
    } else {
        if (rooms.some(function(r) { return r.number === number; })) {
            showToast('Room number ' + number + ' already exists.', 'error');
            return;
        }
        rooms.push({ number: number, branch: branch, type: type, price: price, capacity: capacity, status: status, description: description });
        saveRooms(rooms);
        showToast('Room ' + number + ' added successfully!', 'success');
    }
    closeModal();
    renderRooms();
}

/** Delete a room after confirmation. */
function deleteRoom(roomNumber) {
    if (roomHasActiveBookings(roomNumber)) {
        showToast('Cannot delete room ' + roomNumber + ' — it has active bookings.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete Room ' + roomNumber + '? This action cannot be undone.')) {
        var rooms = getRooms().filter(function(r) { return r.number !== roomNumber; });
        saveRooms(rooms);
        showToast('Room ' + roomNumber + ' deleted.', 'success');
        renderRooms();
    }
}
