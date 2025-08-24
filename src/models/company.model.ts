import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Company Model
 *
 * This model represents company information in the system.
 * It includes company details, contact information, and business metrics.
 */

// Industry enum for validation
export const industryEnum = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Financial Services',
    'Retail',
    'Education',
    'Construction',
    'Transportation',
    'Entertainment',
    'Other',
] as const;

type IndustryType = (typeof industryEnum)[number];

/**
 * Base Company Interface
 */
interface ICompany {
    name: string;
    description?: string;
    industry: IndustryType;
    foundedYear?: number;
    location: string[];
    website?: string;
    email: string;
    phone?: string;
    employees?: number;
    isActive: boolean;
    logo?: string;
    headquarters?: string;
    revenue?: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Company Document Interface (extends Mongoose Document)
 */
interface ICompanyDocument extends ICompany, Document {
    // Instance methods
    getEmployeeRange(): string;
    getCompanyAge(): number;
    getPublicProfile(): Omit<ICompany, 'email' | 'revenue'>;
}

/**
 * Company Model Interface (for static methods)
 */
interface ICompanyModel extends Model<ICompanyDocument> {
    // Static methods
    findByIndustry(industry: IndustryType): Promise<ICompanyDocument[]>;
    findActiveCompanies(): Promise<ICompanyDocument[]>;
    searchCompanies(searchTerm: string): Promise<ICompanyDocument[]>;
    getCompanyStats(): Promise<any>;
}

/**
 * Company Schema Definition
 */
const companySchema = new Schema<ICompanyDocument>(
    {
        name: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            maxlength: [100, 'Company name cannot exceed 100 characters'],
            unique: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        industry: {
            type: String,
            required: [true, 'Industry is required'],
            enum: {
                values: industryEnum,
                message: 'Please select a valid industry',
            },
        },
        foundedYear: {
            type: Number,
            min: [1800, 'Founded year must be after 1800'],
            max: [new Date().getFullYear(), 'Founded year cannot be in the future'],
            validate: {
                validator: function (value: number) {
                    return !value || (value >= 1800 && value <= new Date().getFullYear());
                },
                message: 'Please provide a valid founded year',
            },
        },
        location: {
            type: [String],
            required: [true, 'At least one location is required'],
            validate: {
                validator: function (value: string[]) {
                    return value.length > 0 && value.every(loc => loc.length <= 200);
                },
                message: 'Each location must not exceed 200 characters',
            },
        },
        website: {
            type: String,
            trim: true,
            validate: {
                validator: function (value: string) {
                    if (!value) return true;
                    const urlRegex = /^https?:\/\/.+\..+/;
                    return urlRegex.test(value);
                },
                message: 'Please provide a valid website URL',
            },
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function (value: string) {
                    if (!value) return true;
                    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
                },
                message: 'Please provide a valid phone number',
            },
        },
        employees: {
            type: Number,
            min: [1, 'Employee count must be at least 1'],
            max: [10000000, 'Employee count seems unrealistic'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        logo: {
            type: String,
            trim: true,
        },
        headquarters: {
            type: String,
            trim: true,
            maxlength: [200, 'Headquarters cannot exceed 200 characters'],
        },
        revenue: {
            type: Number,
            min: [0, 'Revenue cannot be negative'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * Indexes for better query performance
 */
companySchema.index({ name: 'text', description: 'text' }); // Text search
companySchema.index({ industry: 1 }); // Industry filtering
companySchema.index({ location: 1 }); // Location filtering
companySchema.index({ isActive: 1 }); // Active company filtering
companySchema.index({ createdAt: -1 }); // Recent companies
companySchema.index({ employees: 1 }); // Employee count sorting
companySchema.index({ industry: 1, location: 1 }); // Compound index

/**
 * Virtual Properties
 */
companySchema.virtual('companyAge').get(function (this: ICompanyDocument) {
    if (!this.foundedYear) return null;
    return new Date().getFullYear() - this.foundedYear;
});

companySchema.virtual('employeeRange').get(function (this: ICompanyDocument) {
    if (!this.employees) return 'Not specified';
    if (this.employees < 10) return '1-10';
    if (this.employees < 50) return '11-50';
    if (this.employees < 200) return '51-200';
    if (this.employees < 1000) return '201-1000';
    return '1000+';
});

/**
 * Instance Methods
 */
companySchema.methods.getEmployeeRange = function (this: ICompanyDocument): string {
    if (!this.employees) return 'Not specified';
    if (this.employees < 10) return '1-10';
    if (this.employees < 50) return '11-50';
    if (this.employees < 200) return '51-200';
    if (this.employees < 1000) return '201-1000';
    return '1000+';
};

companySchema.methods.getCompanyAge = function (this: ICompanyDocument): number {
    if (!this.foundedYear) return 0;
    return new Date().getFullYear() - this.foundedYear;
};

companySchema.methods.getPublicProfile = function (this: ICompanyDocument) {
    const companyObject = this.toObject();
    delete companyObject.email;
    delete companyObject.revenue;
    return companyObject;
};

/**
 * Static Methods
 */
companySchema.statics.findByIndustry = function (
    industry: IndustryType
): Promise<ICompanyDocument[]> {
    return this.find({ industry, isActive: true }).sort({ createdAt: -1 });
};

companySchema.statics.findActiveCompanies = function (): Promise<ICompanyDocument[]> {
    return this.find({ isActive: true }).sort({ name: 1 });
};

companySchema.statics.searchCompanies = function (searchTerm: string): Promise<ICompanyDocument[]> {
    return this.find({
        $or: [
            { $text: { $search: searchTerm } },
            { name: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } },
        ],
        isActive: true,
    }).sort({ name: 1 });
};

companySchema.statics.getCompanyStats = function () {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$industry',
                count: { $sum: 1 },
                averageEmployees: { $avg: '$employees' },
                totalEmployees: { $sum: '$employees' },
            },
        },
        { $sort: { count: -1 } },
    ]);
};

/**
 * Pre-save middleware
 */
companySchema.pre('save', function (this: ICompanyDocument, next) {
    // Ensure website has protocol
    if (this.website && !this.website.startsWith('http')) {
        this.website = `https://${this.website}`;
    }
    next();
});

/**
 * Create and export the model
 */
const Company = mongoose.model<ICompanyDocument, ICompanyModel>('Company', companySchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *         - industry
 *         - location
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Company name (unique)
 *           example: "Tech Solutions Inc"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Company description
 *           example: "Leading provider of innovative technology solutions"
 *         industry:
 *           type: string
 *           enum: [Technology, Healthcare, Manufacturing, Financial Services, Retail, Education, Construction, Transportation, Entertainment, Other]
 *           description: Company industry
 *           example: "Technology"
 *         foundedYear:
 *           type: integer
 *           minimum: 1800
 *           maximum: 2025
 *           description: Year the company was founded
 *           example: 2010
 *         location:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 200
 *           description: Company location(s)
 *           example: ["San Francisco, CA, USA", "New York, NY, USA"]
 *         website:
 *           type: string
 *           description: Company website URL
 *           example: "https://techsolutions.com"
 *         email:
 *           type: string
 *           format: email
 *           description: Company email address (unique)
 *           example: "contact@techsolutions.com"
 *         phone:
 *           type: string
 *           description: Company phone number
 *           example: "+1-555-123-4567"
 *         employees:
 *           type: integer
 *           minimum: 1
 *           description: Number of employees
 *           example: 150
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the company is active
 *         logo:
 *           type: string
 *           description: URL to company logo
 *           example: "https://cdn.example.com/logos/company-logo.png"
 *         headquarters:
 *           type: string
 *           maxLength: 200
 *           description: Company headquarters location
 *           example: "123 Tech Street, San Francisco, CA"
 *         revenue:
 *           type: number
 *           minimum: 0
 *           description: Company annual revenue
 *           example: 5000000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *         companyAge:
 *           type: integer
 *           description: Virtual field - age of the company in years
 *           example: 15
 *         employeeRange:
 *           type: string
 *           description: Virtual field - employee count range
 *           example: "51-200"
 *       example:
 *         _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         name: "Tech Solutions Inc"
 *         description: "Leading provider of innovative technology solutions"
 *         industry: "Technology"
 *         foundedYear: 2010
 *         location: ["San Francisco, CA, USA", "New York, NY, USA"]
 *         website: "https://techsolutions.com"
 *         email: "contact@techsolutions.com"
 *         phone: "+1-555-123-4567"
 *         employees: 150
 *         isActive: true
 *         logo: "https://cdn.example.com/logos/tech-solutions.png"
 *         headquarters: "123 Tech Street, San Francisco, CA"
 *         revenue: 5000000
 *         createdAt: "2023-08-01T09:00:00.000Z"
 *         updatedAt: "2023-08-24T10:30:00.000Z"
 */

export { ICompany, ICompanyDocument, ICompanyModel, IndustryType };
export default Company;
