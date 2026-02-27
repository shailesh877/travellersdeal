const Experience = require('../models/Experience');
const Booking = require('../models/Booking');

// @desc    Fetch all experiences
// @route   GET /api/experiences
// @access  Public
const getExperiences = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.pageNumber) || 1;

        // Build Query
        const query = { status: 'approved' };

        // 1. Search Keyword (Title, Description, City, Country)
        if (req.query.keyword) {
            const keyword = req.query.keyword;
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { 'location.city': { $regex: keyword, $options: 'i' } },
                { 'location.country': { $regex: keyword, $options: 'i' } }
            ];
        }

        // 2. Category Filter
        if (req.query.category) {
            // Allow comma-separated categories if needed, or single
            const categories = req.query.category.split(',').map(c => new RegExp(c, 'i'));
            query.category = { $in: categories };
        }

        // 3. Price Filter (minPrice, maxPrice)
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        // 4. Duration Filter
        if (req.query.duration) {
            // Example: "Up to 1 hour", "1 to 4 hours"
            // We'll use regex to loosely match common terms if stored as strings
            // Ideally, store durationInMinutes for better filtering
            const durations = req.query.duration.split(',');
            const durationQueries = durations.map(d => {
                if (d.includes('Up to 1 hour')) return { duration: { $regex: /1 hour|minute/i } };
                if (d.includes('1 to 4 hours')) return { duration: { $regex: /[2-3] hour|4 hour|1 hour 30/i } }; // Rough approximation
                if (d.includes('Multi-day') || d.includes('day')) return { duration: { $regex: /day/i } };
                return { duration: { $regex: d, $options: 'i' } };
            });

            if (durationQueries.length > 0) {
                // Push to $or if keyword exists, or create new $or
                // Complex overlapping $or is tricky in Mongo, simplified for now:
                // If keyword search exists, we need $and usage
                if (query.$or) {
                    query.$and = [{ $or: query.$or }, { $or: durationQueries }];
                    delete query.$or;
                } else {
                    query.$or = durationQueries;
                }
            }
        }

        const count = await Experience.countDocuments(query);
        const experiences = await Experience.find(query)
            .sort({ createdAt: -1 }) // Newest first by default
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ experiences, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single experience
// @route   GET /api/experiences/:id
// @access  Public
const getExperienceById = async (req, res) => {
    try {
        const experience = await Experience.findById(req.params.id).populate(
            'vendor',
            'name email'
        );

        if (experience) {
            // Check if approved or if requester is owner/admin
            // Note: req.user might be undefined for public guests
            const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || experience.vendor._id.toString() === req.user._id.toString());

            if (experience.status === 'approved' || isOwnerOrAdmin) {
                res.json(experience);
            } else {
                res.status(404).json({ message: 'Experience not found or pending approval' });
            }
        } else {
            res.status(404).json({ message: 'Experience not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an experience
// @route   POST /api/experiences
// @access  Private/Vendor
const createExperience = async (req, res) => {
    const {
        title,
        description,
        category,
        price,
        currency,
        duration,
        location,
        images,
        highlights,
        itinerary,
        includes,
        knowBeforeYouGo,
        meetingPoint,
        whatToBring,
        notSuitableFor,
        languages,
        availability,
        timeSlots,
        privateGroup,
        dietaryOptions,
        capacity
    } = req.body;

    try {
        const experience = new Experience({
            title,
            description,
            category,
            price,
            currency: currency || 'USD',
            duration,
            images,
            location,
            highlights,
            itinerary,
            includes,
            knowBeforeYouGo,
            meetingPoint,
            whatToBring,
            notSuitableFor,
            languages,
            availability,
            timeSlots,
            privateGroup,
            dietaryOptions,
            capacity,
            vendor: req.user._id,
            status: 'pending',
            isActive: false,
        });

        const createdExperience = await experience.save();
        res.status(201).json(createdExperience);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an experience
// @route   PUT /api/experiences/:id
// @access  Private/Vendor
const updateExperience = async (req, res) => {
    try {
        const experience = await Experience.findById(req.params.id);

        if (experience) {
            if (experience.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to update this experience' });
            }

            // Save snapshot before changes
            if (req.user.role === 'vendor' && experience.status === 'approved') {
                experience.lastApprovedSnapshot = experience.toObject();
                experience.markModified('lastApprovedSnapshot');
            }

            experience.title = req.body.title || experience.title;
            experience.description = req.body.description || experience.description;
            experience.category = req.body.category || experience.category;
            experience.price = req.body.price || experience.price;
            experience.currency = req.body.currency || experience.currency;
            experience.duration = req.body.duration || experience.duration;
            experience.images = req.body.images || experience.images;
            experience.location = req.body.location || experience.location;
            experience.availability = req.body.availability || experience.availability;
            experience.highlights = req.body.highlights || experience.highlights;
            experience.itinerary = req.body.itinerary || experience.itinerary;
            experience.includes = req.body.includes || experience.includes;
            experience.knowBeforeYouGo = req.body.knowBeforeYouGo || experience.knowBeforeYouGo;
            experience.meetingPoint = req.body.meetingPoint || experience.meetingPoint;
            experience.whatToBring = req.body.whatToBring || experience.whatToBring;
            experience.notSuitableFor = req.body.notSuitableFor || experience.notSuitableFor;
            experience.languages = req.body.languages || experience.languages;
            experience.timeSlots = req.body.timeSlots || experience.timeSlots;
            experience.privateGroup = req.body.privateGroup !== undefined ? req.body.privateGroup : experience.privateGroup;
            experience.dietaryOptions = req.body.dietaryOptions || experience.dietaryOptions;
            experience.capacity = req.body.capacity || experience.capacity;

            // Set back to pending if edited by vendor
            if (req.user.role === 'vendor') {
                experience.status = 'pending';
            }

            const updatedExperience = await experience.save();
            res.json(updatedExperience);
        } else {
            res.status(404).json({ message: 'Experience not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an experience
// @route   DELETE /api/experiences/:id
// @access  Private/Vendor
const deleteExperience = async (req, res) => {
    try {
        const experience = await Experience.findById(req.params.id);

        if (experience) {
            if (experience.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to delete this experience' });
            }

            await experience.deleteOne();
            res.json({ message: 'Experience removed' });
        } else {
            res.status(404).json({ message: 'Experience not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in vendor's experiences
// @route   GET /api/experiences/my
// @access  Private/Vendor
const getMyExperiences = async (req, res) => {
    try {
        const experiences = await Experience.find({ vendor: req.user._id });
        res.json(experiences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check availability for a specific date
// @route   GET /api/experiences/:id/availability
// @access  Public
const getAvailability = async (req, res) => {
    const { date } = req.query;
    const { id } = req.params;

    if (!date) {
        return res.status(400).json({ message: 'Date parameter is required' });
    }

    try {
        const experience = await Experience.findById(id);
        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const bookings = await Booking.find({
            experience: id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $ne: 'cancelled' }
        });

        const availability = {};

        if (experience.timeSlots && experience.timeSlots.length > 0) {
            experience.timeSlots.forEach(slot => {
                const bookedCount = bookings
                    .filter(b => b.timeSlot === slot)
                    .reduce((acc, b) => acc + b.slots, 0);

                availability[slot] = Math.max(0, experience.capacity - bookedCount);
            });
        } else {
            const totalBooked = bookings.reduce((acc, b) => acc + b.slots, 0);
            availability['allDay'] = Math.max(0, experience.capacity - totalBooked);
        }

        res.json({
            date,
            capacity: experience.capacity,
            availability
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get top destinations
// @route   GET /api/experiences/destinations
// @access  Public
const getTopDestinations = async (req, res) => {
    try {
        const destinations = await Experience.aggregate([
            {
                $group: {
                    _id: "$location.city",
                    count: { $sum: 1 },
                    image: { $first: "$images" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 4 }
        ]);

        const formatted = destinations.map(d => ({
            city: d._id,
            count: d.count,
            image: d.image && d.image.length > 0 ? d.image[0] : null
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getExperiences,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience,
    getMyExperiences,
    getAvailability,
    getTopDestinations,
};
