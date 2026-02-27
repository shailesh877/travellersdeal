const HomepageSection = require('../models/HomepageSection');

const DEFAULT_DESTINATIONS = [
    { city: 'London', image: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { city: 'New York', image: 'https://images.pexels.com/photos/2190283/pexels-photo-2190283.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { city: 'Paris', image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { city: 'Rome', image: 'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { city: 'Tokyo', image: 'https://images.pexels.com/photos/402028/pexels-photo-402028.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { city: 'Dubai', image: 'https://images.pexels.com/photos/32870/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800' }
];

const DEFAULT_ATTRACTIONS = [
    { title: 'Statue of Liberty', activities: '172', image: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=800&q=80' },
    { title: 'Vatican Museums', activities: '533', image: 'https://images.pexels.com/photos/3264665/pexels-photo-3264665.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Eiffel Tower', activities: '519', image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Metropolitan Museum of Art', activities: '64', image: 'https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=800' }
];

const DEFAULT_FOOTER_LINKS = [
    {
        category: 'Top attractions worldwide',
        links: [
            { title: 'Colosseum', subtitle: '1151 tours & activities', url: '#' },
            { title: 'Vatican Museums', subtitle: '533 tours & activities', url: '#' },
            { title: 'Louvre Museum', subtitle: '527 tours & activities', url: '#' },
            { title: 'Eiffel Tower', subtitle: '519 tours & activities', url: '#' }
        ]
    },
    {
        category: 'Top destinations',
        links: [
            { title: 'London', subtitle: '982 tours & activities', url: '#' },
            { title: 'New York', subtitle: '850 tours & activities', url: '#' },
            { title: 'Paris', subtitle: '920 tours & activities', url: '#' },
            { title: 'Rome', subtitle: '740 tours & activities', url: '#' }
        ]
    }
];

// GET /api/homepage/:type  (public)
const getSection = async (req, res) => {
    try {
        const { type } = req.params;
        if (!['destinations', 'attractions', 'footerLinks'].includes(type)) {
            return res.status(400).json({ message: 'Invalid section type' });
        }

        let defaults;
        if (type === 'destinations') defaults = DEFAULT_DESTINATIONS;
        else if (type === 'attractions') defaults = DEFAULT_ATTRACTIONS;
        else defaults = DEFAULT_FOOTER_LINKS;

        // Single atomic operation - upsert on first access, just read after
        const section = await HomepageSection.findOneAndUpdate(
            { type },
            { $setOnInsert: { type, items: defaults } },
            { new: true, upsert: true }
        );

        res.json(section.items && section.items.length > 0 ? section.items : defaults);
    } catch (err) {
        console.error('Homepage GET error:', err.message);
        // Fallback to hardcoded defaults if DB fails
        let defaults;
        if (req.params.type === 'destinations') defaults = DEFAULT_DESTINATIONS;
        else if (req.params.type === 'attractions') defaults = DEFAULT_ATTRACTIONS;
        else defaults = DEFAULT_FOOTER_LINKS;
        res.json(defaults);
    }
};

// PUT /api/homepage/:type  (admin only)
const updateSection = async (req, res) => {
    try {
        const { type } = req.params;
        const { items } = req.body;

        if (!['destinations', 'attractions', 'footerLinks'].includes(type)) {
            return res.status(400).json({ message: 'Invalid section type' });
        }
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'items must be an array' });
        }

        const section = await HomepageSection.findOneAndUpdate(
            { type },
            { $set: { items } },
            { new: true, upsert: true }
        );

        res.json({ message: 'Updated successfully', items: section.items });
    } catch (err) {
        console.error('Homepage PUT error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getSection, updateSection };
