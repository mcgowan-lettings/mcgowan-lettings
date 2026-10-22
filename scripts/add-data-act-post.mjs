import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const title =
  "The New UK Data Protection Rules: What the Data (Use and Access) Act 2025 Means for Landlords, Tenants and Letting Agents";

const slug = "data-use-and-access-act-2025-landlords-tenants-letting-agents";

const excerpt =
  "The Data (Use and Access) Act 2025 updates UK GDPR, the Data Protection Act 2018 and PECR. Here's what it means for how letting agents handle landlord and tenant information — from subject access requests and the new data protection complaints rules to cookies, marketing and automated decisions.";

const content = `<p>Data protection is an important part of running a professional letting and property management business. From handling tenant applications and landlord details to managing tenancy agreements, maintenance requests and rent payments, letting agents work with a considerable amount of personal information every day.</p>
<p>With changes introduced by the Data (Use and Access) Act 2025, it is important for letting agents, landlords and property managers to understand how the updated rules affect the way personal information is collected, stored, shared and protected.</p>
<p>The Act received Royal Assent on 19 June 2025 and introduces changes to the UK's existing data protection framework, including the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018 and the Privacy and Electronic Communications Regulations (PECR). The changes have been introduced in stages, with the main data protection reforms taking effect on 5 February 2026 and the new requirements for handling data protection complaints coming into force on 19 June 2026. The wider Act has additional implementation dates.</p>
<p>For letting and property management agencies, these developments provide an important opportunity to review existing procedures, ensure personal information is handled responsibly and maintain the trust of landlords and tenants.</p>

<h2>Why Is Data Protection So Important in the Property Industry?</h2>
<p>Letting agents handle personal information throughout the rental process. This can begin when a prospective tenant makes an enquiry about a property and continue throughout the tenancy and beyond.</p>
<p>Information commonly handled by letting agents includes:</p>
<ul>
<li>Names, addresses, telephone numbers and email addresses.</li>
<li>Tenant applications, referencing information and employment details.</li>
<li>Financial information used for affordability assessments and rent payments.</li>
<li>Landlord contact details and property ownership information.</li>
<li>Tenancy agreements, correspondence and records of maintenance issues.</li>
<li>Guarantor details and information supplied by contractors or other relevant parties.</li>
</ul>
<p>Some of this information may be confidential or particularly sensitive. If it is disclosed to the wrong person, lost or used inappropriately, it can cause distress and potentially expose individuals to financial or other harm.</p>
<p>For this reason, letting agents should have clear procedures for handling personal information securely and sharing it only where there is an appropriate reason to do so.</p>
<p>Data protection is not simply about complying with legislation. It is also about providing a professional service, protecting the people you work with and demonstrating that their information is treated with care.</p>

<h2>What Is the Data (Use and Access) Act 2025?</h2>
<p>The Data (Use and Access) Act 2025 updates parts of the UK's existing data protection and privacy legislation. It does not replace the UK GDPR or the Data Protection Act 2018.</p>
<p>Instead, it introduces changes intended to clarify certain requirements, support responsible use of information and modernise aspects of the regulatory framework.</p>
<p>For letting agents, the most relevant areas include:</p>
<ul>
<li>How requests for personal information are handled.</li>
<li>The introduction of formal data protection complaints procedures.</li>
<li>The use of automated decision-making systems.</li>
<li>Website cookies and electronic marketing.</li>
<li>The secure and lawful handling of personal information.</li>
</ul>
<p>The extent to which individual changes affect an agency will depend on how it operates, the systems it uses and the type of information it processes.</p>

<h2>How Will the Changes Affect Letting and Property Management Agencies?</h2>

<h3>1. Protecting Landlord and Tenant Information</h3>
<p>One of the most important responsibilities for any letting agent is ensuring that personal information is kept secure.</p>
<p>Landlords and tenants expect their information to be handled professionally, whether it is stored in a property management system, held in an email account or included in a tenancy file.</p>
<p>Agencies should regularly review who has access to personal information and ensure that appropriate security measures are in place.</p>
<p>This may include using secure software, strong passwords, multi-factor authentication where available, controlled access to files and suitable procedures for sharing documents.</p>
<p>Information should only be shared with landlords, tenants, contractors, referencing companies and other third parties where there is a lawful and appropriate reason.</p>
<p>For example, a contractor may need a tenant's contact details to arrange a repair, but would not ordinarily need access to the tenant's full referencing information or financial records.</p>
<p>Taking a proportionate approach to information sharing helps protect privacy while allowing the agency to provide an efficient property management service.</p>

<h3>2. Understanding Subject Access Requests</h3>
<p>Under data protection law, individuals can ask an organisation for access to their personal information. These requests are commonly known as subject access requests.</p>
<p>In the property industry, a request might come from a current tenant, a former tenant, a landlord or another individual whose information is held by the agency.</p>
<p>For example, a tenant may want to obtain copies of emails and records relating to a repair dispute, while a landlord may wish to access personal information held about them.</p>
<p>The Data (Use and Access) Act 2025 clarifies aspects of how these requests should be handled, including the need to carry out reasonable and proportionate searches and circumstances in which the response period may be paused while necessary information is obtained from the requester.</p>
<p>Letting agents should ensure that staff understand how to recognise these requests and know who is responsible for managing them.</p>
<p>It is also important to remember that a subject access request does not automatically entitle someone to receive every document in full. Information relating to other individuals and applicable exemptions may need to be considered before disclosure.</p>
<p>Having a clear process can help an agency respond appropriately, protect confidentiality and meet its legal obligations.</p>

<h3>3. A Clearer Process for Data Protection Complaints</h3>
<p>A significant change for organisations is the introduction of a formal requirement to facilitate and respond to data protection complaints.</p>
<p>These provisions came into force on 19 June 2026.</p>
<p>If an individual believes that their personal information has been handled in a way that breaches data protection law, they should have a clear and accessible way to raise the concern with the organisation.</p>
<p>For a letting agency, this could involve a complaint about information being sent to the wrong recipient, personal details being shared inappropriately or a concern about how records have been handled.</p>
<p>Under the new requirements, organisations must facilitate complaints, acknowledge receipt within 30 days, take appropriate steps to respond without undue delay and inform the complainant of the outcome.</p>
<p>Agencies should therefore ensure that their complaints procedures clearly explain how data protection concerns can be raised and how they will be investigated.</p>
<p>It is sensible to designate responsibility for handling these complaints, maintain appropriate records and ensure that staff know when an issue needs to be escalated.</p>
<p>A well-managed complaints process can help identify mistakes, improve internal procedures and reassure landlords and tenants that their concerns will be taken seriously.</p>

<h3>4. Reviewing Website Cookies and Electronic Marketing</h3>
<p>Many letting agencies rely on their websites to advertise available properties, attract new landlords and provide information to prospective tenants.</p>
<p>Websites may use cookies and similar technologies to remember preferences, analyse visitor activity or support marketing activities.</p>
<p>The Data (Use and Access) Act 2025 introduces limited exemptions from consent requirements for certain types of storage and access technologies where the relevant legal conditions are satisfied. However, it does not remove the general need to comply with applicable cookie and privacy rules.</p>
<p>Agencies should review their website cookies, privacy notices and consent mechanisms to ensure they reflect the technologies being used.</p>
<p>Electronic marketing should also be reviewed. If your agency sends newsletters, landlord updates, property promotions or other marketing emails, it is important to ensure that the applicable PECR requirements are met.</p>
<p>This includes understanding when consent is required, whether a relevant exception applies and how recipients can opt out of marketing communications.</p>
<p>Clear, transparent communication helps protect individuals' privacy while allowing agencies to maintain appropriate relationships with their customers.</p>

<h3>5. Using Technology and Automated Decision-Making Responsibly</h3>
<p>Technology is becoming increasingly important in the property industry. Letting agents may use digital referencing platforms, automated affordability checks, customer management systems and other tools to help manage applications and assess information.</p>
<p>The Act changes the framework governing certain decisions made solely through automated processing, including decisions that have legal or similarly significant effects on individuals.</p>
<p>The rules depend on the circumstances and the type of personal information involved. Relevant safeguards can include providing information about significant decisions, allowing individuals to make representations or challenge decisions, and enabling meaningful human intervention.</p>
<p>For letting agents, this makes it important to understand how any automated systems used by the business operate.</p>
<p>If a system plays a role in assessing tenant applications or making significant decisions about prospective tenants, the agency should establish whether the automated decision-making provisions apply and ensure the required safeguards are in place.</p>
<p>Using technology can improve efficiency, but it should not come at the expense of fairness, transparency or appropriate human oversight.</p>

<h3>6. Keeping Records and Reviewing Internal Procedures</h3>
<p>Good record-keeping remains an important part of effective property management.</p>
<p>Letting agencies should understand what personal information they hold, why it is needed, where it is stored and who can access it.</p>
<p>They should also have appropriate retention policies so that personal information is not kept indefinitely without a valid reason.</p>
<p>For example, an agency may need to retain certain tenancy and financial records to meet legal or regulatory obligations. Other information may no longer be necessary once the relevant purpose has ended and applicable retention requirements have been satisfied.</p>
<p>Regular reviews can help identify outdated records, unnecessary copies of documents and information that should be securely deleted.</p>
<p>Agencies should also review staff training, data breach procedures and arrangements with third-party software providers and service suppliers.</p>
<p>These practical measures help demonstrate that personal information is being managed responsibly and in accordance with applicable requirements.</p>

<h2>What Should Landlords and Tenants Expect From Their Letting Agent?</h2>
<p>Landlords and tenants should be able to expect their letting agent to handle personal information carefully and transparently.</p>
<p>This includes explaining how information is used, taking reasonable steps to keep it secure, sharing it appropriately and providing a clear way to raise concerns.</p>
<p>Landlords may provide personal details when appointing an agent, receiving rental statements or arranging property repairs. Tenants may provide information during referencing, throughout their tenancy and when reporting maintenance issues.</p>
<p>In each case, the agency should collect information that is relevant to its work, explain its purposes and handle it in accordance with data protection requirements.</p>
<p>Individuals also have rights under data protection law, including the right to request access to their personal data and, where the relevant conditions are met, rights to rectification, erasure and objection.</p>
<p>The new complaints requirements provide another important route for individuals to raise concerns about the handling of their personal information.</p>
<p>By maintaining clear procedures and communicating openly, letting agents can help landlords and tenants feel more confident about the way their information is managed.</p>

<h2>What Can Letting Agents Do to Prepare?</h2>
<p>The changes provide a useful opportunity for property agencies to review their existing arrangements and identify any areas that need attention.</p>
<p>Practical steps include:</p>
<ul>
<li><strong>Reviewing privacy notices:</strong> Ensure that your website and business documentation explain how personal information is collected, used, shared and retained.</li>
<li><strong>Checking data security:</strong> Review access permissions, passwords, software security and the way documents are sent and stored.</li>
<li><strong>Updating complaints procedures:</strong> Make sure individuals can raise data protection concerns easily and that complaints are acknowledged and handled within the applicable requirements.</li>
<li><strong>Reviewing subject access requests:</strong> Ensure that staff know how to identify requests and follow the correct process for searching, reviewing and disclosing information.</li>
<li><strong>Checking marketing and cookies:</strong> Review website tracking technologies, marketing emails and relevant consent or opt-out procedures.</li>
<li><strong>Training employees:</strong> Ensure that everyone who handles personal information understands their responsibilities and knows how to report a potential data breach.</li>
<li><strong>Reviewing third-party providers:</strong> Check that the arrangements with referencing companies, property management software providers and other service suppliers are appropriate for the information they handle.</li>
</ul>
<p>Not every agency will need to make extensive changes. The important thing is to understand which requirements apply to your business and ensure that existing policies and procedures remain suitable.</p>

<h2>Our Commitment to Responsible Property Management</h2>
<p>As a letting and property management agency, we recognise the importance of handling personal information with care, professionalism and respect.</p>
<p>Our work involves building relationships with landlords, tenants and other professionals, and protecting the information entrusted to us is an important part of maintaining those relationships.</p>
<p>We believe that clear communication, appropriate security measures and well-managed procedures are essential to providing a reliable property management service.</p>
<p>The Data (Use and Access) Act 2025 is a timely reminder for businesses across the property sector to review their responsibilities and continue improving the way personal information is managed.</p>
<p>By keeping our procedures under review and paying attention to developments in data protection law, we aim to support a professional and transparent service for the people we work with.</p>

<h2>Final Thoughts</h2>
<p>The Data (Use and Access) Act 2025 introduces important changes to the UK's data protection framework, with practical implications for letting agents and property managers.</p>
<p>From protecting landlord and tenant information to handling subject access requests, reviewing marketing practices and introducing an appropriate data protection complaints process, there are several areas for agencies to consider.</p>
<p>Although these changes do not mean every letting agency must overhaul its entire business, they reinforce the importance of having clear, secure and effective procedures in place.</p>
<p>For landlords and tenants, knowing that their information is handled responsibly can provide additional reassurance when working with a property professional.</p>
<p>For letting agents, maintaining good data protection practices is an important part of running a responsible business and building lasting relationships based on trust.</p>
<p>If you are a landlord or tenant and have questions about how your personal information is handled, please <a href="/contact">contact our team</a>, who will be happy to direct your enquiry appropriately.</p>`;

const { data: existing } = await supabase
  .from("blog_posts")
  .select("id, slug")
  .eq("slug", slug)
  .maybeSingle();

if (existing) {
  console.log(`Post with slug "${slug}" already exists (id: ${existing.id}). Aborting.`);
  process.exit(1);
}

const { data, error } = await supabase
  .from("blog_posts")
  .insert({
    title,
    slug,
    excerpt,
    content,
    cover_image: null,
    published: false,
  })
  .select()
  .single();

if (error) {
  console.error("Insert failed:", error);
  process.exit(1);
}

console.log("Inserted blog post:");
console.log(`  id: ${data.id}`);
console.log(`  slug: ${data.slug}`);
console.log(`  published: ${data.published}`);
console.log(`  public URL: /blog/${data.slug}`);
console.log(`  admin URL: /admin/blog/${data.id}`);
