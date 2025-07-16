function convertDateFormat(dateString) {
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        return dateString;
    }
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }
    if (typeof dateString !== 'string' || !dateString.includes(" ")) {
        return dateString;
    }
    const parts = dateString.split(" ");
    if (parts.length !== 3) return dateString;
    const [day, monthName, year] = parts;
    const month = [
        "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
        "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
    ].indexOf(monthName.toLowerCase()) + 1;
    if (month === 0) return dateString;
    const numericDay = !isNaN(parseInt(day)) ? parseInt(day) : 0;
    const numericYear = !isNaN(parseInt(year)) ? parseInt(year) : 0;
    if (numericDay === 0 || numericYear === 0) return dateString;
    return `${String(numericDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${numericYear}`;
}

function formatDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "-";
    try {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        if (year < 1970 || year > 2100) return "-";
        return `${day}.${month}.${year}`;
    } catch (e) {
        return "-";
    }
}

function getNodeColor(node, mode) {
    const effectiveMode = mode || currentColoringMode;
    switch (effectiveMode) {
        case 'boosts':
            return boostColorScale ? boostColorScale(node.boosts || 0) : '#ccc';
        case 'age':
            const date = parseDateString(node.creationDate);
            return ageColorScale && date ? ageColorScale(date.getTime()) : '#ccc';
        case 'partnerships':
            const partnershipCount = (node.partnerships || []).length;
            return partnershipColorScale ? partnershipColorScale(partnershipCount) : '#ccc';
        case 'influence':
            return influenceColorScale ? influenceColorScale(node.influenceScore || 0) : '#ccc';
        default:
            return '#ccc';
    }
}

function parseDateString(dateStr_DDMMYYYY) {
    if (typeof dateStr_DDMMYYYY !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(dateStr_DDMMYYYY)) {
        return null;
    }
    const parts = dateStr_DDMMYYYY.split('-');
    const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return !isNaN(dateObj.getTime()) ? dateObj : null;
}
