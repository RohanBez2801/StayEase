/* ==========================================
   StayEase - Room Management
   Add, edit, delete, search, and filter rooms
   ========================================== */

let cachedRooms = [];

document.addEventListener('DOMContentLoaded', async function() {
    await fetchAndRenderRooms();
    document.getElementById('roomSearch').addEventListener('input', renderRooms);
    document.getElementById('filterType').addEventListener('change', renderRooms);
    document.getElementById('filterStatus').addEventListener('change', renderRooms);
});

async function fetchAndRenderRooms() {
    cachedRooms = await getRooms();
    renderRooms();
}

/** Display all rooms as cards, applying current search/filter. */
function renderRooms() {
    var rooms = cachedRooms;
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
            '<span class="room-capacity">👥 ' + room.capacity + (room.capacity == 1 ? ' Guest' : ' Guests') + '</span></div></div>' +
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
    var room = cachedRooms.find(function(r) { return r.number === roomNumber; });
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
        '<input type="text" id="roomBranch" value="' + (room && room.branch ? room.branch : 'Cape Town') + '" readonly title="Only Cape Town supported in demo"></div>' +
        '<div class="form-row"><div class="form-group"><label for="roomType">Room Type *</label>' +
        '<select id="roomType" required><option value="">Select type...</option>' +
        '<option value="Single"' + (room && room.type === 'Single' ? ' selected' : '') + '>Single</option>' +
        '<option value="Double"' + (room && room.type === 'Double' ? ' selected' : '') + '>Double</option>' +
        '<option value="Family"' + (room && room.type === 'Family' ? ' selected' : '') + '>Family</option>' +
        '<option value="Suite"' + (room && room.type === 'Suite' ? ' selected' : '') + '>Suite</option></select></div>' +
        '<div class="form-group"><label for="roomStatus">Status *</label>' +
        '<select id="roomStatus" required>' +
        '<option value="Available"' + (room && room.status === 'Available' ? ' selected' : '') + '>Available</option>' +
        '<option value="Maintenance"' + (room && room.status === 'Maintenance' ? ' selected' : '') + '>Maintenance</option></select></div></div>' +
        '<div class="form-group"><label for="roomDescription">Description</label>' +
        '<textarea id="roomDescription" rows="3" placeholder="Brief description of the room...">' + (room ? room.description : '') + '</textarea></div>' +
        '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save Changes' : 'Add Room') + '</button></div></form>';
}

/** Save a new or edited room. */
async function saveRoom(event, editingNumber) {
    event.preventDefault();
    var number = document.getElementById('roomNumber').value.trim();
    var type = document.getElementById('roomType').value;
    var status = document.getElementById('roomStatus').value;
    var description = document.getElementById('roomDescription').value.trim();

    if (!number || !type) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    var btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    var res = await apiFetch('/api/rooms.php', 'POST', {
        action: 'save',
        id: editingNumber,
        number: number,
        type: type,
        status: status,
        description: description
    });
    
    btn.disabled = false;
    
    if (res.success) {
        showToast('Room saved successfully!', 'success');
        closeModal();
        await fetchAndRenderRooms();
    } else {
        showToast(res.error || 'Failed to save room.', 'error');
    }
}

/** Delete a room after confirmation. */
async function deleteRoom(roomNumber) {
    if (confirm('Are you sure you want to delete Room ' + roomNumber + '?')) {
        var res = await apiFetch('/api/rooms.php', 'DELETE', { number: roomNumber });
        if (res.success) {
            showToast('Room ' + roomNumber + ' deleted.', 'success');
            await fetchAndRenderRooms();
        } else {
            showToast(res.error || 'Failed to delete room.', 'error');
        }
    }
}
