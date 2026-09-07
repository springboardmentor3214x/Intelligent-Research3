export const initialResearchProfile = {
  id: "RES-10234",

  personalInfo: {
    fullName: "Dr. Priya Sharma",
    email: "priya.sharma@research.org",
    phone: "+91 98765 43210",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    designation: "Lead AI Researcher & Principal Scientist",
    qualification: "Ph.D. in Computer Science & Artificial Intelligence",
    experienceYears: 9,
    researcherType: "Academic Researcher"
  },

  organization: {
    name: "National Institute of Advanced Computing",
    type: "Research Institute",
    department: "Computer Science and Intelligent Systems",
    designation: "Lead AI Researcher",
    website: "https://niac.res.in",
    country: "India",
    city: "Bengaluru",
    laboratory: "AI & Cognitive Computing Lab",
    description: "Premier national research institute advancing foundational AI, multimodal architectures, and mission-critical intelligence systems."
  },

  research: {
    primaryDomain: "Artificial Intelligence",
    researchAreas: [
      "Machine Learning",
      "Deep Learning",
      "Explainable AI",
      "Predictive Analytics",
      "Computer Vision",
      "Natural Language Processing"
    ],
    interests: "Explainable and trustworthy AI, multimodal foundation models, biomedical image synthesis, real-time edge neural inference, and algorithmic transparency.",
    summary: "Senior AI researcher with 9+ years of foundational and applied research experience across neural network architectures, medical imaging diagnostics, and interpretable deep learning pipelines."
  },

  keywords: [
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Explainable AI",
    "Computer Vision",
    "Natural Language Processing",
    "Predictive Analytics",
    "Generative AI",
    "Edge AI",
    "Multimodal Learning"
  ],

  technologies: [
    {
      id: "tech-1",
      name: "PyTorch & TorchScript",
      category: "AI & ML",
      proficiency: "Expert",
      experienceYears: 8
    },
    {
      id: "tech-2",
      name: "TensorFlow & JAX",
      category: "AI & ML",
      proficiency: "Advanced",
      experienceYears: 6
    },
    {
      id: "tech-3",
      name: "Generative AI & LLMs",
      category: "AI & ML",
      proficiency: "Advanced",
      experienceYears: 3
    },
    {
      id: "tech-4",
      name: "Distributed Training (Ray / DeepSpeed)",
      category: "Software",
      proficiency: "Advanced",
      experienceYears: 4
    },
    {
      id: "tech-5",
      name: "Docker & Kubernetes for ML",
      category: "Software",
      proficiency: "Intermediate",
      experienceYears: 5
    },
    {
      id: "tech-6",
      name: "Edge AI & TensorRT",
      category: "Emerging Technologies",
      proficiency: "Advanced",
      experienceYears: 4
    },
    {
      id: "tech-7",
      name: "Quantum Machine Learning",
      category: "Emerging Technologies",
      proficiency: "Intermediate",
      experienceYears: 2
    }
  ],

  publications: [
    {
      id: "pub-1",
      title: "Interpretable Deep Learning Frameworks for High-Stakes Clinical Diagnostics",
      authors: ["Dr. Priya Sharma", "Marcus Vance", "Dr. Arvind Rao"],
      journal: "IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI)",
      type: "Journal",
      publicationDate: "2025-04-15",
      doi: "10.1109/TPAMI.2025.1092831",
      url: "https://doi.org/10.1109/TPAMI.2025.1092831",
      researchDomain: "Artificial Intelligence",
      keywords: "Explainable AI, Medical Imaging, Deep Learning, Interpretability",
      citationCount: 48,
      abstract: "We introduce a novel self-explaining neural architecture that outputs pixel-level attribution saliency alongside confidence bounds for multi-organ disease classification, achieving a 98.4% diagnostic concordance rate."
    },
    {
      id: "pub-2",
      title: "Self-Supervised Contrastive Representation Learning on Edge Heterogeneous Sensors",
      authors: ["Dr. Priya Sharma", "Elena Rostova"],
      journal: "Neural Information Processing Systems (NeurIPS 2024)",
      type: "Conference",
      publicationDate: "2024-12-08",
      doi: "10.48550/arXiv.2411.09123",
      url: "https://neurips.cc/virtual/2024/poster/93812",
      researchDomain: "Machine Learning",
      keywords: "Contrastive Learning, Edge AI, IoT, Representation Learning",
      citationCount: 36,
      abstract: "A compressed self-supervised contrastive learning framework optimized for microcontrollers and edge compute nodes with 8-bit integer quantization."
    },
    {
      id: "pub-3",
      title: "Multimodal Foundation Models for Automated Patent Prior-Art Discovery",
      authors: ["Dr. Priya Sharma", "Dr. Rajesh Kothari", "Sunita Nair"],
      journal: "ACM Computing Surveys",
      type: "Journal",
      publicationDate: "2024-06-20",
      doi: "10.1145/3658912",
      url: "https://dl.acm.org/doi/10.1145/3658912",
      researchDomain: "Natural Language Processing",
      keywords: "Patent Analysis, Knowledge Graphs, Multimodal NLP, Information Retrieval",
      citationCount: 29,
      abstract: "Survey and benchmark of large language models combined with technical graph embeddings for cross-lingual patent novelty search."
    },
    {
      id: "pub-4",
      title: "Fairness-Aware Neural Pruning for Real-Time Edge Video Analytics",
      authors: ["Dr. Priya Sharma", "Kenneth O'Connor"],
      journal: "CVPR Workshops on Embedded Vision",
      type: "Workshop",
      publicationDate: "2023-06-18",
      doi: "10.1109/CVPRW.2023.00412",
      url: "https://openaccess.thecvf.com/CVPR2023_workshops",
      researchDomain: "Computer Vision",
      keywords: "Fairness, Model Pruning, Computer Vision, Edge Computing",
      citationCount: 19,
      abstract: "Analysis of demographic bias drift when aggressive structured pruning is applied to convolutional and vision transformer backbones."
    },
    {
      id: "pub-5",
      title: "Quantum-Classical Hybrid Architectures for Combinatorial Optimization in Drug Discovery",
      authors: ["Dr. Priya Sharma", "V. Balasubramanian"],
      journal: "Nature Machine Intelligence",
      type: "Journal",
      publicationDate: "2023-01-14",
      doi: "10.1038/s42256-023-00612-4",
      url: "https://nature.com/articles/s42256-023-00612-4",
      researchDomain: "Quantum Computing",
      keywords: "Quantum ML, Drug Discovery, Hybrid Algorithms",
      citationCount: 52,
      abstract: "A variational quantum eigensolver pipeline enhanced with classical deep generative models for molecular conformation screening."
    }
  ],

  patents: [
    {
      id: "pat-1",
      title: "System and Method for Interpretable Neural Decision Verification in Automated Medical Screening",
      patentNumber: "US-11948201-B2",
      inventors: ["Dr. Priya Sharma", "Dr. Arvind Rao"],
      assignee: "National Institute of Advanced Computing",
      filingDate: "2023-03-14",
      grantDate: "2025-01-28",
      status: "Granted",
      classification: "G06N 3/08 (Artificial Neural Networks)",
      technologyDomain: "Artificial Intelligence",
      country: "United States",
      citationCount: 14,
      patentUrl: "https://patents.google.com/patent/US11948201B2/en",
      description: "An automated real-time inspection pipeline using layer-wise relevance propagation with bounded error margins for mission-critical diagnostics."
    },
    {
      id: "pat-2",
      title: "Adaptive On-Device Contrastive Representation Engine for Low-Power Microcontrollers",
      patentNumber: "IN-202441019283",
      inventors: ["Dr. Priya Sharma", "Elena Rostova"],
      assignee: "National Institute of Advanced Computing",
      filingDate: "2024-04-12",
      grantDate: null,
      status: "Published",
      classification: "G06F 15/78 (Architectures of General Purpose Computers)",
      technologyDomain: "Edge AI & IoT",
      country: "India",
      citationCount: 6,
      patentUrl: "https://ipindiaservices.gov.in",
      description: "Apparatus for energy-efficient continual learning on memory-constrained hardware using dynamic weight clustering."
    },
    {
      id: "pat-3",
      title: "Automated Cross-Lingual Prior-Art Extraction and Innovation Scoring Architecture",
      patentNumber: "EP-4109283-A1",
      inventors: ["Dr. Priya Sharma", "Dr. Rajesh Kothari"],
      assignee: "National Institute of Advanced Computing",
      filingDate: "2023-09-05",
      grantDate: null,
      status: "Pending",
      classification: "G06F 16/33 (Information Retrieval)",
      technologyDomain: "Natural Language Processing",
      country: "European Union",
      citationCount: 3,
      patentUrl: "https://worldwide.espacenet.com",
      description: "A semantic graph embedding method for parsing non-patent literature against multi-jurisdiction patent claims."
    }
  ],

  researchHistory: [
    {
      id: "hist-1",
      position: "Lead AI Researcher & Principal Scientist",
      organization: "National Institute of Advanced Computing",
      role: "Principal Investigator",
      startDate: "2021-08-01",
      endDate: null,
      current: true,
      description: "Directing the Cognitive Systems Lab, supervising 8 PhD scholars, and leading national funded grants in trustworthy AI and healthcare automation."
    },
    {
      id: "hist-2",
      position: "Senior Research Scientist",
      organization: "Global AI & Innovation Labs",
      role: "Applied Research Lead",
      startDate: "2018-06-01",
      endDate: "2021-07-31",
      current: false,
      description: "Engineered deep learning vision backbones deployed across 14 enterprise edge facilities, authoring 6 patents and 12 conference papers."
    },
    {
      id: "hist-3",
      position: "Postdoctoral Research Fellow",
      organization: "Center for Computational Sciences",
      role: "Postdoctoral Researcher",
      startDate: "2016-09-01",
      endDate: "2018-05-31",
      current: false,
      description: "Conducted research on variational inference, Bayesian deep learning, and scalable GPU distributed training paradigms."
    }
  ]
};