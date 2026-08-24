export const getCurrencySymbol = (code) => {
    if (!code) return '';
    const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED ', 'JPY': '¥' };
    return symbols[code] || `${code} `;
};
