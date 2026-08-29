/**
 * Shared contract for the tenant application form (/apply).
 * Mirrors the `tenant_applications` table in Supabase.
 */

export const EMPLOYMENT_STATUSES = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Student",
  "Retired",
  "Unemployed",
  "Other",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** What the public form submits. */
export interface ApplicationFormData {
  property_address: string;
  rent_pcm?: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string; // ISO yyyy-mm-dd
  ni_number: string;
  current_address: string;
  period_at_address: string;
  employment_status: EmploymentStatus | string;
  employer?: string;
  job_title?: string;
  employment_start_date?: string;
  monthly_income: string;
  declaration_agreed: boolean;
  signature_data_url: string; // PNG data URL from the signature pad
  signed_name: string;
  /** Honeypot — must be empty. */
  website?: string;
}

/** A row from `tenant_applications`. */
export interface TenantApplicationRow {
  id: string;
  property_address: string;
  rent_pcm: string | null;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  ni_number: string;
  current_address: string;
  period_at_address: string;
  employment_status: string;
  employer: string | null;
  job_title: string | null;
  employment_start_date: string | null;
  monthly_income: string;
  declaration_agreed: boolean;
  signature_data_url: string;
  signed_name: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  read: boolean;
  created_at: string;
}

export const DECLARATION_TEXT =
  "I declare that the information I have provided is true and correct and contains no misrepresentations. " +
  "If misrepresentations are found after a residential lease agreement is entered into between the Landlord and Applicant, " +
  "the Landlord will have the option to terminate the residential lease agreement and seek all available remedies. " +
  "The Applicant authorises the Landlord to verify all references and facts, including but not limited to current and previous " +
  "Landlords, employers and personal references. The Applicant understands that incomplete or incorrect information " +
  "provided in the application may cause a delay in processing or may result in the denial of the application.";
