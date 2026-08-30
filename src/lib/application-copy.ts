/**
 * Wording for the two flavours of the same form: the tenant application
 * (/apply) and the guarantor form (/guarantor). Keeping it in one place stops
 * the page, the form, the PDF and the two emails drifting apart.
 */

import { declarationFor, type ApplicationKind } from "@/lib/application-types";

export interface ApplicationCopy {
  kind: ApplicationKind;
  /** Person filling the form in, lower case, for use mid-sentence. */
  person: string;
  metaTitle: string;
  metaDescription: string;
  heroKicker: string;
  heroTitle: string;
  heroIntro: string;
  step1Title: string;
  step1Intro: string;
  step2Intro: string;
  step4Intro: string;
  step5Intro: string;
  declaration: string;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successBody: string;
  privacyNote: string;
  /** PDF heading and email subject line stem. */
  documentTitle: string;
  signatureCaption: string;
  filenamePrefix: string;
  adminEmailHeading: string;
  applicantEmailSubject: string;
}

export const APPLICATION_COPY: Record<ApplicationKind, ApplicationCopy> = {
  tenant: {
    kind: "tenant",
    person: "applicant",
    metaTitle: "Tenant Application Form | McGowan Lettings",
    metaDescription:
      "Complete and sign your tenancy application for McGowan Residential Lettings.",
    heroKicker: "Tenants",
    heroTitle: "Tenant Application Form",
    heroIntro:
      "Takes around five minutes. Fill in your details, read the declaration and sign with your finger — we'll do the rest.",
    step1Title: "The property",
    step1Intro:
      "The home you're applying for. We've filled this in if David sent you a link.",
    step2Intro: "Your contact details and where you live now.",
    step4Intro: "Please read this carefully before signing.",
    step5Intro: "Sign below to confirm your application.",
    declaration: declarationFor("tenant"),
    submitLabel: "Submit application",
    submittingLabel: "Sending your application…",
    successTitle: "Application sent",
    successBody: "A copy of your signed application has been emailed to",
    privacyNote:
      "Your details are used only to assess this tenancy application and are handled in line with our",
    documentTitle: "Residential Rental Application",
    signatureCaption: "Signature of applicant",
    filenamePrefix: "Application",
    adminEmailHeading: "New Tenant Application",
    applicantEmailSubject:
      "Your application to McGowan Lettings — copy for your records",
  },
  guarantor: {
    kind: "guarantor",
    person: "guarantor",
    metaTitle: "Guarantor Application Form | McGowan Lettings",
    metaDescription:
      "Complete and sign your guarantor form for McGowan Residential Lettings.",
    heroKicker: "Guarantors",
    heroTitle: "Guarantor Application Form",
    heroIntro:
      "Takes around five minutes. Fill in your details, read the declaration and sign with your finger — we'll do the rest.",
    step1Title: "The tenancy you're guaranteeing",
    step1Intro:
      "The tenant and the property you're acting as guarantor for. We've filled the property in if David sent you a link.",
    step2Intro: "Your contact details and where you live now.",
    step4Intro: "Please read this carefully before signing.",
    step5Intro: "Sign below to confirm your guarantor application.",
    declaration: declarationFor("guarantor"),
    submitLabel: "Submit guarantor form",
    submittingLabel: "Sending your form…",
    successTitle: "Guarantor form sent",
    successBody: "A copy of your signed guarantor form has been emailed to",
    privacyNote:
      "Your details are used only to assess this guarantor application and are handled in line with our",
    documentTitle: "Guarantor Application",
    signatureCaption: "Signature of guarantor",
    filenamePrefix: "Guarantor",
    adminEmailHeading: "New Guarantor Application",
    applicantEmailSubject:
      "Your guarantor form for McGowan Lettings — copy for your records",
  },
};

export function copyFor(kind: ApplicationKind | string | null | undefined): ApplicationCopy {
  return kind === "guarantor" ? APPLICATION_COPY.guarantor : APPLICATION_COPY.tenant;
}
