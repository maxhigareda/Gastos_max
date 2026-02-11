
/**
 * Sends expense data to the Google Apps Script Web App.
 * @param {Object} data - { date, description, group, type, card, total }
 * @param {string} apiEndpoint - The URL of the deployed Web App.
 * @returns {Promise<Object>} - The response from the script.
 */
export async function submitExpense(data, apiEndpoint) {
    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            mode: "cors", // We expect CORS headers from server
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
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

/**
 * Fetches data from the Google Apps Script Web App.
 * @param {string} apiEndpoint - The URL of the deployed Web App.
 * @param {string} type - 'expense' or 'investment' (default: 'expense')
 * @returns {Promise<Array>} - List of records.
 */
export async function getExpenses(apiEndpoint, type = 'expense') {
    try {
        // Append query param for type
        const separator = apiEndpoint.includes('?') ? '&' : '?';
        const url = `${apiEndpoint}${separator}type=${type}`;

        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch data');
        }
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}

/**
 * Fetches configuration data (sync) from Google Apps Script.
 * @param {string} apiEndpoint
 * @returns {Promise<Object>} - The config entries.
 */
export async function getConfigs(apiEndpoint) {
    try {
        const data = await getExpenses(apiEndpoint, 'config');
        // Data comes as array of { date, key, value }. We need to reduce to latest values.
        // But the raw fetch is enough here, parsing logic can be in the View or a helper.
        return data;
    } catch (error) {
        console.error("Config Fetch Error:", error);
        return [];
    }
}

/**
 * Saves a configuration setting to Google Apps Script.
 * @param {string} key - Config key (e.g. 'hidden_goals')
 * @param {any} value - Config value (will be JSON stringified)
 * @param {string} apiEndpoint
 */
export async function saveConfig(key, value, apiEndpoint) {
    const payload = {
        sheetType: 'config',
        date: new Date(),
        key: key,
        value: JSON.stringify(value)
    };
    return await submitExpense(payload, apiEndpoint);
}
