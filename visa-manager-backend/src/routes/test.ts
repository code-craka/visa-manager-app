import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Test endpoint to verify JWT template integration
router.get('/jwt-test', requireAuth, (req, res) => {
  try {
    console.log('JWT Test - User data from token:', req.user);
    
    res.json({
      success: true,
      message: 'JWT template integration working!',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('JWT test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;