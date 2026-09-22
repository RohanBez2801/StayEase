/* ==========================================
   StayEase - Data Management (PHP API version)
   Handles API fetch operations
   ========================================== */

/** Wrapper for fetch to handle CSRF and JSON parsing */
async function apiFetch(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': window.CSRF_TOKEN || ''
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            // Check if it's a 403 or similar
            if (response.status === 403) {
                const text = await response.text();
                throw new Error("Unauthorized or Invalid CSRF token.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json;
    } catch (e) {
        console.error("API Fetch Error:", e);
        showToast("Error communicating with server: " + e.message, "error");
        return { success: false, error: e.message };
    }
}

/** Get all rooms from API */
async function getRooms() {
    const res = await apiFetch('/api/rooms.php');
    return res.success ? res.data : [];
}

/** Get all guests from API */
async function getGuests() {
    const res = await apiFetch('/api/guests.php');
    return res.success ? res.data : [];
}

/** Get all bookings from API */
async function getBookings() {
    const res = await apiFetch('/api/bookings.php');
    return res.success ? res.data : [];
}

/** Reset all data back to the sample data. */
function resetDemoData() {
    alert("Reset Demo Data is disabled in the production database version. Please use the database seed script.");
}
