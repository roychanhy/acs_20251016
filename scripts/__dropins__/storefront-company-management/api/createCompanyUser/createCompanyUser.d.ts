import { CreateCompanyUserInput, CreateCompanyUserResult } from '../../types/api/createCompanyUser.types';

/**
 * Creates a new company user with the provided information
 *
 * @param input - User information including email, name, job title, and role
 * @returns Promise resolving to created user result or null if creation failed
 * @throws {Error} When network errors or GraphQL errors occur
 */
export declare function createCompanyUser(input: CreateCompanyUserInput): Promise<CreateCompanyUserResult | null>;
//# sourceMappingURL=createCompanyUser.d.ts.map