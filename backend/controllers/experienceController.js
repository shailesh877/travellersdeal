const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Fetch all experiences
// @route   GET /api/experiences
// @access  Public
const getExperiences = async (req, res) => {
    try {
        // Show all active experiences (or up to a very large limit) since frontend lacks pagination
        const pageSize = Number(req.query.limit) || 1000;
        const page = Number(req.query.pageNumber) || 1;

        const verifiedVendors = await User.find({ role: 'vendor', isVerified: true, isActive: true }).select('_id');
        const verifiedVendorIds = verifiedVendors.map(v => v._id);

        // Build Query
        const query = { status: 'approved', vendor: { $in: verifiedVendorIds } };

        // 1. Search Keyword (Title, Description, City, Country)
        if (req.query.keyword) {
            const keyword = req.query.keyword;
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { shortDescription: { $regex: keyword, $options: 'i' } },
                { 'location.city': { $regex: keyword, $options: 'i' } },
                { 'location.country': { $regex: keyword, $options: 'i' } },
                { locations: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } },
                { highlights: { $regex: keyword, $options: 'i' } },
                { keywords: { $regex: keyword, $options: 'i' } },
                { meetingPoint: { $regex: keyword, $options: 'i' } },
                { 'bookingOptions.optionSetup.title': { $regex: keyword, $options: 'i' } },
                { 'bookingOptions.optionSetup.description': { $regex: keyword, $options: 'i' } }
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
            query['bookingOptions.availabilityAndPricing.pricingTiers.price'] = {};
            if (req.query.minPrice) query['bookingOptions.availabilityAndPricing.pricingTiers.price'].$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query['bookingOptions.availabilityAndPricing.pricingTiers.price'].$lte = Number(req.query.maxPrice);
        }

        // 4. Duration Filter
        if (req.query.duration) {
            // Example: "Up to 1 hour", "1 to 4 hours"
            // We'll use regex to loosely match common terms if stored as strings
            // Ideally, store durationInMinutes for better filtering
            const durations = req.query.duration.split(',');
            const durationQueries = durations.map(d => {
                let regexPattern;
                if (d.includes('Up to 1 hour')) regexPattern = /1 hour|minute/i;
                else if (d.includes('1 to 4 hours')) regexPattern = /[2-3] hour|4 hour|1 hour 30/i;
                else if (d.includes('Multi-day') || d.includes('day')) regexPattern = /day/i;
                else regexPattern = new RegExp(d, 'i');
                
                return {
                    $or: [
                        { duration: { $regex: regexPattern } },
                        { 'bookingOptions.optionSetup.durationOrValidity.value': { $regex: regexPattern } }
                    ]
                };
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
            'name email isVerified isActive'
        );

        if (experience) {
            // Check if approved or if requester is owner/admin
            // Note: req.user might be undefined for public guests
            const vendorId = experience.vendor?._id ? experience.vendor._id.toString() : experience.vendor?.toString();
            const isOwnerOrAdmin = req.user && (
                req.user.role === 'admin' ||
                (vendorId && req.user._id && vendorId === req.user._id.toString())
            );

            if ((experience.status === 'approved' && experience.vendor?.isVerified !== false && experience.vendor?.isActive !== false) || isOwnerOrAdmin) {
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
        shortDescription,
        category,
        price,
        adultPrice,
        childPrice,
        currency,
        duration,
        location,
        locations,
        images,
        highlights,
        itinerary,
        includes,
        knowBeforeYouGo,
        meetingPoint,
        whatToBring,
        mandatoryItems,
        notSuitableFor,
        languages,
        availability,
        timeSlots,
        privateGroup,
        dietaryOptions,
        capacity,
        primaryLanguage,
        referenceCode,
        keywords,
        exclusions,
        guideType,
        isFoodIncluded,
        meals,
        isTransportationUsed,
        transports,
        isDifferentCityTravel,
        notAllowed,
        petFriendly,
        petPolicy,
        emergencyContact,
        voucherInfo,
        bookingOptions,
        pricingCategories
    } = req.body;

    try {
        const providedAdultPrice = req.body.adultPrice !== undefined ? req.body.adultPrice : (price || 0);
        const providedChildPrice = req.body.childPrice !== undefined ? req.body.childPrice : 0;
        let mergedPricingCategories = Array.isArray(req.body.pricingCategories) ? [...req.body.pricingCategories] : [];

        if (providedAdultPrice !== undefined && providedAdultPrice !== null && !mergedPricingCategories.find(p => p.category.toLowerCase() === 'adult')) {
            mergedPricingCategories.push({ category: 'Adult', price: Number(providedAdultPrice) });
        }
        if (providedChildPrice !== undefined && providedChildPrice !== null && !mergedPricingCategories.find(p => p.category.toLowerCase() === 'child')) {
            mergedPricingCategories.push({ category: 'Child', price: Number(providedChildPrice) });
        }

        const experience = new Experience({
            title,
            description,
            category,
            currency: currency || 'USD',
            duration: duration || '',
            images,
            location,
            locations,
            highlights,
            itinerary,
            includes,
            knowBeforeYouGo,
            meetingPoint,
            whatToBring: mandatoryItems || whatToBring,
            notSuitableFor,
            languages,
            primaryLanguage,
            referenceCode,
            shortDescription,
            availability,
            timeSlots,
            privateGroup,
            dietaryOptions,
            capacity,
            keywords,
            exclusions,
            guideType,
            isFoodIncluded,
            meals: isFoodIncluded === false ? [] : meals,
            isTransportationUsed,
            transports: isTransportationUsed === false ? [] : transports,
            isDifferentCityTravel,
            extraInformation: {
                notSuitableFor,
                notAllowed,
                petFriendly,
                petPolicy,
                whatToBring: mandatoryItems || whatToBring,
                knowBeforeYouGo,
                emergencyContact,
                voucherInfo
            },
            bookingOptions: Array.isArray(bookingOptions) ? bookingOptions.map(opt => {
                const isFlat = opt.title !== undefined;
                return {
                    optionSetup: isFlat ? {
                        title: opt.title,
                        referenceCode: opt.referenceCode,
                        description: opt.description,
                        maxGroupSize: opt.maxGroupSize,
                        languages: opt.languages,
                        audioGuide: { hasAudioGuide: opt.hasAudioGuide, languages: opt.audioGuideLanguages },
                        informationBooklets: { hasBooklets: opt.hasBooklets, languages: opt.bookletLanguages },
                        isPrivateActivity: opt.privateGroup !== undefined ? opt.privateGroup : opt.isPrivateActivity,
                        skipTheLine: { isSkip: opt.skipLine, lineDetails: opt.skipLineType },
                        wheelchairAccessible: opt.wheelchairAccessible,
                        durationOrValidity: { type: opt.durationSelection, value: opt.durationSelection === 'duration' ? `${opt.durationValue || 1} ${opt.durationUnit || 'hours'}` : `${opt.validityValue || 1} ${opt.validityUnit || 'days'}` }
                    } : opt.optionSetup,
                    meetingPointOrPickup: isFlat ? {
                        meetingType: opt.meetingType || 'meeting',
                        meetingAddress: opt.meetingAddress,
                        meetingDescription: opt.meetingDescription,
                        meetingImages: opt.meetingImages,
                        arrivalTime: opt.arrivalTime,
                        dropOffType: opt.dropOffType,
                        dropOffAddress: opt.dropOffAddress,
                        pickupType: opt.pickupType,
                        pickupTimeType: opt.pickupTimeType,
                        pickupConfirmationType: opt.pickupConfirmationType,
                        pickupTimeSlots: opt.pickupTimeSlots,
                        pickupDescription: opt.pickupDescription,
                        transportationType: opt.transportationType
                    } : opt.meetingPointOrPickup,
                    connectivitySettings: isFlat ? {
                        useReservationSystem: opt.useReservationSystem,
                        reservationSystem: opt.reservationSystem,
                        externalProductId: opt.externalProductId
                    } : opt.connectivitySettings,
                    availabilityAndPricing: isFlat ? {
                        capacity: opt.capacity,
                        pricingType: opt.pricingType || 'person',
                        pricingPersonDependency: opt.pricingPersonDependency || 'everyone',
                        price: opt.price,
                        pricingTiers: (opt.pricingPersonDependency || 'everyone') === 'everyone' ? [{ title: 'Adult', minAge: 0, maxAge: 99, price: opt.price || 0 }] : opt.pricingTiers,
                        addons: opt.addons,
                        currency: opt.currency
                    } : {
                        ...opt.availabilityAndPricing,
                        pricingTiers: (opt.availabilityAndPricing && opt.availabilityAndPricing.pricingPersonDependency === 'everyone')
                            ? [{ title: 'Adult', minAge: 0, maxAge: 99, price: opt.availabilityAndPricing.price || 0 }]
                            : (opt.availabilityAndPricing ? opt.availabilityAndPricing.pricingTiers : [])
                    },
                    cutOff: isFlat ? {
                        cutoffHours: opt.cutoffHours || 24,
                        cancellationPolicy: opt.cancellationPolicy || 'free_24h'
                    } : opt.cutOff
                };
            }) : [],
            vendor: req.user._id,
            status: 'pending',
            isActive: false,
            pricingCategories: mergedPricingCategories
        });

        console.log("Create Experience - mergedPricingCategories:", mergedPricingCategories);

        const createdExperience = await experience.save();
        res.status(201).json(createdExperience);
    } catch (error) {
        console.error('Create Experience Error:', error);
        res.status(500).json({
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
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
            if (!experience.pricingCategories) {
                experience.pricingCategories = [];
            }

            // Allow setting pricingCategories directly if frontend sends it
            if (Array.isArray(req.body.pricingCategories)) {
                console.log("Update Experience - received pricingCategories:", req.body.pricingCategories);
                // Clear existing array in Mongoose-safe way
                while (experience.pricingCategories.length > 0) {
                    experience.pricingCategories.pop();
                }
                // Push all new items
                req.body.pricingCategories.forEach(item => {
                    experience.pricingCategories.push(item);
                });
            } else {
                console.log("Update Experience - NO pricingCategories received in req.body");
            }

            // Map legacy adultPrice / childPrice updates if sent by frontend, BUT ONLY if pricingCategories wasn't explicitly provided
            if (!Array.isArray(req.body.pricingCategories) && (req.body.adultPrice !== undefined || req.body.childPrice !== undefined)) {
                let pAdult = experience.pricingCategories.find(p => p.category.toLowerCase() === 'adult');
                let pChild = experience.pricingCategories.find(p => p.category.toLowerCase() === 'child');

                if (req.body.adultPrice !== undefined) {
                    if (pAdult) pAdult.price = Number(req.body.adultPrice);
                    else experience.pricingCategories.push({ category: 'Adult', price: Number(req.body.adultPrice) });
                }
                if (req.body.childPrice !== undefined) {
                    if (pChild) pChild.price = Number(req.body.childPrice);
                    else experience.pricingCategories.push({ category: 'Child', price: Number(req.body.childPrice) });
                }
            }

            experience.currency = req.body.currency || experience.currency;
            experience.duration = req.body.duration || experience.duration;
            experience.images = req.body.images || experience.images;
            experience.location = req.body.location || experience.location;
            experience.availability = req.body.availability || experience.availability;
            experience.highlights = req.body.highlights || experience.highlights;
            experience.itinerary = req.body.itinerary || experience.itinerary;
            experience.includes = req.body.includes !== undefined ? req.body.includes : experience.includes;
            experience.meetingPoint = req.body.meetingPoint || experience.meetingPoint;
            experience.languages = req.body.languages || experience.languages;
            experience.timeSlots = req.body.timeSlots || experience.timeSlots;
            experience.privateGroup = req.body.privateGroup !== undefined ? req.body.privateGroup : experience.privateGroup;
            experience.dietaryOptions = req.body.dietaryOptions || experience.dietaryOptions;
            experience.capacity = req.body.capacity || experience.capacity;
            experience.primaryLanguage = req.body.primaryLanguage || experience.primaryLanguage;
            experience.referenceCode = req.body.referenceCode !== undefined ? req.body.referenceCode : experience.referenceCode;
            experience.shortDescription = req.body.shortDescription !== undefined ? req.body.shortDescription : experience.shortDescription;
            experience.locations = req.body.locations || experience.locations;
            experience.keywords = req.body.keywords !== undefined ? req.body.keywords : experience.keywords;
            experience.exclusions = req.body.exclusions !== undefined ? req.body.exclusions : experience.exclusions;
            experience.guideType = req.body.guideType !== undefined ? req.body.guideType : experience.guideType;
            experience.isFoodIncluded = req.body.isFoodIncluded !== undefined ? req.body.isFoodIncluded : experience.isFoodIncluded;
            experience.meals = req.body.meals !== undefined ? req.body.meals : experience.meals;
            if (experience.isFoodIncluded === false) {
                experience.meals = [];
            }
            experience.isTransportationUsed = req.body.isTransportationUsed !== undefined ? req.body.isTransportationUsed : experience.isTransportationUsed;
            experience.transports = req.body.transports !== undefined ? req.body.transports : experience.transports;
            if (experience.isTransportationUsed === false) {
                experience.transports = [];
            }
            experience.isDifferentCityTravel = req.body.isDifferentCityTravel !== undefined ? req.body.isDifferentCityTravel : experience.isDifferentCityTravel;

            experience.extraInformation = experience.extraInformation || {};
            experience.extraInformation.knowBeforeYouGo = req.body.knowBeforeYouGo !== undefined ? req.body.knowBeforeYouGo : experience.extraInformation.knowBeforeYouGo;
            experience.extraInformation.whatToBring = req.body.mandatoryItems !== undefined ? req.body.mandatoryItems : (req.body.whatToBring !== undefined ? req.body.whatToBring : experience.extraInformation.whatToBring);
            experience.extraInformation.notSuitableFor = req.body.notSuitableFor !== undefined ? req.body.notSuitableFor : experience.extraInformation.notSuitableFor;
            experience.extraInformation.notAllowed = req.body.notAllowed !== undefined ? req.body.notAllowed : experience.extraInformation.notAllowed;
            experience.extraInformation.petFriendly = req.body.petFriendly !== undefined ? req.body.petFriendly : experience.extraInformation.petFriendly;
            experience.extraInformation.petPolicy = req.body.petPolicy !== undefined ? req.body.petPolicy : experience.extraInformation.petPolicy;
            experience.extraInformation.emergencyContact = req.body.emergencyContact !== undefined ? req.body.emergencyContact : experience.extraInformation.emergencyContact;
            experience.extraInformation.voucherInfo = req.body.voucherInfo !== undefined ? req.body.voucherInfo : experience.extraInformation.voucherInfo;
            if (req.body.bookingOptions) {
                experience.bookingOptions = req.body.bookingOptions.map(opt => {
                    const isFlat = opt.title !== undefined;
                    return {
                        optionSetup: isFlat ? {
                            title: opt.title,
                            referenceCode: opt.referenceCode,
                            description: opt.description,
                            maxGroupSize: opt.maxGroupSize,
                            languages: opt.languages,
                            audioGuide: { hasAudioGuide: opt.hasAudioGuide, languages: opt.audioGuideLanguages },
                            informationBooklets: { hasBooklets: opt.hasBooklets, languages: opt.bookletLanguages },
                            isPrivateActivity: opt.privateGroup !== undefined ? opt.privateGroup : opt.isPrivateActivity,
                            skipTheLine: { isSkip: opt.skipLine, lineDetails: opt.skipLineType },
                            wheelchairAccessible: opt.wheelchairAccessible,
                            durationOrValidity: { type: opt.durationSelection, value: opt.durationSelection === 'duration' ? `${opt.durationValue || 1} ${opt.durationUnit || 'hours'}` : `${opt.validityValue || 1} ${opt.validityUnit || 'days'}` }
                        } : opt.optionSetup,
                        meetingPointOrPickup: isFlat ? {
                            meetingType: opt.meetingType || 'meeting',
                            meetingAddress: opt.meetingAddress,
                            meetingDescription: opt.meetingDescription,
                            meetingImages: opt.meetingImages,
                            arrivalTime: opt.arrivalTime,
                            dropOffType: opt.dropOffType,
                            dropOffAddress: opt.dropOffAddress,
                            pickupType: opt.pickupType,
                            pickupTimeType: opt.pickupTimeType,
                            pickupConfirmationType: opt.pickupConfirmationType,
                            pickupTimeSlots: opt.pickupTimeSlots,
                            pickupDescription: opt.pickupDescription,
                            transportationType: opt.transportationType
                        } : opt.meetingPointOrPickup,
                        connectivitySettings: isFlat ? {
                            useReservationSystem: opt.useReservationSystem,
                            reservationSystem: opt.reservationSystem,
                            externalProductId: opt.externalProductId
                        } : opt.connectivitySettings,
                        availabilityAndPricing: isFlat ? {
                            capacity: opt.capacity,
                            pricingType: opt.pricingType || 'person',
                            pricingPersonDependency: opt.pricingPersonDependency || 'everyone',
                            price: opt.price,
                            pricingTiers: (opt.pricingPersonDependency || 'everyone') === 'everyone' ? [{ title: 'Adult', minAge: 0, maxAge: 99, price: opt.price || 0 }] : opt.pricingTiers,
                            addons: opt.addons,
                            currency: opt.currency
                        } : {
                            ...opt.availabilityAndPricing,
                            pricingTiers: (opt.availabilityAndPricing && opt.availabilityAndPricing.pricingPersonDependency === 'everyone')
                                ? [{ title: 'Adult', minAge: 0, maxAge: 99, price: opt.availabilityAndPricing.price || 0 }]
                                : (opt.availabilityAndPricing ? opt.availabilityAndPricing.pricingTiers : [])
                        },
                        cutOff: isFlat ? {
                            cutoffHours: opt.cutoffHours || 24,
                            cancellationPolicy: opt.cancellationPolicy || 'free_24h'
                        } : opt.cutOff
                    };
                });
            }

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
        console.error('Update Experience Error:', error);
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


module.exports = {
    getExperiences,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience,
    getMyExperiences,
    getAvailability,
};
