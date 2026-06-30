import { QuizQuestion } from "../types";

export interface ITExamsQuestion extends QuizQuestion {
  domain: string;
}

export const ITEXAMS_SY0_701_QUESTIONS: ITExamsQuestion[] = [
  {
    id: "it-1",
    domain: "Domain 1: General Security Concepts",
    question: "A security administrator wants to implement a control that will block unauthorized access to a physical server room. The administrator decides to install an electronic badge reader on the entrance door. Which of the following categories and types of security controls does this solution represent?",
    options: [
      "Physical and Preventive",
      "Technical and Corrective",
      "Operational and Detective",
      "Managerial and Deterrent"
    ],
    correctIndex: 0,
    explanation: "A badge reader on a physical entrance door is a physical control because it secures physical boundaries and assets. It acts as a preventive control because it actively restricts entry to authorized personnel only, preventing physical intrusion."
  },
  {
    id: "it-2",
    domain: "Domain 1: General Security Concepts",
    question: "An organization is implementing a Zero Trust Architecture (ZTA). A security engineer is configuring a component that is responsible for making the decision to grant, deny, or revoke access to a resource by evaluating policy rules against identity, device health, and environmental factors. Which Zero Trust component is the engineer configuring?",
    options: [
      "Policy Enforcement Point (PEP)",
      "Policy Decision Point (PDP) / Policy Engine",
      "Policy Administrator",
      "Control Plane Gateway"
    ],
    correctIndex: 1,
    explanation: "The Policy Engine (which forms the core of the Policy Decision Point or PDP) is responsible for processing credentials, device health indicators, and behavioral data to decide whether to authorize or deny access. The Policy Enforcement Point (PEP) is the component that intercepts and enforces those decisions."
  },
  {
    id: "it-3",
    domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
    question: "An attacker sends highly targeted email messages to senior executives of a financial firm. The emails appear to come from the firm's chief legal officer and contain an urgent request to review a confidential litigation document via a linked external website, which requires them to enter their domain credentials. Which of the following best describes this social engineering attack?",
    options: [
      "Whaling",
      "Smishing",
      "Vishing",
      "Pharming"
    ],
    correctIndex: 0,
    explanation: "Whaling is a spear-phishing attack specifically customized and targeted at high-profile individuals, such as corporate executives, board members, or high-ranking government officials, to steal valuable credentials or trigger financial transfers."
  },
  {
    id: "it-4",
    domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
    question: "A security analyst is reviewing access logs for an external-facing web portal and notices a high volume of failed login attempts across hundreds of different user accounts in a short period. Each attempt used a single common password, such as 'Summer2024!'. Which of the following types of password attacks is occurring?",
    options: [
      "Password spraying",
      "Rainbow table attack",
      "Credential stuffing",
      "Dictionary attack"
    ],
    correctIndex: 0,
    explanation: "Password spraying is a technique where an attacker tests a few extremely common passwords against a vast collection of usernames to bypass account lockout mechanisms. This differs from standard brute-force or dictionary attacks that test many passwords against a single account."
  },
  {
    id: "it-5",
    domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
    question: "A security engineer reviews web traffic logs and notices that an external connection was forced to fall back from TLS 1.3 to SSL 3.0, allowing the attacker to subsequently decrypt the session keys. Which of the following cryptographic attacks does this situation represent?",
    options: [
      "Downgrade attack",
      "Collision attack",
      "Replay attack",
      "Birthday attack"
    ],
    correctIndex: 0,
    explanation: "A downgrade attack (or version roll-back attack) forces a client and server to negotiate down to an older, less secure cryptographic protocol version (such as fallback to SSL 3.0), allowing the attacker to exploit known vulnerabilities in the outdated standard."
  },
  {
    id: "it-6",
    domain: "Domain 3: Security Architecture",
    question: "A company is moving its critical business applications to a public cloud environment. Under the shared responsibility model for Infrastructure as a Service (IaaS), which of the following security aspects is the sole responsibility of the customer?",
    options: [
      "Physical security of the hypervisors and datacenters",
      "Patching and updating the guest operating system",
      "Network cabling and physical hardware connectivity",
      "Disposing of decommissioned storage drives"
    ],
    correctIndex: 1,
    explanation: "In an IaaS cloud model, the provider manages physical datacenters, network cabling, virtualization hosts, and hardware destruction. The customer maintains full administrative control over and is responsible for guest operating systems, custom software, network configurations, and data encryption."
  },
  {
    id: "it-7",
    domain: "Domain 3: Security Architecture",
    question: "An organization wants to secure its distributed workforce by combining network security functions (such as SWG, CASB, and FWaaS) with WAN capabilities into a single cloud-native service model. Which of the following architectures best meets this requirement?",
    options: [
      "Software-Defined WAN (SD-WAN)",
      "Secure Access Service Edge (SASE)",
      "Software-Defined Networking (SDN)",
      "Zero Trust Network Access (ZTNA)"
    ],
    correctIndex: 1,
    explanation: "SASE (Secure Access Service Edge) is an architectural framework that converges comprehensive WAN networking (such as SD-WAN) with advanced security services (including SWG, CASB, FWaaS, and ZTNA) into a unified, cloud-delivered platform to protect mobile/hybrid staff."
  },
  {
    id: "it-8",
    domain: "Domain 3: Security Architecture",
    question: "A security administrator is configuring database encryption using Transparent Data Encryption (TDE) to protect customer record tables stored on local disk arrays. Which data state is primarily being secured by this solution?",
    options: [
      "Data at rest",
      "Data in transit",
      "Data in use",
      "Data in flight"
    ],
    correctIndex: 0,
    explanation: "Transparent Data Encryption (TDE) encrypts storage directories, database logs, and physical server tables to protect data when stored on a physical disk drive (Data at rest), rendering the files unreadable in the event of hard drive theft."
  },
  {
    id: "it-9",
    domain: "Domain 4: Security Operations",
    question: "A network engineer is designing a secure wireless network for a corporate headquarters. The engineer wants to ensure that all connecting devices use the strongest available encryption and require individual, unique authentication credentials via an enterprise directory. Which of the following configurations should the engineer choose?",
    options: [
      "WPA3-Personal with a pre-shared key",
      "WPA3-Enterprise with 802.1X authentication",
      "WPA2-Personal with AES-CCMP",
      "WEP with open system authentication"
    ],
    correctIndex: 1,
    explanation: "WPA3-Enterprise delivers robust 192-bit cryptographic strength and integrates with enterprise directory servers (using 802.1X and RADIUS/EAP) to require unique individual log-ins, avoiding shared credentials or static keys."
  },
  {
    id: "it-10",
    domain: "Domain 4: Security Operations",
    question: "To protect users from navigating to malicious phishing websites, a cybersecurity team configures a security solution that intercepts domain name resolution queries and blocks access to known malicious domains by returning a loopback address. Which of the following technologies is the team implementing?",
    options: [
      "DNS filtering",
      "DNSSEC",
      "DHCP snooping",
      "Reverse lookup validation"
    ],
    correctIndex: 0,
    explanation: "DNS filtering analyzes outbound domain name queries and redirects requests pointing to known malware servers, phishing networks, or command-and-control sites to a generic sinkhole or warning page instead of resolving the actual IP."
  },
  {
    id: "it-11",
    domain: "Domain 4: Security Operations",
    question: "During an active incident response investigation, a forensic analyst is tasked with collecting volatile system evidence from a compromised server. According to the order of volatility, which of the following sources should the analyst capture FIRST?",
    options: [
      "System RAM / main memory",
      "Hard disk drive image (HDD)",
      "Routing table and ARP cache",
      "Network backup files"
    ],
    correctIndex: 2,
    explanation: "The order of volatility demands capturing the most transient (frequently modified) data first. Routing tables, ARP caches, and registers are highly dynamic and will be cleared instantly upon system reboot, preceding system RAM and long-term hard disk assets."
  },
  {
    id: "it-12",
    domain: "Domain 4: Security Operations",
    question: "A security administrator needs to configure authentication for a cloud-based dashboard. The requirement states that users should be redirected to a corporate identity provider to sign in, after which they are logged into the dashboard without sharing their passwords directly. Which of the following frameworks is best suited to provide this federation and authorization flow?",
    options: [
      "OAuth 2.0",
      "LDAP",
      "RADIUS",
      "SAML 2.0"
    ],
    correctIndex: 3,
    explanation: "SAML 2.0 (Security Assertion Markup Language) is an XML-based federation standard commonly used to delegate authentication from a Service Provider (SP) like the cloud dashboard to an Identity Provider (IdP) for web-based Single Sign-On (SSO)."
  },
  {
    id: "it-13",
    domain: "Domain 5: Security Program Management and Oversight",
    question: "A risk management team calculates the risk of a potential server room flood. The single loss expectancy (SLE) of the hardware is $150,000, and the annualized rate of occurrence (ARO) is estimated at 0.04 (once every 25 years). What is the annualized loss expectancy (ALE) for this flood risk?",
    options: [
      "$6,000",
      "$3,750",
      "$15,000",
      "$37,500"
    ],
    correctIndex: 0,
    explanation: "The formula for Annualized Loss Expectancy is ALE = SLE * ARO. Calculating this gives: ALE = $150,000 * 0.04 = $6,000 of predicted yearly loss."
  },
  {
    id: "it-14",
    domain: "Domain 5: Security Program Management and Oversight",
    question: "An organization is establishing a partnership with a third-party vendor to provide database maintenance services. To ensure high availability and define specific performance criteria (such as a 99.9% uptime requirement and a 2-hour issue resolution window), which of the following agreements should be executed?",
    options: [
      "Service Level Agreement (SLA)",
      "Non-Disclosure Agreement (NDA)",
      "Memorandum of Understanding (MOU)",
      "Business Partners Agreement (BPA)"
    ],
    correctIndex: 0,
    explanation: "A Service Level Agreement (SLA) outlines the expectations, performance milestones, uptime guarantees, and support response metrics that a third-party vendor commits to deliver for their client."
  },
  {
    id: "it-15",
    domain: "Domain 5: Security Program Management and Oversight",
    question: "Under the General Data Protection Regulation (GDPR), an international organization is found negligent in protecting European citizens' personal information, leading to a massive data breach. Which of the following represents the maximum tier of administrative fine that can be levied for severe violations?",
    options: [
      "Up to €20 million or 4% of global annual turnover, whichever is higher",
      "Up to €10 million or 2% of global annual turnover, whichever is higher",
      "Flat fee of €5 million",
      "Up to €50 million"
    ],
    correctIndex: 0,
    explanation: "Under GDPR rules, major administrative and privacy violations can lead to heavy penalties of up to €20,000,000 or up to 4% of the global annual turnover of the offending enterprise from the previous financial year, whichever is higher."
  }
];
