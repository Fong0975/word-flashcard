// Function to check API status
async function checkApiStatus() {
    const statusResult = document.getElementById('statusResult');
    const checkButton = document.getElementById('checkStatus');

    // Show loading state
    statusResult.className = 'status-result status-loading';
    statusResult.innerHTML = '<strong>Checking...</strong> Please wait while we check the API status.';
    checkButton.disabled = true;
    checkButton.textContent = 'Checking...';

    try {
        const response = await fetch('/api/status');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Show success state
        statusResult.className = 'status-result status-success';
        statusResult.innerHTML = `
            <strong>Status:</strong> ${data.status}<br>
            <strong>Message:</strong> ${data.message}<br>
            <strong>Timestamp:</strong> ${new Date().toLocaleString()}
        `;

    } catch (error) {
        // Show error state
        statusResult.className = 'status-result status-error';
        statusResult.innerHTML = `
            <strong>Error:</strong> Failed to connect to API<br>
            <strong>Details:</strong> ${error.message}<br>
            <strong>Timestamp:</strong> ${new Date().toLocaleString()}
        `;
    } finally {
        // Reset button state
        checkButton.disabled = false;
        checkButton.textContent = 'Check API Status';
    }
}

// Check status on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Word Flashcard service loaded successfully');

    // Optional: Auto-check status on load
    // checkApiStatus();
});