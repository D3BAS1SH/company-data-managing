/**
 * MODEL DOCUMENTATION AND GUIDELINES
 *
 * This file serves as a template and documentation for creating Mongoose models
 * in this TypeScript Express.js application. Follow these patterns and guidelines
 * when creating your data models.
 *
 * ==============================================================================
 * DIRECTORY STRUCTURE
 * ==============================================================================
 *
 * models/
 * ├── user.model.ts           # User authentication and profile data
 * ├── company.model.ts        # Company information and details
 * ├── department.model.ts     # Company departments
 * ├── employee.model.ts       # Employee records
 * ├── project.model.ts        # Project management
 * └── index.ts               # Barrel export for all models
 *
 * ==============================================================================
 * STEP 1: INTERFACE DEFINITIONS
 * ==============================================================================
 *
 * Always start by defining TypeScript interfaces for your data structures.
 * This ensures type safety and better development experience.
 *
 * Example:
 * ```typescript
 * import { Document } from 'mongoose';
 *
 * // Base interface for the data structure
 * interface IUser {
 *   firstName: string;
 *   lastName: string;
 *   email: string;
 *   password: string;
 *   role: 'admin' | 'manager' | 'employee';
 *   isActive: boolean;
 *   avatar?: string;
 *   lastLogin?: Date;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 *
 * // Document interface extending Mongoose Document
 * interface IUserDocument extends IUser, Document {
 *   // Instance methods go here
 *   comparePassword(candidatePassword: string): Promise<boolean>;
 *   generateAuthToken(): string;
 *   getPublicProfile(): Omit<IUser, 'password'>;
 * }
 *
 * // Model interface for static methods
 * interface IUserModel extends Model<IUserDocument> {
 *   // Static methods go here
 *   findByEmail(email: string): Promise<IUserDocument | null>;
 *   findActiveUsers(): Promise<IUserDocument[]>;
 * }
 * ```
 *
 * ==============================================================================
 * STEP 2: SCHEMA DEFINITION
 * ==============================================================================
 *
 * Define the Mongoose schema with proper validation, default values, and indexes.
 *
 * Example:
 * ```typescript
 * import { Schema } from 'mongoose';
 * import bcrypt from 'bcrypt';
 * import jwt from 'jsonwebtoken';
 *
 * const userSchema = new Schema<IUserDocument>({
 *   firstName: {
 *     type: String,
 *     required: [true, 'First name is required'],
 *     trim: true,
 *     maxlength: [50, 'First name cannot exceed 50 characters']
 *   },
 *   lastName: {
 *     type: String,
 *     required: [true, 'Last name is required'],
 *     trim: true,
 *     maxlength: [50, 'Last name cannot exceed 50 characters']
 *   },
 *   email: {
 *     type: String,
 *     required: [true, 'Email is required'],
 *     unique: true,
 *     lowercase: true,
 *     trim: true,
 *     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
 *   },
 *   password: {
 *     type: String,
 *     required: [true, 'Password is required'],
 *     minlength: [8, 'Password must be at least 8 characters'],
 *     select: false // Don't include in queries by default
 *   },
 *   role: {
 *     type: String,
 *     enum: {
 *       values: ['admin', 'manager', 'employee'],
 *       message: 'Role must be admin, manager, or employee'
 *     },
 *     default: 'employee'
 *   },
 *   isActive: {
 *     type: Boolean,
 *     default: true
 *   },
 *   avatar: {
 *     type: String,
 *     default: null
 *   },
 *   lastLogin: {
 *     type: Date,
 *     default: null
 *   }
 * }, {
 *   timestamps: true, // Automatically adds createdAt and updatedAt
 *   toJSON: { virtuals: true }, // Include virtuals in JSON output
 *   toObject: { virtuals: true }
 * });
 * ```
 *
 * ==============================================================================
 * STEP 3: INDEXES
 * ==============================================================================
 *
 * Add database indexes for better query performance.
 *
 * Example:
 * ```typescript
 * // Single field indexes
 * userSchema.index({ email: 1 }); // Unique index automatically created
 * userSchema.index({ role: 1 });
 * userSchema.index({ isActive: 1 });
 * userSchema.index({ createdAt: -1 });
 *
 * // Compound indexes
 * userSchema.index({ role: 1, isActive: 1 });
 * userSchema.index({ firstName: 1, lastName: 1 });
 *
 * // Text search index
 * userSchema.index({
 *   firstName: 'text',
 *   lastName: 'text',
 *   email: 'text'
 * });
 * ```
 *
 * ==============================================================================
 * STEP 4: VIRTUAL PROPERTIES
 * ==============================================================================
 *
 * Define virtual properties that are computed from other fields.
 *
 * Example:
 * ```typescript
 * // Virtual for full name
 * userSchema.virtual('fullName').get(function(this: IUserDocument) {
 *   return `${this.firstName} ${this.lastName}`;
 * });
 *
 * // Virtual for avatar URL
 * userSchema.virtual('avatarUrl').get(function(this: IUserDocument) {
 *   return this.avatar
 *     ? `${process.env.CDN_URL}/avatars/${this.avatar}`
 *     : `${process.env.CDN_URL}/avatars/default.png`;
 * });
 * ```
 *
 * ==============================================================================
 * STEP 5: MIDDLEWARE (HOOKS)
 * ==============================================================================
 *
 * Add pre and post middleware for business logic.
 *
 * Example:
 * ```typescript
 * // Hash password before saving
 * userSchema.pre('save', async function(this: IUserDocument, next) {
 *   if (!this.isModified('password')) return next();
 *
 *   try {
 *     const salt = await bcrypt.genSalt(12);
 *     this.password = await bcrypt.hash(this.password, salt);
 *     next();
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // Update lastLogin on authentication
 * userSchema.pre('findOneAndUpdate', function(this: Query<any, IUserDocument>) {
 *   if (this.getUpdate()?.lastLogin) {
 *     this.set({ lastLogin: new Date() });
 *   }
 * });
 *
 * // Clean up related data on user deletion
 * userSchema.pre('remove', async function(this: IUserDocument, next) {
 *   try {
 *     // Remove user's projects, tasks, etc.
 *     await mongoose.model('Project').deleteMany({ assignedTo: this._id });
 *     next();
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * ```
 *
 * ==============================================================================
 * STEP 6: INSTANCE METHODS
 * ==============================================================================
 *
 * Add methods that can be called on document instances.
 *
 * Example:
 * ```typescript
 * // Compare password for authentication
 * userSchema.methods.comparePassword = async function(
 *   this: IUserDocument,
 *   candidatePassword: string
 * ): Promise<boolean> {
 *   return bcrypt.compare(candidatePassword, this.password);
 * };
 *
 * // Generate JWT token
 * userSchema.methods.generateAuthToken = function(this: IUserDocument): string {
 *   return jwt.sign(
 *     {
 *       id: this._id,
 *       email: this.email,
 *       role: this.role
 *     },
 *     process.env.JWT_SECRET!,
 *     { expiresIn: process.env.JWT_EXPIRE || '7d' }
 *   );
 * };
 *
 * // Get public profile (without sensitive data)
 * userSchema.methods.getPublicProfile = function(this: IUserDocument) {
 *   const userObject = this.toObject();
 *   delete userObject.password;
 *   return userObject;
 * };
 * ```
 *
 * ==============================================================================
 * STEP 7: STATIC METHODS
 * ==============================================================================
 *
 * Add static methods that can be called on the model.
 *
 * Example:
 * ```typescript
 * // Find user by email
 * userSchema.statics.findByEmail = function(
 *   this: IUserModel,
 *   email: string
 * ): Promise<IUserDocument | null> {
 *   return this.findOne({ email }).select('+password');
 * };
 *
 * // Find active users
 * userSchema.statics.findActiveUsers = function(
 *   this: IUserModel
 * ): Promise<IUserDocument[]> {
 *   return this.find({ isActive: true }).sort({ createdAt: -1 });
 * };
 *
 * // Search users by name or email
 * userSchema.statics.searchUsers = function(
 *   this: IUserModel,
 *   searchTerm: string
 * ): Promise<IUserDocument[]> {
 *   return this.find({
 *     $or: [
 *       { $text: { $search: searchTerm } },
 *       { email: { $regex: searchTerm, $options: 'i' } }
 *     ],
 *     isActive: true
 *   });
 * };
 * ```
 *
 * ==============================================================================
 * STEP 8: MODEL CREATION AND EXPORT
 * ==============================================================================
 *
 * Create and export the model with proper typing.
 *
 * Example:
 * ```typescript
 * import { model } from 'mongoose';
 *
 * // Create the model
 * const User = model<IUserDocument, IUserModel>('User', userSchema);
 *
 * // Export interfaces and model
 * export { IUser, IUserDocument, IUserModel };
 * export default User;
 * ```
 *
 * ==============================================================================
 * STEP 9: SWAGGER DOCUMENTATION
 * ==============================================================================
 *
 * Add Swagger/OpenAPI documentation for the model.
 *
 * Example:
 * ```typescript
 * /**
 *  * @swagger
 *  * components:
 *  *   schemas:
 *  *     User:
 *  *       type: object
 *  *       required:
 *  *         - firstName
 *  *         - lastName
 *  *         - email
 *  *         - password
 *  *       properties:
 *  *         _id:
 *  *           type: string
 *  *           description: Auto-generated unique identifier
 *  *         firstName:
 *  *           type: string
 *  *           minLength: 1
 *  *           maxLength: 50
 *  *           description: User's first name
 *  *         lastName:
 *  *           type: string
 *  *           minLength: 1
 *  *           maxLength: 50
 *  *           description: User's last name
 *  *         email:
 *  *           type: string
 *  *           format: email
 *  *           description: User's email address (unique)
 *  *         role:
 *  *           type: string
 *  *           enum: [admin, manager, employee]
 *  *           default: employee
 *  *           description: User's role in the system
 *  *         isActive:
 *  *           type: boolean
 *  *           default: true
 *  *           description: Whether the user account is active
 *  *         avatar:
 *  *           type: string
 *  *           nullable: true
 *  *           description: URL to user's avatar image
 *  *         lastLogin:
 *  *           type: string
 *  *           format: date-time
 *  *           nullable: true
 *  *           description: Last login timestamp
 *  *         createdAt:
 *  *           type: string
 *  *           format: date-time
 *  *           description: Account creation timestamp
 *  *         updatedAt:
 *  *           type: string
 *  *           format: date-time
 *  *           description: Last update timestamp
 *  *       example:
 *  *         _id: "60f7b3b3b3b3b3b3b3b3b3b3"
 *  *         firstName: "John"
 *  *         lastName: "Doe"
 *  *         email: "john.doe@company.com"
 *  *         role: "employee"
 *  *         isActive: true
 *  *         avatar: "avatar-123.jpg"
 *  *         lastLogin: "2023-08-24T10:30:00.000Z"
 *  *         createdAt: "2023-08-01T09:00:00.000Z"
 *  *         updatedAt: "2023-08-24T10:30:00.000Z"
 *  * /
 * ```
 *
 * ==============================================================================
 * BEST PRACTICES
 * ==============================================================================
 *
 * 1. **Type Safety**: Always use TypeScript interfaces for better type checking
 * 2. **Validation**: Add comprehensive validation at the schema level
 * 3. **Indexes**: Create appropriate indexes for query optimization
 * 4. **Security**: Never store sensitive data in plain text
 * 5. **Performance**: Use select() to limit returned fields
 * 6. **Error Handling**: Provide meaningful error messages
 * 7. **Documentation**: Document all schemas with Swagger/JSDoc
 * 8. **Testing**: Write unit tests for model methods
 * 9. **Relationships**: Use proper references for related data
 * 10. **Middleware**: Use pre/post hooks for business logic
 *
 * ==============================================================================
 * COMMON PATTERNS
 * ==============================================================================
 *
 * 1. **Soft Delete**: Add 'deletedAt' field instead of actually deleting
 * 2. **Timestamps**: Always use { timestamps: true }
 * 3. **Slug Generation**: Auto-generate URL-friendly slugs
 * 4. **File Uploads**: Store file paths/URLs, not binary data
 * 5. **Pagination**: Implement cursor-based or offset-based pagination
 * 6. **Search**: Use text indexes for full-text search
 * 7. **Audit Trail**: Track who created/modified records
 * 8. **Versioning**: Implement document versioning if needed
 *
 * Follow these patterns to maintain consistency across your application!
 */
