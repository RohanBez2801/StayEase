/* ==========================================
   StayEase - Data Management
   Handles localStorage operations and sample data
   ========================================== */

// --- localStorage Keys ---
var STORAGE_KEYS = {
    rooms: 'stayease_rooms',
    guests: 'stayease_guests',
    bookings: 'stayease_bookings'
};

// --- Sample Data ---
var SAMPLE_ROOMS = [
    { number: '101', branch: 'Cape Town', type: 'Single', price: 650, capacity: 1, status: 'Available', description: 'Cosy single room with a lovely garden view.' },
    { number: '102', branch: 'Cape Town', type: 'Single', price: 650, capacity: 1, status: 'Available', description: 'Quiet single room on the ground floor.' },
    { number: '201', branch: 'Johannesburg', type: 'Double', price: 1200, capacity: 2, status: 'Booked', description: 'Spacious double room with a private balcony.' },
    { number: '202', branch: 'Johannesburg', type: 'Double', price: 1200, capacity: 2, status: 'Available', description: 'Modern double room with a city view.' },
    { number: '301', branch: 'Durban', type: 'Family', price: 1800, capacity: 4, status: 'Available', description: 'Large family room with two queen-sized beds.' },
    { number: '401', branch: 'Cape Town', type: 'Suite', price: 3500, capacity: 2, status: 'Maintenance', description: 'Luxury suite with a private lounge and jacuzzi.' }
];

var SAMPLE_GUESTS = [
    { id: 'G-001', name: 'Thabo Molefe', phone: '071 234 5678', email: 'thabo@email.com', idNumber: '9501015800085' },
    { id: 'G-002', name: 'Sarah Johnson', phone: '082 345 6789', email: 'sarah.j@email.com', idNumber: 'P4521879' },
    { id: 'G-003', name: 'Amahle Dlamini', phone: '063 456 7890', email: 'amahle.d@email.com', idNumber: '9803025800081' },
    { id: 'G-004', name: 'James van der Berg', phone: '079 567 8901', email: 'james.vdb@email.com', idNumber: '8805125800083' }
];

var SAMPLE_BOOKINGS = [
    { id: 'BK-001', guestId: 'G-001', roomNumber: '201', checkIn: '2026-09-15', checkOut: '2026-09-18', numGuests: 2, status: 'Checked In' },
    { id: 'BK-002', guestId: 'G-002', roomNumber: '301', checkIn: '2026-09-20', checkOut: '2026-09-25', numGuests: 3, status: 'Confirmed' },
    { id: 'BK-003', guestId: 'G-003', roomNumber: '102', checkIn: '2026-09-10', checkOut: '2026-09-12', numGuests: 1, status: 'Checked Out' }
];

// --- CRUD Helper Functions ---

/** Get all rooms from localStorage */
function getRooms() {
    var data = localStorage.getItem(STORAGE_KEYS.rooms);
    return data ? JSON.parse(data) : [];
}

/** Save rooms array to localStorage */
function saveRooms(rooms) {
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
}

/** Get all guests from localStorage */
function getGuests() {
    var data = localStorage.getItem(STORAGE_KEYS.guests);
    return data ? JSON.parse(data) : [];
}

/** Save guests array to localStorage */
function saveGuests(guests) {
    localStorage.setItem(STORAGE_KEYS.guests, JSON.stringify(guests));
}

/** Get all bookings from localStorage */
function getBookings() {
    var data = localStorage.getItem(STORAGE_KEYS.bookings);
    return data ? JSON.parse(data) : [];
}

/** Save bookings array to localStorage */
function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
}

/**
 * Generate the next ID for guests or bookings.
 * @param {string} prefix - 'G' for guests, 'BK' for bookings
 * @param {Array} items - existing items array
 * @returns {string} - new ID like 'G-005' or 'BK-004'
 */
function generateId(prefix, items) {
    if (items.length === 0) {
        return prefix + '-001';
    }
    var numbers = items.map(function(item) {
        var parts = item.id.split('-');
        return parseInt(parts[parts.length - 1]) || 0;
    });
    var maxNum = Math.max.apply(null, numbers);
    var nextNum = maxNum + 1;
    return prefix + '-' + String(nextNum).padStart(3, '0');
}

/** Load sample data into localStorage if no data exists yet. */
function initSampleData() {
    if (!localStorage.getItem(STORAGE_KEYS.rooms)) {
        saveRooms(SAMPLE_ROOMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.guests)) {
        saveGuests(SAMPLE_GUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
        saveBookings(SAMPLE_BOOKINGS);
    }
}

/** Reset all data back to the sample data. */
function resetDemoData() {
    if (confirm('Are you sure you want to reset all data? This will remove any changes you have made and restore the original sample data.')) {
        saveRooms(SAMPLE_ROOMS);
        saveGuests(SAMPLE_GUESTS);
        saveBookings(SAMPLE_BOOKINGS);
        showToast('Demo data has been reset successfully!', 'success');
        setTimeout(function() { location.reload(); }, 1000);
    }
}

// Initialise sample data when this script loads
initSampleData();
