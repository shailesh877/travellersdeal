// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private/SuperAdmin
const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new admin
// @route   POST /api/admin/admins
// @access  Private/SuperAdmin
const createAdmin = async (req, res) => {
    try {
        const { name, email, password, adminPermissions } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const adminUser = await User.create({
            name,
            email,
            password,
            role: 'admin',
            isSuperAdmin: false,
            adminPermissions: adminPermissions || [],
            isVerified: true,
            isActive: true
        });

        res.status(201).json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            isSuperAdmin: adminUser.isSuperAdmin,
            adminPermissions: adminUser.adminPermissions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an admin's permissions
// @route   PUT /api/admin/admins/:id
// @access  Private/SuperAdmin
const updateAdmin = async (req, res) => {
    try {
        const { adminPermissions, password, name, email, isActive } = req.body;
        const adminUser = await User.findById(req.params.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (adminUser.isSuperAdmin && req.user._id.toString() !== adminUser._id.toString()) {
            return res.status(403).json({ message: 'You cannot edit another Super Admin' });
        }

        if (name) adminUser.name = name;
        if (email) adminUser.email = email;
        if (adminPermissions) adminUser.adminPermissions = adminPermissions;
        if (isActive !== undefined) adminUser.isActive = isActive;
        if (password) adminUser.password = password; // Will be hashed by pre-save middleware

        await adminUser.save();

        res.json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            isSuperAdmin: adminUser.isSuperAdmin,
            adminPermissions: adminUser.adminPermissions,
            isActive: adminUser.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
