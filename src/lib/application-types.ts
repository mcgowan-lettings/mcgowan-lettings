/**
 * Shared contract for the tenant application form (/apply) and the guarantor
 * form (/guarantor) — the same questions, different wording and declaration.
 * Mirrors the `tenant_applications` table in Supabase.
 */

export const APPLICATION_KINDS = ["tenant", "guarantor"] as const;
export type ApplicationKind = (typeof APPLICATION_KINDS)[number];

export function isApplicationKind(value: unknown): value is ApplicationKind {
  return (APPLICATION_KINDS as readonly string[]).includes(value as string);
}

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
  /** Which form was filled in. Absent is treated as "tenant". */
  application_type?: ApplicationKind;
  property_address: string;
  /** Guarantor form only: the tenant being guaranteed. */
  tenant_name?: string;
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
  application_type: ApplicationKind | string;
  property_address: string;
  tenant_name: string | null;
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

export const GUARANTOR_DECLARATION_TEXT =
  "I confirm that I am willing to act as guarantor for the tenant named in this form and that the information I have " +
  "provided is true and correct and contains no misrepresentations. I authorise the Landlord to verify all references " +
  "and facts, including but not limited to current and previous Landlords, employers and personal references, and to " +
  "carry out credit and identity checks. I understand that if I am accepted I will be asked to sign a separate guarantee " +
  "agreement setting out my obligations for the rent and any other sums due under the tenancy, and that incomplete or " +
  "incorrect information provided in this form may cause a delay in processing or may result in the application being declined.";

/** The declaration shown on, and stored with, each kind of form. */
export function declarationFor(kind: ApplicationKind): string {
  return kind === "guarantor" ? GUARANTOR_DECLARATION_TEXT : DECLARATION_TEXT;
}
