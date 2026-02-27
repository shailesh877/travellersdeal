/**
 * Testimonials Seed Script
 * Run: node backend/scripts/seedTestimonials.js
 * Inserts 6 realistic dummy testimonials into MongoDB
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Testimonial = require('../models/Testimonial');

const dummies = [
    {
        name: 'Martin R.',
        location: 'New York, USA',
        rating: 5,
        comment: 'It was a really good experience — my son\'s 1st time in New York and we loved every moment. Definitely glad we booked through Travellers Deal!',
        experienceTitle: 'New York Explorer Pass: Top Attractions including Edge',
        isVerified: true,
        isActive: true,
        displayOrder: 1,
    },
    {
        name: 'Diana K.',
        location: 'London, UK',
        rating: 5,
        comment: 'Wonderful dinner with beautiful views! Definitely a great experience as a solo traveler. The service was top-notch and the food was exquisite.',
        experienceTitle: 'Paris: Seine River Bistronomic Dinner Cruise',
        isVerified: true,
        isActive: true,
        displayOrder: 2,
    },
    {
        name: 'Mike Bryan',
        location: 'Boston, USA',
        rating: 5,
        comment: 'A Day in Washington was an excellent and memorable experience. Our guide Augustin was fantastic — knowledgeable, funny and incredibly helpful.',
        experienceTitle: 'From NYC: Guided Day Trip to Washington DC by Van or Bus',
        isVerified: true,
        isActive: true,
        displayOrder: 3,
    },
    {
        name: 'Ernnie Cheng',
        location: 'San Francisco, USA',
        rating: 5,
        comment: 'Thank you, Jared and Tommy, for the amazing tour, the intriguing context, and for getting us safely around all the attractions in New York. Highly recommend!',
        experienceTitle: 'NYC: Half-Day Luxury Bus Tour of Top Highlights',
        isVerified: true,
        isActive: true,
        displayOrder: 4,
    },
    {
        name: 'Sophie L.',
        location: 'Paris, France',
        rating: 5,
        comment: 'An absolutely magical evening on the Seine. The food was incredible and the views of Paris at night were breathtaking. Would do it again in a heartbeat!',
        experienceTitle: 'Paris Evening Cruise & Fine Dining',
        isVerified: true,
        isActive: true,
        displayOrder: 5,
    },
    {
        name: 'Aidan O.',
        location: 'Dublin, Ireland',
        rating: 4,
        comment: 'Great value for the price. The tour guide was very knowledgeable and made the whole experience very enjoyable. Will definitely book again next time I visit.',
        experienceTitle: 'London: Royal Highlights Walking Tour',
        isVerified: true,
        isActive: true,
        displayOrder: 6,
    },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Remove existing dummy/seeded testimonials (preserve manually added ones by keeping non-seeded)
        const deleted = await Testimonial.deleteMany({
            name: { $in: dummies.map(d => d.name) }
        });
        console.log(`🗑️  Removed ${deleted.deletedCount} old seed records`);

        const inserted = await Testimonial.insertMany(dummies);
        console.log(`🌱 Inserted ${inserted.length} testimonials:`);
        inserted.forEach(t => console.log(`   • ${t.name} — "${t.experienceTitle}"`));

        console.log('\n✅ Done! Refresh homepage to see them in the carousel.');
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();
