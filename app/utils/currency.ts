export const getCurrencySymbol = (currencyCode: string | undefined): string => {
    const symbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'AED': 'AED ',
        'JPY': '¥',
    };
    return symbols[currencyCode?.toUpperCase() || 'INR'] || '₹'; 
};

export const formatPrice = (price: string | number | undefined, currency?: string): string => {
    const symbol = getCurrencySymbol(currency);
    
    // Handle cases where price is missing, undefined, or NaN
    if (price === undefined || price === null || price === '') return `${symbol}0`;
    
    let numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) numPrice = 0;

    return `${symbol}${numPrice}`;
};

export const getAdultPrice = (item: any): number => {
    if (!item) return 0;

    // Check new bookingOptions structure first
    if (item.bookingOptions && item.bookingOptions.length > 0) {
        const option = item.bookingOptions[0];
        if (option.availabilityAndPricing && option.availabilityAndPricing.pricingTiers && option.availabilityAndPricing.pricingTiers.length > 0) {
            // Find adult tier
            const adultTier = option.availabilityAndPricing.pricingTiers.find((t: any) => t.title && t.title.toLowerCase().includes('adult'));
            if (adultTier && !isNaN(parseFloat(adultTier.price)) && parseFloat(adultTier.price) > 0) {
                return parseFloat(adultTier.price);
            }
            // Fallback to first tier
            const firstTier = option.availabilityAndPricing.pricingTiers[0];
            if (firstTier && !isNaN(parseFloat(firstTier.price)) && parseFloat(firstTier.price) > 0) {
                return parseFloat(firstTier.price);
            }
        }
        if (option.availabilityAndPricing && option.availabilityAndPricing.price) {
            return parseFloat(option.availabilityAndPricing.price);
        }
    }
    
    if (item.adultPrice && !isNaN(parseFloat(item.adultPrice)) && parseFloat(item.adultPrice) > 0) {
        return typeof item.adultPrice === 'string' ? parseFloat(item.adultPrice) : item.adultPrice;
    }
    
    if (item.basePrice && !isNaN(parseFloat(item.basePrice)) && parseFloat(item.basePrice) > 0) {
        return typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice;
    }

    if (item.price && !isNaN(parseFloat(item.price)) && parseFloat(item.price) > 0) {
        return typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    }

    return 0; // Fallback
};

export const getChildPrice = (item: any): number => {
    if (!item) return 0;
    
    // Check new bookingOptions structure first
    if (item.bookingOptions && item.bookingOptions.length > 0) {
        const option = item.bookingOptions[0];
        if (option.availabilityAndPricing && option.availabilityAndPricing.pricingTiers && option.availabilityAndPricing.pricingTiers.length > 0) {
            // Find child tier
            const childTier = option.availabilityAndPricing.pricingTiers.find((t: any) => t.title && t.title.toLowerCase().includes('child'));
            if (childTier && !isNaN(parseFloat(childTier.price)) && parseFloat(childTier.price) > 0) {
                return parseFloat(childTier.price);
            }
        }
    }

    if (item.childPrice && !isNaN(parseFloat(item.childPrice)) && parseFloat(item.childPrice) > 0) {
        return typeof item.childPrice === 'string' ? parseFloat(item.childPrice) : item.childPrice;
    }
    
    return 0; // Fallback
};

// Keep getDisplayPrice for backward compatibility
export const getDisplayPrice = getAdultPrice;
