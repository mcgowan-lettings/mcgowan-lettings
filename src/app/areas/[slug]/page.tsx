import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  ArrowRightIcon,
  MapPinIcon,
  HomeIcon,
  BuildingIcon,
  PhoneIcon,
  CheckIcon,
} from "@/components/Icons";

export const revalidate = 3600;

/* ───────────────────────── AREA DATA ───────────────────────── */

interface AreaData {
  name: string;
  slug: string;
  description: string[];
  neighbourhoods: string[];
  amenities: string[];
  transport: string[];
  whyRentHere: string[];
}

const AREAS: Record<string, AreaData> = {
  bury: {
    name: "Bury",
    slug: "bury",
    description: [
      "Bury is a historic market town at the heart of Greater Manchester and the main area we cover at McGowan Lettings. Famous for its world-renowned Bury Market and its legendary black pudding stalls, the town offers a genuine community feel while sitting just a short tram ride from Manchester city centre.",
      "The borough blends charming Victorian terraces with modern family homes and new-build developments. From the leafy streets of Tottington and the sought-after cafes of Ramsbottom to the well-connected suburbs of Whitefield and Prestwich, Bury has something for every tenant.",
      "Rental demand remains consistently strong thanks to excellent schools, green spaces like Burrs Country Park, and a property mix that suits young professionals, couples and families alike. For landlords, Bury offers reliable yields and low void periods.",
      "With the Metrolink tram network connecting Bury to Manchester in under 30 minutes and easy access to the M60 and M66 motorways, commuting is straightforward whether you work in the city or further afield.",
    ],
    neighbourhoods: [
      "Tottington",
      "Ramsbottom",
      "Whitefield",
      "Radcliffe",
      "Prestwich",
    ],
    amenities: [
      "Bury Market — one of the largest outdoor markets in Europe",
      "The Rock shopping centre",
      "Burrs Country Park and Peel Tower",
      "East Lancashire Railway heritage line",
      "Excellent primary and secondary schools",
      "Fairfield General Hospital",
    ],
    transport: [
      "Metrolink tram — Bury to Manchester city centre in under 30 minutes",
      "M60 motorway ring road access",
      "M66 motorway to Rossendale and East Lancashire",
      "Regular bus services across Greater Manchester",
      "Manchester Airport approximately 40 minutes by car",
    ],
    whyRentHere: [
      "Strong community feel with a genuine town-centre identity",
      "Excellent Metrolink connection to Manchester city centre",
      "Wide range of property types from Victorian terraces to modern family homes",
      "Popular with families thanks to outstanding schools and green spaces",
      "Consistent rental demand and competitive pricing compared to south Manchester",
    ],
  },

  bolton: {
    name: "Bolton",
    slug: "bolton",
    description: [
      "Bolton is one of the largest towns in Greater Manchester, with a rich industrial heritage and a strong sense of local identity. Once at the centre of the cotton trade, the town has evolved into a thriving modern community while retaining its character and architectural landmarks.",
      "Rental properties in Bolton offer excellent value for money compared to many parts of Greater Manchester. The market features a healthy mix of traditional terraced houses in established neighbourhoods, semi-detached family homes in suburbs like Harwood and Lostock, and modern new-build developments.",
      "Bolton has seen significant investment in recent years, with regeneration projects in the town centre and improved infrastructure. The growing University of Bolton also contributes to steady rental demand, alongside working professionals and families.",
      "Transport links are strong, with Bolton train station providing direct services to Manchester and beyond, while the M61 motorway connects to the wider motorway network including the M6 and M60.",
    ],
    neighbourhoods: [
      "Farnworth",
      "Harwood",
      "Horwich",
      "Westhoughton",
      "Lostock",
    ],
    amenities: [
      "Bolton Market and town centre shopping",
      "University of Bolton",
      "Bolton Wanderers Football Club",
      "Rivington Pike and the West Pennine Moors",
      "Bolton One leisure and wellbeing centre",
      "Royal Bolton Hospital",
    ],
    transport: [
      "Bolton train station — direct services to Manchester, Preston and Blackpool",
      "M61 motorway access to M6 and M60",
      "Extensive bus network across Greater Manchester",
      "Horwich Parkway station near the Reebok",
      "Manchester Airport approximately 45 minutes by car",
    ],
    whyRentHere: [
      "Excellent value — lower average rents than Manchester or Salford",
      "Strong rental demand from university students and professionals",
      "Good range of property types at every price point",
      "Access to stunning countryside at Rivington and the West Pennine Moors",
      "Ongoing regeneration bringing new investment to the town centre",
    ],
  },

  manchester: {
    name: "Manchester",
    slug: "manchester",
    description: [
      "Manchester is one of the most dynamic cities in the UK, known worldwide for its music, sport, culture and thriving economy. The city centre and surrounding suburbs offer a huge range of rental options, from luxury apartments in Deansgate to character-filled terraces in Chorlton.",
      "Rental demand in Manchester is among the highest in the country, driven by a growing population of young professionals, students at world-class universities, and an expanding tech and creative sector. City-centre apartments are particularly popular, with developments continuing to reshape the skyline.",
      "Beyond the centre, suburbs like Ancoats, Salford Quays and Eccles have undergone dramatic regeneration, offering modern living with excellent amenities and strong transport connections. Meanwhile, established neighbourhoods like Chorlton and Didsbury remain favourites for professionals seeking a more relaxed pace with easy city access.",
      "Manchester's transport infrastructure is one of the best outside London, with the Metrolink tram, extensive rail network, frequent bus services and Manchester Airport all providing convenient links locally and internationally.",
    ],
    neighbourhoods: [
      "Deansgate",
      "Ancoats",
      "Salford",
      "Eccles",
      "Chorlton",
    ],
    amenities: [
      "World-class dining, nightlife and cultural venues",
      "Manchester Arena and AO Arena",
      "The Trafford Centre and Arndale Centre",
      "University of Manchester and Manchester Metropolitan University",
      "Manchester Royal Infirmary and multiple NHS trusts",
      "Heaton Park — one of the largest municipal parks in Europe",
    ],
    transport: [
      "Metrolink tram network covering the city and suburbs",
      "Manchester Piccadilly and Victoria mainline stations",
      "Manchester Airport — the UK's third busiest airport",
      "M60 orbital motorway and M56, M62, M61 access",
      "Extensive bus network operated by Bee Network",
    ],
    whyRentHere: [
      "High demand and strong yields for landlords, particularly in the city centre",
      "Vibrant culture, nightlife and dining scene on your doorstep",
      "Excellent career opportunities across tech, finance, creative and media sectors",
      "Outstanding public transport — you do not need a car",
      "Diverse neighbourhoods offering everything from city living to leafy suburbs",
    ],
  },

  rossendale: {
    name: "Rossendale",
    slug: "rossendale",
    description: [
      "Rossendale is a picturesque valley borough nestled in the foothills of the Pennines in East Lancashire. Made up of tight-knit towns including Rawtenstall, Haslingden, Bacup and Waterfoot, the valley offers an increasingly attractive alternative for tenants priced out of Greater Manchester.",
      "Housing in Rossendale is notably more affordable than neighbouring areas, with stone-built terraces, solid semis and period properties available at competitive rents. The borough has a distinctive character — part mill-town heritage, part outdoor playground, with the moors and hills right on the doorstep.",
      "Growing numbers of commuters are choosing Rossendale thanks to improved motorway access via the M66 and A56, making Manchester city centre reachable in around 40 minutes. Rawtenstall in particular has seen growing investment, with independent shops, cafes and a renewed sense of energy in the town centre.",
      "For landlords, Rossendale offers strong yields and a loyal tenant base. Demand is steady and growing, particularly from families and professionals attracted by the combination of affordability, space and quality of life.",
    ],
    neighbourhoods: [
      "Rawtenstall",
      "Haslingden",
      "Bacup",
      "Waterfoot",
    ],
    amenities: [
      "Ski Rossendale — the largest dry ski slope in the North West",
      "East Lancashire Railway at Rawtenstall station",
      "Lee Quarry mountain bike trails",
      "Rossendale Valley countryside walks and Pennine access",
      "Rawtenstall town centre independent shops and cafes",
      "Good primary and secondary schools across the valley",
    ],
    transport: [
      "M66 motorway — connects to M60 and Manchester in approximately 40 minutes",
      "A56 and A681 road links across the valley",
      "Regular bus services to Bury, Burnley and Accrington",
      "Close to Bury Metrolink for onward tram travel to Manchester",
      "Manchester Airport approximately 50 minutes by car",
    ],
    whyRentHere: [
      "Significantly more affordable than Greater Manchester — more space for your money",
      "Stunning countryside setting with moors and hills on the doorstep",
      "Growing commuter appeal with improved road connections",
      "Tight-knit, friendly communities with a real sense of identity",
      "Steadily increasing property investment and regeneration",
    ],
  },

  accrington: {
    name: "Accrington",
    slug: "accrington",
    description: [
      "Accrington is a market town in the borough of Hyndburn, East Lancashire. Once a powerhouse of the Victorian textile industry, the town retains much of its period architecture and has been seeing growing investment and regeneration in recent years.",
      "For tenants and landlords alike, Accrington represents one of the most affordable entry points in the wider North West. Stone-built terraces, solid semis and pockets of new-build homes offer decent accommodation at rents well below Greater Manchester averages. The surrounding villages of Great Harwood, Clayton-le-Moors, Oswaldtwistle and Rishton add variety and choice.",
      "Accrington sits along the M65 corridor, providing straightforward motorway access to Burnley, Blackburn and the M6, while regular bus and rail services connect to the wider region. The town centre has a growing number of independent businesses, and Hyndburn Leisure Centre offers modern sports facilities.",
      "Regeneration schemes have brought fresh investment to the area, with new housing, improved public spaces and business development. For landlords, the combination of low purchase prices and solid rental demand makes Accrington a particularly attractive proposition for portfolio building.",
    ],
    neighbourhoods: [
      "Great Harwood",
      "Clayton-le-Moors",
      "Oswaldtwistle",
      "Rishton",
    ],
    amenities: [
      "Accrington town centre market and independent shops",
      "Hyndburn Leisure Centre",
      "Accrington Stanley Football Club",
      "Haworth Art Gallery — home to the largest public collection of Tiffany glass in Europe",
      "Local parks including Peel Park and Bullough Park",
      "Good local schools and Accrington and Rossendale College",
    ],
    transport: [
      "M65 motorway access — connecting to Burnley, Blackburn and the M6",
      "Accrington train station with services to Blackburn, Burnley and beyond",
      "Regular bus services across Hyndburn and East Lancashire",
      "Approximately 50 minutes to Manchester city centre by car",
      "Manchester Airport approximately one hour by car",
    ],
    whyRentHere: [
      "Among the most affordable rents in the North West",
      "Strong landlord yields thanks to low entry prices",
      "Active regeneration bringing new housing and investment",
      "Good M65 motorway and rail connections",
      "Friendly, established communities with genuine local character",
    ],
  },

  burnley: {
    name: "Burnley",
    slug: "burnley",
    description: [
      "Burnley is a historic mill town in East Lancashire that has undergone significant regeneration in recent years. Once at the heart of the cotton industry, the town has reinvented itself as an increasingly attractive place to live and invest, with some of the most affordable property prices anywhere in the UK.",
      "The rental market in Burnley is characterised by solid stone terraces, family semis and a growing number of modern developments. Neighbouring towns including Padiham, Brierfield, Nelson and Colne expand the range of options, each with their own distinct character and community.",
      "Burnley has attracted national attention for its regeneration efforts, with projects like the Weavers Triangle transforming former industrial buildings into modern living and working spaces. The presence of the University of Central Lancashire (UCLan) Burnley campus also supports a healthy student and young professional rental market.",
      "Transport links are solid, with the M65 motorway providing access across Lancashire and to the M6, while the scenic Leeds-Liverpool canal and surrounding countryside offer a quality of life that punches well above its price point. For landlords seeking strong yields, Burnley consistently ranks among the best in the country.",
    ],
    neighbourhoods: [
      "Padiham",
      "Brierfield",
      "Nelson",
      "Colne",
    ],
    amenities: [
      "Burnley town centre and Charter Walk shopping centre",
      "Towneley Hall and Park",
      "UCLan Burnley campus",
      "Leeds-Liverpool canal towpath",
      "Burnley Football Club — Turf Moor",
      "Burnley Leisure centre and local parks",
    ],
    transport: [
      "M65 motorway — direct access to Blackburn, Preston and the M6",
      "Burnley Manchester Road station with services to Manchester and Leeds",
      "Rose Grove station for local rail connections",
      "Regular bus services across East Lancashire",
      "Manchester Airport approximately one hour by car",
    ],
    whyRentHere: [
      "Some of the most affordable property prices in the entire UK",
      "Consistently strong rental yields — among the best nationally",
      "Significant regeneration investment transforming the town",
      "University campus supporting a healthy tenant pipeline",
      "Beautiful countryside, canal walks and the Pennines on the doorstep",
    ],
  },
};

/* ───────────────────────── METADATA ───────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = AREAS[slug];
  if (!area) return {};

  return {
    title: `Renting in ${area.name} | McGowan Residential Lettings`,
    description: `Discover what it is like to rent in ${area.name}. Local neighbourhood guide, transport links, amenities and available properties from McGowan Lettings.`,
  };
}

/* ───────────────────────── STATIC PARAMS ───────────────────────── */

export function generateStaticParams() {
  return Object.keys(AREAS).map((slug) => ({ slug }));
}

/* ───────────────────────── PAGE ───────────────────────── */

export default async function AreaGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = AREAS[slug];

  if (!area) notFound();

  /* Count active properties in this area */
  const { count } = await supabaseAdmin
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("active", true)
    .ilike("area", area.name);

  const propertyCount = count ?? 0;

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt={`${area.name} area`}
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              Area Guide
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Renting in {area.name}
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Your local guide to living and renting in {area.name} and the
            surrounding neighbourhoods.
          </p>
        </div>
      </section>

      {/* ─── BREADCRUMB ─── */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-dark transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/areas" className="hover:text-dark transition-colors">
              Area Guides
            </Link>
            <span>/</span>
            <span className="text-dark font-medium">{area.name}</span>
          </nav>
        </div>
      </div>

      {/* ─── ABOUT THE AREA ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <AnimateIn>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                    About the Area
                  </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-8">
                  Living in {area.name}
                </h2>
                <div className="space-y-5">
                  {area.description.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-text-muted leading-relaxed text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </AnimateIn>
            </div>

            {/* Sidebar stats */}
            <div className="space-y-6">
              <AnimateIn delay={0.15}>
                <div className="bg-white rounded-lg border border-black/5 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                      <HomeIcon className="w-5 h-5 text-brand-dark" />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-semibold text-dark">
                        {propertyCount}
                      </p>
                      <p className="text-text-muted text-sm">
                        {propertyCount === 1
                          ? "Property available"
                          : "Properties available"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/properties?area=${encodeURIComponent(area.name)}`}
                    className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-5 py-2.5 rounded-sm hover:bg-brand-light transition-colors text-sm w-full justify-center"
                  >
                    View Properties in {area.name}
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </AnimateIn>

              <AnimateIn delay={0.25}>
                <div className="bg-white rounded-lg border border-black/5 shadow-sm p-6">
                  <h3 className="font-heading text-lg font-semibold text-dark mb-3">
                    Key Neighbourhoods
                  </h3>
                  <ul className="space-y-2">
                    {area.neighbourhoods.map((n) => (
                      <li key={n} className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-brand shrink-0" />
                        <span className="text-text-muted text-sm">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AMENITIES & TRANSPORT ─── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Local Amenities */}
            <AnimateIn>
              <div className="bg-cream rounded-lg border border-black/5 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                    <BuildingIcon className="w-5 h-5 text-brand-dark" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark">
                    Local Amenities
                  </h3>
                </div>
                <ul className="space-y-3">
                  {area.amenities.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-text-muted"
                    >
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>

            {/* Transport Links */}
            <AnimateIn delay={0.15}>
              <div className="bg-cream rounded-lg border border-black/5 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-brand-dark" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark">
                    Transport Links
                  </h3>
                </div>
                <ul className="space-y-3">
                  {area.transport.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-text-muted"
                    >
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── WHY RENT HERE ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Why {area.name}
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-8">
              Why Rent in {area.name}?
            </h2>
          </AnimateIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {area.whyRentHere.map((reason, i) => (
              <AnimateIn key={i} delay={i * 0.08}>
                <div className="bg-white rounded-lg border border-black/5 p-6 h-full flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-brand" />
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {reason}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 md:py-24 bg-dark relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/95 to-brand/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimateIn>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
              Own a Property in {area.name}?
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
              Get a free, no-obligation rental valuation. David will personally
              assess your property and recommend the best strategy for maximising
              your rental income in {area.name}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/valuation"
                className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
              >
                Request a Free Valuation
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
              <a
                href="tel:01617976967"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-white/10 transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                Call David Directly
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
