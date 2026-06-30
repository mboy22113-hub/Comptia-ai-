export interface MesserVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  syllabusTopicId: string;
  domainName: string;
}

export const MESSER_VIDEOS: MesserVideo[] = [
  // Domain 1: General Security Concepts
  {
    id: "messer-1",
    title: "An Overview of Security Controls",
    youtubeId: "Fidk1w9Z3Cg",
    duration: "11:42",
    syllabusTopicId: "1.1",
    domainName: "Domain 1: General Security Concepts"
  },
  {
    id: "messer-2",
    title: "The CIA Triad and AAA",
    youtubeId: "8gq9mCIs8Wc",
    duration: "14:15",
    syllabusTopicId: "1.2",
    domainName: "Domain 1: General Security Concepts"
  },
  {
    id: "messer-3",
    title: "An Overview of Zero Trust",
    youtubeId: "P-D13K1jK-E",
    duration: "09:55",
    syllabusTopicId: "1.2",
    domainName: "Domain 1: General Security Concepts"
  },
  {
    id: "messer-4",
    title: "Change Management Processes",
    youtubeId: "T75q2CgOcoY",
    duration: "08:12",
    syllabusTopicId: "1.3",
    domainName: "Domain 1: General Security Concepts"
  },
  {
    id: "messer-5",
    title: "An Overview of Cryptography",
    youtubeId: "3xH3g-q8oT4",
    duration: "13:48",
    syllabusTopicId: "1.4",
    domainName: "Domain 1: General Security Concepts"
  },
  // Domain 2: Threats, Vulnerabilities, and Mitigations
  {
    id: "messer-6",
    title: "Threat Actors and Motivations",
    youtubeId: "hO_Wf2Sre1k",
    duration: "12:05",
    syllabusTopicId: "2.1",
    domainName: "Domain 2: Threats, Vulnerabilities, and Mitigations"
  },
  {
    id: "messer-7",
    title: "Social Engineering Vectors",
    youtubeId: "8A4pEw_L6gA",
    duration: "15:22",
    syllabusTopicId: "2.2",
    domainName: "Domain 2: Threats, Vulnerabilities, and Mitigations"
  },
  {
    id: "messer-8",
    title: "Application Vulnerabilities",
    youtubeId: "TqXbXfA9k6A",
    duration: "10:50",
    syllabusTopicId: "2.3",
    domainName: "Domain 2: Threats, Vulnerabilities, and Mitigations"
  },
  {
    id: "messer-9",
    title: "Indicators of Malware Attacks",
    youtubeId: "X_1W9zZgJno",
    duration: "14:31",
    syllabusTopicId: "2.4",
    domainName: "Domain 2: Threats, Vulnerabilities, and Mitigations"
  },
  {
    id: "messer-10",
    title: "Enterprise Hardening and Mitigations",
    youtubeId: "yO0M1_N8g0c",
    duration: "11:18",
    syllabusTopicId: "2.5",
    domainName: "Domain 2: Threats, Vulnerabilities, and Mitigations"
  },
  // Domain 3: Security Architecture
  {
    id: "messer-11",
    title: "Cloud Models and Architecture",
    youtubeId: "fM6R2-Uf1-I",
    duration: "13:10",
    syllabusTopicId: "3.1",
    domainName: "Domain 3: Security Architecture"
  },
  {
    id: "messer-12",
    title: "Securing Network Infrastructure",
    youtubeId: "p5b9G7h4e-o",
    duration: "12:45",
    syllabusTopicId: "3.2",
    domainName: "Domain 3: Security Architecture"
  },
  {
    id: "messer-13",
    title: "Data Protection and Classification",
    youtubeId: "h1l9Q8B5jOQ",
    duration: "10:15",
    syllabusTopicId: "3.3",
    domainName: "Domain 3: Security Architecture"
  },
  {
    id: "messer-14",
    title: "Resilience, Backups and Recovery",
    youtubeId: "n7-w1K0KqU4",
    duration: "14:02",
    syllabusTopicId: "3.4",
    domainName: "Domain 3: Security Architecture"
  },
  // Domain 4: Security Operations
  {
    id: "messer-15",
    title: "Securing Computing Resources",
    youtubeId: "D8e5W4bY-4o",
    duration: "11:58",
    syllabusTopicId: "4.1",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-16",
    title: "Asset Lifecycle and Management",
    youtubeId: "W_v_N9eKzW4",
    duration: "08:50",
    syllabusTopicId: "4.2",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-17",
    title: "Vulnerability Management Process",
    youtubeId: "Bq5D0oF-O6Y",
    duration: "13:20",
    syllabusTopicId: "4.3",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-18",
    title: "Security Operations Tools & SIEM",
    youtubeId: "c6l_8m8m8M8",
    duration: "11:15",
    syllabusTopicId: "4.4",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-19",
    title: "Modifying Enterprise Capabilities",
    youtubeId: "K9w_Yq7ZnoY",
    duration: "14:40",
    syllabusTopicId: "4.5",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-20",
    title: "Identity and Access Management",
    youtubeId: "N7T7K7K7o8o",
    duration: "15:10",
    syllabusTopicId: "4.6",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-21",
    title: "Security Automation and Orchestration",
    youtubeId: "v8L2M-v7Gco",
    duration: "09:30",
    syllabusTopicId: "4.7",
    domainName: "Domain 4: Security Operations"
  },
  {
    id: "messer-22",
    title: "Incident Response and Forensics",
    youtubeId: "D4j_Y8_qW8g",
    duration: "12:55",
    syllabusTopicId: "4.8",
    domainName: "Domain 4: Security Operations"
  },
  // Domain 5: Security Program Management and Oversight
  {
    id: "messer-23",
    title: "Security Governance",
    youtubeId: "v9J9U-v8g9M",
    duration: "11:25",
    syllabusTopicId: "5.1",
    domainName: "Domain 5: Security Program Management and Oversight"
  },
  {
    id: "messer-24",
    title: "Risk Management and BIA",
    youtubeId: "qO8w-L8W_8Y",
    duration: "14:18",
    syllabusTopicId: "5.2",
    domainName: "Domain 5: Security Program Management and Oversight"
  },
  {
    id: "messer-25",
    title: "Third-Party Risk and SLA",
    youtubeId: "W7w9Q7J8e38",
    duration: "09:12",
    syllabusTopicId: "5.3",
    domainName: "Domain 5: Security Program Management and Oversight"
  },
  {
    id: "messer-26",
    title: "Audits and Assessments",
    youtubeId: "M8J9U8Y-e7o",
    duration: "10:35",
    syllabusTopicId: "5.5",
    domainName: "Domain 5: Security Program Management and Oversight"
  }
];
