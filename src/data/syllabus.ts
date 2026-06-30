import { SyllabusTopic } from "../types";

export interface SyllabusDomain {
  name: string;
  weight: string;
  description: string;
  topics: SyllabusTopic[];
}

export const SYLLABUS_DOMAINS: SyllabusDomain[] = [
  {
    name: "Domain 1: General Security Concepts",
    weight: "12%",
    description: "Covers the fundamental concepts of security control types, security principles, change management processes, and cryptographic solutions.",
    topics: [
      {
        id: "1.1",
        domain: "Domain 1: General Security Concepts",
        title: "Compare and contrast various types of security controls.",
        estimatedTime: "20 mins",
        description: "Analyze security control categories: Technical, Managerial, Operational, and Physical. Understand control types including Preventive, Deterrent, Detective, Corrective, Compensating, and Directive."
      },
      {
        id: "1.2",
        domain: "Domain 1: General Security Concepts",
        title: "Summarize fundamental security concepts.",
        estimatedTime: "30 mins",
        description: "Explore the CIA Triad (Confidentiality, Integrity, Availability), Non-repudiation, AAA (Authentication, Authorization, Accounting) for people and systems, Gap analysis, Zero Trust architecture (Control Plane: Adaptive identity, Threat scope reduction, Policy-driven access control, Policy Administrator, Policy Engine; Data Plane: Implicit trust zones, Subject/System, Policy Enforcement Point), Physical security (Bollards, Access control vestibule, Fencing, Video surveillance, Security guard, Access badge, Lighting, Sensors: Infrared, Pressure, Microwave, Ultrasonic), and Deception and disruption technology (Honeypot, Honeynet, Honeyfile, Honeytoken)."
      },
      {
        id: "1.3",
        domain: "Domain 1: General Security Concepts",
        title: "Explain the importance of change management processes and the impact to security.",
        estimatedTime: "25 mins",
        description: "Understand business processes impacting security operations (Approval process, Ownership, Stakeholders, Impact analysis, Test results, Backout plan, Maintenance window, SOPs), technical implications (Allow lists/deny lists, Restricted activities, Downtime, Service/Application restart, Legacy applications, Dependencies), documentation updates (diagrams, policies/procedures), and Version control."
      },
      {
        id: "1.4",
        domain: "Domain 1: General Security Concepts",
        title: "Explain the importance of using appropriate cryptographic solutions.",
        estimatedTime: "45 mins",
        description: "Master Public key infrastructure (PKI) concepts (Public/Private key, Key escrow), levels of Encryption (Full-disk, Partition, File, Volume, Database, Record), transport/communication security, asymmetric and symmetric encryption, Key exchange, Algorithms, and Key length. Study tools (TPM, HSM, Key management system, Secure enclave), Obfuscation methods (Steganography, Tokenization, Data masking), Hashing, Salting, Digital signatures, Key stretching, Blockchain, Open public ledgers, and Certificates (CAs, CRLs, OCSP, Self-signed, Third-party, Root of trust, CSR generation, Wildcards)."
      }
    ]
  },
  {
    name: "Domain 2: Threats, Vulnerabilities, and Mitigations",
    weight: "22%",
    description: "Focuses on comparing threat actors and motivations, threat vectors and attack surfaces, vulnerability types, analyzing indicators of malicious activity, and mitigation techniques.",
    topics: [
      {
        id: "2.1",
        domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
        title: "Compare and contrast common threat actors and motivations.",
        estimatedTime: "25 mins",
        description: "Differentiate threat actors (Nation-state, Unskilled attacker, Hacktivist, Insider threat, Organized crime, Shadow IT) based on attributes (Internal/external, Resources/funding, Level of sophistication/capability), and core motivations (Data exfiltration, Espionage, Service disruption, Blackmail, Financial gain, Philosophical/political beliefs, Ethical, Revenge, Disruption/chaos, War)."
      },
      {
        id: "2.2",
        domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
        title: "Explain common threat vectors and attack surfaces.",
        estimatedTime: "35 mins",
        description: "Identify threat vectors: Message-based (Email, SMS, IM), Image-based, File-based, Voice calls, Removable devices, Vulnerable software (Client-based vs. agentless), Unsupported systems/applications, Unsecure networks (Wireless, Wired, Bluetooth), Open service ports, Default credentials, Supply chain (MSPs, Vendors, Suppliers), and Human vectors/social engineering (Phishing, Vishing, Smishing, Misinformation/disinformation, Impersonation, Business email compromise, Pretexting, Watering hole, Brand impersonation, Typosquatting)."
      },
      {
        id: "2.3",
        domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
        title: "Explain various types of vulnerabilities.",
        estimatedTime: "30 mins",
        description: "Analyze Application-level vulnerabilities (Memory injection, Buffer overflow, Race conditions: TOC/TOU, Malicious updates), OS-based, Web-based (SQLi, XSS), Hardware (Firmware, End-of-life, Legacy), Virtualization (VM escape, Resource reuse), Cloud-specific, Supply chain (Service/Hardware/Software providers), Cryptographic, Misconfigurations, Mobile device vulnerabilities (Side loading, Jailbreaking), and Zero-day exploits."
      },
      {
        id: "2.4",
        domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
        title: "Given a scenario, analyze indicators of malicious activity.",
        estimatedTime: "40 mins",
        description: "Examine indicators of Malware attacks (Ransomware, Trojan, Worm, Spyware, Bloatware, Virus, Keylogger, Logic bomb, Rootkit), Physical attacks (Brute force, RFID cloning, Environmental), Network attacks (DDoS: Amplified/Reflected; DNS attacks, Wireless, On-path, Credential replay, Malicious code), Application attacks (Injection, Buffer overflow, Replay, Privilege escalation, Forgery, Directory traversal), Cryptographic attacks (Downgrade, Collision, Birthday), Password attacks (Spraying, Brute force), and common indicators (Account lockout, Concurrent sessions, Blocked content, Impossible travel, Resource consumption/inaccessibility, Out-of-cycle logging, Published/documented alerts, Missing logs)."
      },
      {
        id: "2.5",
        domain: "Domain 2: Threats, Vulnerabilities, and Mitigations",
        title: "Explain the purpose of mitigation techniques used to secure the enterprise.",
        estimatedTime: "35 mins",
        description: "Explore enterprise mitigations: Segmentation, Access control (ACLs, Permissions), Application allow listing, Isolation, Patching, Encryption, Monitoring, Least privilege, Configuration enforcement, Decommissioning, and Hardening techniques (Encryption, Endpoint protection, Host-based firewalls, HIPS, Disabling ports/protocols, Default password changes, Removal of unnecessary software)."
      }
    ]
  },
  {
    name: "Domain 3: Security Architecture",
    weight: "18%",
    description: "Examines security design implications of different architecture models, infrastructure securing principles, data protection, and resilience/recovery.",
    topics: [
      {
        id: "3.1",
        domain: "Domain 3: Security Architecture",
        title: "Compare and contrast security implications of different architecture models.",
        estimatedTime: "35 mins",
        description: "Evaluate architecture/infrastructure concepts: Cloud (Responsibility matrix, Hybrid considerations, Third-party vendors), Infrastructure as Code (IaC), Serverless, Microservices, Network infrastructure, Physical isolation (Air-gapped, Logical segmentation), Software-Defined Networking (SDN), On-premises, Centralized vs. Decentralized, Containerization, Virtualization, IoT, SCADA/ICS, Real-time operating systems (RTOS), Embedded systems, and High availability. Review key considerations (Availability, Resilience, Cost, Responsiveness, Scalability, Ease of deployment/recovery, Risk transference, Patch availability/inability, Power, Compute)."
      },
      {
        id: "3.2",
        domain: "Domain 3: Security Architecture",
        title: "Given a scenario, apply security principles to secure enterprise infrastructure.",
        estimatedTime: "45 mins",
        description: "Apply secure infrastructure design: Device placement, Security zones, Attack surface, Connectivity, Failure modes (Fail-open, Fail-closed), Device attributes (Active vs. Passive, Inline vs. Tap/Monitor), Network appliances (Jump servers, Proxy servers, IPS/IDS, Load balancers, Sensors), Port security (802.1X, EAP), Firewall types (WAF, UTM, NGFW, Layer 4/Layer 7), and Secure communication/access (VPN, Remote access, Tunneling: TLS, IPSec; SD-WAN, SASE). Learn Selection of effective controls."
      },
      {
        id: "3.3",
        domain: "Domain 3: Security Architecture",
        title: "Compare and contrast concepts and strategies to protect data.",
        estimatedTime: "30 mins",
        description: "Evaluate Data types (Regulated, Trade secret, Intellectual property, Legal, Financial, Human/non-human-readable), Data classifications (Sensitive, Confidential, Public, Restricted, Private, Critical), General data considerations (Data states: At rest, In transit, In use; Data sovereignty, Geolocation), and Methods to secure data (Geographic restrictions, Encryption, Hashing, Masking, Tokenization, Obfuscation, Segmentation, Permission restrictions)."
      },
      {
        id: "3.4",
        domain: "Domain 3: Security Architecture",
        title: "Explain the importance of resilience and recovery in security architecture.",
        estimatedTime: "35 mins",
        description: "Understand High availability (Load balancing vs. clustering), Site considerations (Hot, Cold, Warm, Geographic dispersion), Platform diversity, Multi-cloud systems, Continuity of operations, Capacity planning (People, Technology, Infrastructure), Testing (Tabletop exercises, Failover, Simulation, Parallel processing), Backups (Onsite/offsite, Frequency, Encryption, Snapshots, Recovery, Replication, Journaling), and Power systems (Generators, UPS)."
      }
    ]
  },
  {
    name: "Domain 4: Security Operations",
    weight: "28%",
    description: "Covers applying security techniques to computing resources, asset management implications, vulnerability activities, alerting/monitoring, modifying enterprise capabilities, identity/access management, automation/orchestration, incident response, and using investigative data sources.",
    topics: [
      {
        id: "4.1",
        domain: "Domain 4: Security Operations",
        title: "Given a scenario, apply common security techniques to computing resources.",
        estimatedTime: "30 mins",
        description: "Deploy Secure baselines (Establish, Deploy, Maintain), Hardening targets (Mobile, Workstations, Switches, Routers, Cloud, Servers, SCADA/ICS, Embedded systems, RTOS, IoT), Wireless device considerations (Site surveys, Heat maps), Mobile solutions (MDM, BYOD, COPE, CYOD, Cellular, Wi-Fi, Bluetooth), Wireless security settings (WPA3, RADIUS/AAA, Cryptographic/Authentication protocols), Application security (Input validation, Secure cookies, Static code analysis, Code signing), Sandboxing, and Monitoring."
      },
      {
        id: "4.2",
        domain: "Domain 4: Security Operations",
        title: "Explain the security implications of proper hardware, software, and data asset management.",
        estimatedTime: "20 mins",
        description: "Assess Acquisition/procurement processes, Assignment/accounting (Ownership, Classification), Monitoring/asset tracking (Inventory, Enumeration), and Disposal/decommissioning (Sanitization, Destruction, Certification, Data retention)."
      },
      {
        id: "4.3",
        domain: "Domain 4: Security Operations",
        title: "Explain various activities associated with vulnerability management.",
        estimatedTime: "35 mins",
        description: "Review Identification methods (Vulnerability scans, App security: Static/Dynamic analysis, Package monitoring; Threat feeds: OSINT, Proprietary, Information-sharing, Dark web; Penetration testing, Bug bounty/Responsible disclosure, Audits), Analysis (Confirmation: False positive/negative; Prioritize, CVSS, CVE, Classification, Exposure factor, Environmental variables, Impact, Risk tolerance), Vulnerability response/remediation (Patching, Insurance, Segmentation, Compensating controls, Exceptions/exemptions), Validation of remediation (Rescanning, Audit, Verification), and Reporting."
      },
      {
        id: "4.4",
        domain: "Domain 4: Security Operations",
        title: "Explain security alerting and monitoring concepts and tools.",
        estimatedTime: "30 mins",
        description: "Study Monitoring computing resources (Systems, Applications, Infrastructure), Activities (Log aggregation, Alerting, Scanning, Reporting, Archiving, Alert response/validation: Quarantine, Alert tuning), and Tools (SCAP, Benchmarks, Agents/agentless, SIEM, Antivirus, DLP, SNMP traps, NetFlow, Vulnerability scanners)."
      },
      {
        id: "4.5",
        domain: "Domain 4: Security Operations",
        title: "Given a scenario, modify enterprise capabilities to enhance security.",
        estimatedTime: "40 mins",
        description: "Implement and tune Firewalls (Rules, Access lists, Ports/protocols, Screened subnets), IDS/IPS (Trends, Signatures), Web filters (Agent-based, Central proxy, URL scanning, Content categorization, Block rules, Reputation), OS security (Group Policy, SELinux), Secure protocols (Protocol/Port selection, Transport methods), DNS filtering, Email security (DMARC, DKIM, SPF, Gateway), File integrity monitoring, DLP, NAC, EDR/XDR, and User behavior analytics."
      },
      {
        id: "4.6",
        domain: "Domain 4: Security Operations",
        title: "Given a scenario, implement and maintain identity and access management.",
        estimatedTime: "45 mins",
        description: "Configure IAM processes: Account provisioning/de-provisioning, Permission assignments/implications, Identity proofing, Federation, SSO (LDAP, OAuth, SAML), Interoperability, Attestation, Access controls (Mandatory, Discretionary, Role-based, Rule-based, Attribute-based, Time-of-day, Least privilege), Multi-factor authentication (Biometrics, Tokens, Keys; Factors: Know, Have, Are, Somewhere you are), Password concepts (Length, Complexity, Reuse, Expiration, Age, Managers, Passwordless), and Privileged Access Management (PAM) tools (Just-in-time permissions, Password vaulting, Ephemeral credentials)."
      },
      {
        id: "4.7",
        domain: "Domain 4: Security Operations",
        title: "Explain the importance of automation and orchestration related to secure operations.",
        estimatedTime: "25 mins",
        description: "Examine Automation/scripting use cases (User/Resource provisioning, Guard rails, Security groups, Ticket creation, Escalation, Enabling/disabling access, CI/testing, API integrations), Benefits (Efficiency, Enforcing baselines, Standard configurations, Secure scaling, Employee retention, Reaction time, Workforce multiplier), and Considerations (Complexity, Cost, Single point of failure, Technical debt, Supportability)."
      },
      {
        id: "4.8",
        domain: "Domain 4: Security Operations",
        title: "Explain appropriate incident response activities.",
        estimatedTime: "35 mins",
        description: "Walk through Incident Response process (Preparation, Detection, Analysis, Containment, Eradication, Recovery, Lessons learned), Training, Testing (Tabletop, Simulation), Root cause analysis, Threat hunting, and Digital forensics (Legal hold, Chain of custody, Acquisition, Reporting, Preservation, E-discovery)."
      },
      {
        id: "4.9",
        domain: "Domain 4: Security Operations",
        title: "Given a scenario, use data sources to support an investigation.",
        estimatedTime: "35 mins",
        description: "Correlate Log data (Firewall, Application, Endpoint, OS-specific, IPS/IDS, Network, Metadata) and alternative Data sources (Vulnerability scans, Automated reports, Dashboards, Packet captures)."
      }
    ]
  },
  {
    name: "Domain 5: Security Program Management and Oversight",
    weight: "20%",
    description: "Focuses on security governance elements, risk management processes, third-party risk assessment, security compliance elements, audits/assessments, and awareness practices.",
    topics: [
      {
        id: "5.1",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Summarize elements of effective security governance.",
        estimatedTime: "30 mins",
        description: "Learn Governance guidelines, Policies (AUP, Infosec, Business continuity, Disaster recovery, Incident response, SDLC, Change management), Standards (Password, Access control, Physical, Encryption), Procedures (Change management, Onboarding/offboarding, Playbooks), External considerations (Regulatory, Legal, Industry, Regional, National, Global), Monitoring/revision, Governance structures (Boards, Committees, Government entities, Centralized/decentralized), and Roles/responsibilities (Owners, Controllers, Processors, Custodians/stewards)."
      },
      {
        id: "5.2",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Explain elements of the risk management process.",
        estimatedTime: "35 mins",
        description: "Study Risk identification, Risk assessments (Ad hoc, Recurring, One-time, Continuous), Risk analysis (Qualitative, Quantitative, SLE, ALE, ARO, Probability, Likelihood, Exposure factor, Impact), Risk registers (KRI, Owners, Threshold), Risk tolerance, Risk appetite (Expansionary, Conservative, Neutral), Management strategies (Transfer, Accept: Exemption/Exception; Avoid, Mitigate), Risk reporting, and Business Impact Analysis (RTO, RPO, MTTR, MTBF)."
      },
      {
        id: "5.3",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Explain the processes associated with third-party risk assessment and management.",
        estimatedTime: "25 mins",
        description: "Analyze Vendor assessments (Pentesting, Right-to-audit, Internal audit evidence, Independent assessments, Supply chain analysis), Vendor selection (Due diligence, Conflict of interest), Agreement types (SLA, MOA, MOU, MSA, WO/SOW, NDA, BPA), Vendor monitoring, Questionnaires, and Rules of engagement."
      },
      {
        id: "5.4",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Summarize elements of effective security compliance.",
        estimatedTime: "25 mins",
        description: "Master Compliance reporting (Internal, External), Consequences of non-compliance (Fines, Sanctions, Reputational, License loss, Contractual impacts), Compliance monitoring (Due diligence, Attestation, Internal/External, Automation), Privacy legal implications (Local, National, Global, Data subjects, Controller vs. Processor, Ownership, Inventory/retention, Right to be forgotten)."
      },
      {
        id: "5.5",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Explain types and purposes of audits and assessments.",
        estimatedTime: "30 mins",
        description: "Differentiate Audits and Assessments: Attestation, Internal (Compliance, Audit committee, Self-assessments), External (Regulatory, Examinations, Assessment, Third-party audits), and Penetration testing (Physical, Offensive, Defensive, Integrated, Known environment, Partially known, Unknown, Reconnaissance: Passive/Active)."
      },
      {
        id: "5.6",
        domain: "Domain 5: Security Program Management and Oversight",
        title: "Given a scenario, implement security awareness practices.",
        estimatedTime: "30 mins",
        description: "Design Awareness practices: Phishing (Campaigns, Recognition, Responding to reports), Anomalous behavior recognition (Risky, Unexpected, Unintentional), User guidance and training (Policy/handbooks, Situational awareness, Insider threat, Password management, Removable media/cables, Social engineering, Operational security, Hybrid/remote work), Reporting/monitoring (Initial, Recurring), and Program Development and Execution."
      }
    ]
  }
];

export const ALL_SYLLABUS_TOPICS = SYLLABUS_DOMAINS.reduce<SyllabusTopic[]>((acc, domain) => {
  return [...acc, ...domain.topics];
}, []);
