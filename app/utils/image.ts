import { API_URL } from "../constants/Config";

export const getImageUrl = (item: any, fallback = 'https://via.placeholder.com/400x300') => {
    let img = null;
    if (item?.images && item.images.length > 0) {
        img = item.images[0];
    } else if (item?.image) {
        img = item.image;
    }

    if (!img) return fallback;

    // Replace backslashes with forward slashes
    img = img.replace(/\\/g, '/');

    if (img.startsWith('http')) {
        return img;
    }

    // Ensure proper slash connection
    const baseUrl = API_URL.replace('/api', '');
    const cleanImg = img.startsWith('/') ? img.substring(1) : img;
    
    return `${baseUrl}/${cleanImg}`;
};

export const getImageUrlFromString = (img: string | undefined | null, fallback = 'https://via.placeholder.com/400x300') => {
    if (!img) return fallback;
    
    img = img.replace(/\\/g, '/');

    if (img.startsWith('http')) return img;
    
    const baseUrl = API_URL.replace('/api', '');
    const cleanImg = img.startsWith('/') ? img.substring(1) : img;

    return `${baseUrl}/${cleanImg}`;
};
