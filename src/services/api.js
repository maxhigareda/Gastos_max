
/**
 * Sends expense data to the Google Apps Script Web App.
 * @param {Object} data - { date, description, group, type, card, total }
 * @param {string} apiEndpoint - The URL of the deployed Web App.
 * @returns {Promise<Object>} - The response from the script.
 */
export async function submitExpense(data, apiEndpoint) {
    // Use text/plain to avoid CORS options preflight issues with simple requests if possible,
    // but usually for a custom JSON body we just send it.
    // Google Apps Script 'doPost' often requires 'no-cors' mode if we just want to fire and forget
    // OR standard fetch if we want the response (requires correct CORS headers in script).
    // The provided script has CORS headers.

    // We added column "date". If data.date is empty, backend handles it.

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            mode: "cors", // We expect CORS headers from server
            headers: {
                "Content-Type": "text/plain;charset=utf-8", // text/plain avoids preflight in some cases, but GS handles JSON parse.
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
