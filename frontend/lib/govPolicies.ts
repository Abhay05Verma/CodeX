/**
 * Government policies data for Vendor Dashboard.
 * Hardcoded for now; structure is ready for future API fetch.
 */
export type PolicyStatus = "past" | "ongoing" | "upcoming";

export type GovPolicy = {
  id: string;
  name: string;
  status: PolicyStatus;
  shortDescription?: string;
  description: string;
  requirements: string[];
  lastDateToApply: string | null;
  officialLink: string;
};

export const GOV_POLICIES: GovPolicy[] = [
  {
    id: "pm-svanidhi",
    name: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    status: "ongoing",
    shortDescription: "Working capital loan for street vendors",
    description:
      "PM SVANidhi is a central sector scheme launched by the Ministry of Housing and Urban Affairs to help street vendors resume their livelihoods after the COVID-19 pandemic. It provides collateral-free working capital loans up to ₹10,000 for a period of one year. Vendors can get subsequent loans of ₹20,000 and ₹50,000 on timely repayment.",
    requirements: [
      "Street vendor / thelewala with a certificate of vending or identity card issued by Urban Local Bodies",
      "Vendor must have been in business on or before 24 March 2020",
      "No minimum educational qualification",
      "Applicant should be 18 years or above",
    ],
    lastDateToApply: null,
    officialLink: "https://pmsvanidhi.mohua.gov.in/",
  },
  {
    id: "pm-fme",
    name: "PM Formalisation of Micro Food Processing Enterprises (PM FME)",
    status: "ongoing",
    shortDescription: "Support for micro food processing units",
    description:
      "PM FME is a central sector scheme under the Aatmanirbhar Bharat Abhiyan. It aims to provide financial, technical and business support to micro food processing enterprises. The scheme offers 35% to 50% capital subsidy for setting up or upgrading units, and supports branding and marketing for FPOs and SHGs.",
    requirements: [
      "Micro enterprise in food processing (turnover criteria as per scheme)",
      "Existing units for upgradation or new units for setting up",
      "Udyam registration preferred",
      "Willingness to adopt One District One Product (ODOP) or similar cluster approach",
    ],
    lastDateToApply: null,
    officialLink: "https://pmfme.mofpi.gov.in/",
  },
  {
    id: "pli-food",
    name: "Production Linked Incentive (PLI) Scheme for Food Processing",
    status: "ongoing",
    shortDescription: "Incentives for large-scale food manufacturing",
    description:
      "The PLI scheme for food processing aims to support creation of global food manufacturing champions and boost Indian brands in the international market. It provides financial incentives (4% to 6% of incremental sales) over six years for selected segments including ready-to-eat foods, marine products, fruits and vegetables, and more.",
    requirements: [
      "Minimum investment and sales thresholds as per scheme guidelines",
      "New or expansion projects in notified product categories",
      "Commitment to minimum production and incremental sales",
    ],
    lastDateToApply: null,
    officialLink: "https://mofpi.nic.in/",
  },
  {
    id: "udyam-registration",
    name: "Udyam Registration (MSME)",
    status: "ongoing",
    shortDescription: "Free registration for micro, small and medium enterprises",
    description:
      "Udyam Registration is a government registration for Micro, Small and Medium Enterprises (MSMEs). It is free, online, and based on self-declaration. Registered enterprises get benefits like priority sector lending, subsidies, and access to various government schemes. No turnover or investment proof is required at the time of registration.",
    requirements: [
      "Aadhaar number of the proprietor/partner/director",
      "PAN of the enterprise",
      "No fee; self-declaration of turnover and investment",
    ],
    lastDateToApply: null,
    officialLink: "https://udyamregistration.gov.in/",
  },
  {
    id: "stand-up-india",
    name: "Stand-Up India",
    status: "ongoing",
    shortDescription: "Bank loans for SC/ST and women entrepreneurs",
    description:
      "Stand-Up India facilitates bank loans between ₹10 lakh and ₹1 crore to at least one SC/ST borrower and one woman borrower per bank branch for setting up a greenfield enterprise in manufacturing, services or trading. The scheme is implemented through all scheduled commercial banks.",
    requirements: [
      "SC/ST or woman entrepreneur (above 18 years)",
      "Greenfield project (first venture in manufacturing, services or trading)",
      "Loan requirement between ₹10 lakh and ₹1 crore",
      "Applicable for only one enterprise per borrower",
    ],
    lastDateToApply: null,
    officialLink: "https://www.standupmitra.in/",
  },
  {
    id: "atmanirbhar-bharat-rozgar",
    name: "Aatmanirbhar Bharat Rozgar Yojana (ABRY)",
    status: "past",
    shortDescription: "EPF subsidy for new employment (closed)",
    description:
      "ABRY was launched to incentivise employers to hire workers who had lost jobs during COVID-19. The government bore the employee and employer share of EPF for two years for new hires. The scheme was open for registration till 31 March 2022 and has since been closed for new registrations.",
    requirements: [
      "Establishments registered with EPFO",
      "New employees with UAN joining from 1 October 2020",
      "Salary up to ₹24,000 per month",
    ],
    lastDateToApply: "2022-03-31",
    officialLink: "https://www.epfindia.gov.in/",
  },
  {
    id: "gec-mobility",
    name: "Green Energy Corridors – Mobility & Storage (upcoming)",
    status: "upcoming",
    shortDescription: "Support for EV and green mobility (expected)",
    description:
      "The government is expected to launch a new scheme to support green mobility and energy storage, including incentives for electric vehicle charging infrastructure and battery storage. Details and eligibility will be announced. This placeholder is for illustrative purposes.",
    requirements: [
      "Details to be announced upon scheme launch",
      "Likely to cover EV charging, battery storage, and related MSMEs",
    ],
    lastDateToApply: null,
    officialLink: "https://mnre.gov.in/",
  },
  {
    id: "rurban-mission",
    name: "Shyama Prasad Mukherjee RURBAN Mission",
    status: "past",
    shortDescription: "Rural-urban cluster development (phased)",
    description:
      "The National RURBAN Mission aimed at developing 300 rural growth clusters to stimulate local economic development and create smart villages. Many clusters have been completed; new cluster additions were time-bound. The mission continues in implementation phase for already selected clusters.",
    requirements: [
      "Clusters selected by state governments",
      "Convergence with other central and state schemes",
      "Focus on skill development, agro-processing, and digital connectivity",
    ],
    lastDateToApply: "2021-03-31",
    officialLink: "https://rurban.gov.in/",
  },
];

export function getPolicyById(id: string): GovPolicy | undefined {
  return GOV_POLICIES.find((p) => p.id === id);
}

export function getPoliciesByStatus(status: PolicyStatus): GovPolicy[] {
  return GOV_POLICIES.filter((p) => p.status === status);
}
