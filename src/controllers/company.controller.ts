import { Company } from '../models/';
import { ApiError, ApiResponse, asyncHandler } from '../utils';
import { Request, Response } from 'express';
import { industryEnum, IndustryType } from '../models/company.model';

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Company]
 *     description: Add a new company to the database with all required details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the company.
 *                 example: "Tech Corp"
 *               description:
 *                 type: string
 *                 description: A brief description of the company.
 *                 example: "A leading tech company specializing in AI."
 *               industry:
 *                 type: string
 *                 description: The industry the company belongs to.
 *                 example: "Technology"
 *               foundedYear:
 *                 type: integer
 *                 description: The year the company was founded.
 *                 example: 2010
 *               location:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Locations where the company operates.
 *                 example: ["New York", "San Francisco"]
 *               website:
 *                 type: string
 *                 description: The company's website URL.
 *                 example: "https://www.techcorp.com"
 *               email:
 *                 type: string
 *                 description: The company's contact email.
 *                 example: "info@techcorp.com"
 *               phone:
 *                 type: string
 *                 description: The company's contact phone number.
 *                 example: "+1-800-555-1234"
 *               employees:
 *                 type: integer
 *                 description: The number of employees in the company.
 *                 example: 500
 *               logo:
 *                 type: string
 *                 description: URL of the company's logo.
 *                 example: "https://www.techcorp.com/logo.png"
 *               headquarters:
 *                 type: string
 *                 description: The headquarters of the company.
 *                 example: "Silicon Valley"
 *               revenue:
 *                 type: number
 *                 description: The company's annual revenue.
 *                 example: 1000000
 *     responses:
 *       201:
 *         description: Company created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Missing or invalid fields.
 */
export const createCompany = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        description,
        industry,
        foundedYear,
        location,
        website,
        email,
        phone,
        employees,
        logo,
        headquarters,
        revenue,
    } = req.body;
    const errors: string[] = [];

    if (!name?.trim()) errors.push('Name is required');
    if (!email?.trim()) errors.push('Email is required');
    if (!industry) errors.push('Industry is required');

    if (!Array.isArray(location) || location.length === 0) {
        errors.push('At least one location is required');
    } else if (location.some(loc => typeof loc !== 'string' || loc.trim().length === 0)) {
        errors.push('Each location must be a non-empty string');
    }

    if (errors.length > 0) {
        throw ApiError.badRequest('Missing fields', errors);
    }

    const existenceOfCompany = await Company.findOne({
        $or: [
            {
                name: name,
            },
            {
                email: email,
            },
        ],
    });

    if (existenceOfCompany) {
        throw new ApiError(400, 'Already existing company');
    }

    if (!industryEnum.includes(industry as IndustryType)) {
        throw ApiError.badRequest(
            `Invalid industry. Allowed values are: ${industryEnum.join(', ')}`
        );
    }

    const newCompany = await Company.create({
        name,
        description,
        industry,
        foundedYear,
        location,
        website,
        email,
        phone,
        employees,
        logo,
        headquarters,
        revenue,
    });

    if (!newCompany) {
        throw ApiError.internal('Can not create document');
    }

    res.status(201).json(new ApiResponse(201, 'Company created successfully', newCompany));
});

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Company]
 *     description: Fetch a paginated list of companies with selected fields.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of companies per page.
 *     responses:
 *       200:
 *         description: A list of companies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */
export const getAllCompanies = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const companies = await Company.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    industry: 1,
                    foundedYear: 1,
                    location: 1,
                    website: 1,
                    isActive: 1,
                    logo: 1,
                    employeeRange: 1,
                },
            },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
        ]);
        res.status(200).json(companies);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get a company by ID
 *     tags: [Company]
 *     description: Fetch detailed information about a specific company by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company to fetch.
 *     responses:
 *       200:
 *         description: Detailed information about the company.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found.
 */
export const getCompanyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        const companyDetails = {
            ...company.toObject(),
            companyAge: company.getCompanyAge(),
        };
        return res.status(200).json(companyDetails);
    } catch (err) {
        const error = err as Error;
        return res.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /companies/{id}:
 *   patch:
 *     summary: Update a company
 *     tags: [Company]
 *     description: Update specific fields of a company by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: array
 *                 items:
 *                   type: string
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Company updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: No fields provided to update.
 *       404:
 *         description: Company not found.
 */
export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const allowedFields = ['logo', 'description', 'location', 'phone', 'isActive'];
        const updateData: any = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided to update' });
        }

        const company = await Company.findByIdAndUpdate(id, updateData, { new: true });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        return res.status(200).json(company);
    } catch (err) {
        const error = err as Error;
        return res.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete a company
 *     tags: [Company]
 *     description: Remove a company from the database by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company to delete.
 *     responses:
 *       200:
 *         description: Company deleted successfully.
 *       404:
 *         description: Company not found.
 */
export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const company = await Company.findByIdAndDelete(id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        return res.status(200).json({ message: 'Company deleted successfully' });
    } catch (err) {
        const error = err as Error;
        return res.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /companies/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Company]
 *     description: Fetch unique suggestions for companies based on a query.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: The search query.
 *     responses:
 *       200:
 *         description: A list of unique suggestions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
export const searchSuggestion = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (typeof q !== 'string') {
            return res.status(400).json({ message: 'Invalid query parameter' });
        }

        const suggestions = await Company.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
            ],
        }).select('name industry location');

        const result = new Set<string>();

        suggestions.forEach(s => {
            if (s.name.match(new RegExp(q, 'i'))) result.add(s.name);
            if (s.industry.match(new RegExp(q, 'i'))) result.add(s.industry);
            s.location.forEach(loc => {
                if (loc.match(new RegExp(q, 'i'))) result.add(loc);
            });
        });

        return res.status(200).json(Array.from(result));
    } catch (err) {
        const error = err as Error;
        return res.status(500).json({ error: error.message });
    }
};

/**
 * @swagger
 * /companies/search:
 *   get:
 *     summary: Search companies with filters
 *     tags: [Company]
 *     description: Fetch companies based on various filters like name, location, industry, etc.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by company name.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by company location.
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by company industry.
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status.
 *       - in: query
 *         name: employees
 *         schema:
 *           type: integer
 *         description: Filter by minimum number of employees.
 *       - in: query
 *         name: createdAt
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date.
 *       - in: query
 *         name: foundedYear
 *         schema:
 *           type: integer
 *         description: Filter by the year the company was founded.
 *     responses:
 *       200:
 *         description: A list of companies matching the filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */
export const searchCompanies = async (req: Request, res: Response) => {
    try {
        const { name, location, industry, isActive, employees, createdAt, foundedYear } = req.query;
        const filters: any = {};

        if (name) filters.name = { $regex: name, $options: 'i' };
        if (location) filters.location = { $regex: location, $options: 'i' };
        if (industry) filters.industry = industry;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (employees) filters.employees = { $gte: Number(employees) };
        if (createdAt) filters.createdAt = { $gte: new Date(createdAt as string) };
        if (foundedYear) filters.foundedYear = Number(foundedYear);

        const companies = await Company.find(filters).lean();
        res.status(200).json(companies);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
};
