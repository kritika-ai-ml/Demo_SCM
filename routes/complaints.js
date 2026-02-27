const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create new complaint (residents only)
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, description, and category'
            });
        }

        // Process uploaded files
        const attachments = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        // Create complaint
        const complaint = new Complaint({
            title,
            description,
            category,
            priority: priority || 'Medium',
            userId: req.user.id,
            attachments
        });

        await complaint.save();

        // Populate user details
        await complaint.populate('userId', 'name email flatNumber phoneNumber');

        res.status(201).json({
            success: true,
            message: 'Complaint created successfully',
            complaint
        });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating complaint',
            error: error.message
        });
    }
});

// Get all complaints (admin: all, resident: own complaints)
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, category, priority, search } = req.query;

        // Build query
        let query = {};

        // Residents can only see their own complaints
        if (req.user.role === 'resident') {
            query.userId = req.user.id;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by priority
        if (priority) {
            query.priority = priority;
        }

        // Search in title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const complaints = await Complaint.find(query)
            .populate('userId', 'name email flatNumber phoneNumber')
            .populate('comments.user', 'name role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: complaints.length,
            complaints
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints',
            error: error.message
        });
    }
});

// Get single complaint
router.get('/:id', authenticate, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('userId', 'name email flatNumber phoneNumber')
            .populate('comments.user', 'name role');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Residents can only view their own complaints
        if (req.user.role === 'resident' && complaint.userId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            complaint
        });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaint',
            error: error.message
        });
    }
});

// Update complaint (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { status, assignedTo, priority } = req.body;

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Update fields
        if (status) complaint.status = status;
        if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
        if (priority) complaint.priority = priority;

        await complaint.save();
        await complaint.populate('userId', 'name email flatNumber phoneNumber');

        res.json({
            success: true,
            message: 'Complaint updated successfully',
            complaint
        });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint',
            error: error.message
        });
    }
});

// Add comment to complaint
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Residents can only comment on their own complaints
        if (req.user.role === 'resident' && complaint.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        complaint.comments.push({
            user: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            text
        });

        await complaint.save();
        await complaint.populate('comments.user', 'name role');

        res.json({
            success: true,
            message: 'Comment added successfully',
            complaint
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
});

// Delete complaint (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.deleteOne();

        res.json({
            success: true,
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        console.error('Delete complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting complaint',
            error: error.message
        });
    }
});

// Get statistics (admin only)
router.get('/stats/overview', authenticate, isAdmin, async (req, res) => {
    try {
        const total = await Complaint.countDocuments();
        const pending = await Complaint.countDocuments({ status: 'Pending' });
        const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
        const resolved = await Complaint.countDocuments({ status: 'Resolved' });
        const rejected = await Complaint.countDocuments({ status: 'Rejected' });

        res.json({
            success: true,
            stats: {
                total,
                pending,
                inProgress,
                resolved,
                rejected
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

module.exports = router;
