import express from 'express';
import { getAllSubstances, getSubstanceById, getSubstancesByCategory, getCategories } from '../data/substances.js';

const router = express.Router();

/**
 * GET /api/v1/substances - Get all substances
 */
router.get('/', (req, res) => {
  try {
    const substances = getAllSubstances();
    res.json({
      success: true,
      count: substances.length,
      data: substances
    });
  } catch (error) {
    console.error('Error fetching substances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch substances' });
  }
});

/**
 * GET /api/v1/substances/categories - Get all categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/v1/substances/category/:category - Get substances by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const substances = getSubstancesByCategory(category);

    if (substances.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Category '${category}' not found`
      });
    }

    res.json({
      success: true,
      category,
      count: substances.length,
      data: substances
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
});

/**
 * GET /api/v1/substances/:id - Get substance by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const substance = getSubstanceById(id);

    if (!substance) {
      return res.status(404).json({
        success: false,
        error: `Substance '${id}' not found`
      });
    }

    res.json({
      success: true,
      data: substance
    });
  } catch (error) {
    console.error('Error fetching substance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch substance' });
  }
});

export default router;
