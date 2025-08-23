/**
 * Models Index File
 *
 * This file exports all Mongoose models for easier importing
 * throughout the application.
 */

// Import and export Company model
export { default as Company } from './company.model';
export type { ICompany, ICompanyDocument, ICompanyModel, IndustryType } from './company.model';

// Add more model exports as you create them:
// export { default as User } from './user.model';
// export { default as Department } from './department.model';
// export { default as Employee } from './employee.model';
// export { default as Project } from './project.model';

// Example of how to import in other files:
// import { Company, User } from '@/models';
// or
// import { Company, ICompany } from '../models';
