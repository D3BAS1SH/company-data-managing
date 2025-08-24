import {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    searchSuggestion,
    searchCompanies,
} from '../controllers/company.controller';
import { Router } from 'express';

const router = Router();

router.post('/', createCompany);

// Search & Filter
router.get('/search/suggestions', searchSuggestion);
router.get('/search', searchCompanies);

// Basic CRUD
router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);
router.patch('/:id', updateCompany);
router.delete('/:id', deleteCompany);

// // Analytics
// router.get('/stats/industry', companyController.getIndustryStats);

export default router;
