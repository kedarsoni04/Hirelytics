"""
Hirelytics — Database Seeding Script for Realistic Demo Data

Populates realistic demo data directly via SQLAlchemy without calling external AI APIs:
1. 4 Verified Companies with login accounts (password: Demo1234!)
2. 10 Live Drives across varied roles, packages, branches, and deadlines, each with 5 MCQ questions
3. 20 Active Students with Indian colleges, varied branches, CGPAs (6.5-9.5), and skills
4. 24 Applications spread realistically across pipeline stages:
   - 8 applied
   - 4 assessment (including 2 SHOWCASE students ready for live demo)
   - 3 ai_interview (scheduled)
   - 3 shortlisted (with full scorecards)
   - 2 offered
   - 2 hired
   - 2 rejected
5. Corresponding ActivityLogs and Notifications for student and company dashboards
6. Idempotent check (detects existing seed data, supports --reset / --force)

Usage:
    cd src && python -m app.seed_demo_data
    or from repo root:
    python src/app/seed_demo_data.py
    python seed_demo_data.py
    python src/app/seed_demo_data.py --reset
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Ensure 'src' is in sys.path so 'app' package imports work cleanly
src_dir = str(Path(__file__).resolve().parent.parent)
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, init_db
from app import models
from app.routers.auth import hash_password

DEMO_PASSWORD = "Demo1234!"
DEMO_PASSWORD_HASH = hash_password(DEMO_PASSWORD)

DEMO_COMPANIES_DATA = [
    {
        "company_name": "TechNova Solutions",
        "industry": "Software / Enterprise IT",
        "email": "hr@technova.com",
        "logo_url": "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&h=128&fit=crop",
    },
    {
        "company_name": "GreenLeaf Analytics",
        "industry": "Data Science & AI Solutions",
        "email": "hr@greenleaf.ai",
        "logo_url": "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&h=128&fit=crop",
    },
    {
        "company_name": "Meridian Systems",
        "industry": "Cloud Infrastructure & DevOps",
        "email": "talent@meridiansystems.com",
        "logo_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop",
    },
    {
        "company_name": "Bright Path Robotics",
        "industry": "Robotics & Embedded Systems",
        "email": "recruiting@brightpathrobotics.com",
        "logo_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=128&h=128&fit=crop",
    },
]

DEMO_DRIVES_DATA = [
    # TechNova Solutions (index 0, 1, 2)
    {
        "company_name": "TechNova Solutions",
        "title": "Backend Engineer",
        "description": "Looking for a backend engineer proficient in Python, FastAPI, and PostgreSQL. You will design scalable microservices, optimize high-throughput DB queries, and integrate AI pipelines.",
        "package": "14 LPA",
        "location": "Bengaluru, Karnataka (Hybrid)",
        "min_cgpa": 7.50,
        "eligible_branches": ["CSE", "IT", "ECE"],
        "max_backlogs": 0,
        "deadline_days": 25,
        "questions": [
            {
                "question": "Which HTTP status code is most appropriate for a successful resource creation?",
                "options": ["200 OK", "201 Created", "202 Accepted", "204 No Content"],
                "correct_option": "201 Created"
            },
            {
                "question": "What is the primary benefit of connection pooling in PostgreSQL?",
                "options": [
                    "Decreases server memory footprint by closing connections",
                    "Reduces overhead of repeatedly establishing TCP and TLS handshakes",
                    "Automatically generates missing database indexes",
                    "Prevents SQL injection vulnerabilities"
                ],
                "correct_option": "Reduces overhead of repeatedly establishing TCP and TLS handshakes"
            },
            {
                "question": "In Python FastAPI, which library is leveraged under the hood for data validation?",
                "options": ["Marshmallow", "Pydantic", "Cerberus", "Schema"],
                "correct_option": "Pydantic"
            },
            {
                "question": "Which database isolation level prevents dirty reads, non-repeatable reads, and phantom reads?",
                "options": ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
                "correct_option": "Serializable"
            },
            {
                "question": "What data structure does a standard PostgreSQL B-Tree index use for range scans?",
                "options": ["Hash Table", "Self-Balancing B+ Tree", "Skip List", "Red-Black Tree"],
                "correct_option": "Self-Balancing B+ Tree"
            }
        ]
    },
    {
        "company_name": "TechNova Solutions",
        "title": "Frontend Developer Intern",
        "description": "Join our frontend engineering team to craft high-performance UI using Next.js, React, TypeScript, and Tailwind CSS. Focus on accessibility, responsive design, and micro-animations.",
        "package": "8 LPA",
        "location": "Bengaluru, Karnataka",
        "min_cgpa": 7.00,
        "eligible_branches": ["CSE", "IT"],
        "max_backlogs": 0,
        "deadline_days": 10,
        "questions": [
            {
                "question": "In React 18+, which hook is used to defer updating non-urgent parts of the UI?",
                "options": ["useMemo", "useTransition", "useCallback", "useLayoutEffect"],
                "correct_option": "useTransition"
            },
            {
                "question": "In Next.js App Router, where do Server Components execute by default?",
                "options": [
                    "Exclusively on the client browser",
                    "On the server, outputting pre-rendered HTML/RSC payload",
                    "Inside a web worker thread",
                    "In local storage"
                ],
                "correct_option": "On the server, outputting pre-rendered HTML/RSC payload"
            },
            {
                "question": "Which CSS utility in Tailwind creates an element with flexbox column layout and gap of 1rem?",
                "options": ["flex flex-row gap-4", "flex flex-col gap-4", "grid grid-col-4", "block col-gap-4"],
                "correct_option": "flex flex-col gap-4"
            },
            {
                "question": "What is the key benefit of TypeScript's 'unknown' type over 'any'?",
                "options": [
                    "It allows arbitrary property access without type narrowing",
                    "It forces type checking and narrowing before operations can be performed",
                    "It automatically converts strings to numbers",
                    "It is compiled to WebAssembly"
                ],
                "correct_option": "It forces type checking and narrowing before operations can be performed"
            },
            {
                "question": "Which DOM event listener option prevents passive scroll performance bottlenecks?",
                "options": ["capture: true", "passive: true", "once: true", "bubbles: false"],
                "correct_option": "passive: true"
            }
        ]
    },
    {
        "company_name": "TechNova Solutions",
        "title": "Full Stack Developer",
        "description": "Architect end-to-end web applications combining modern TypeScript frontend and FastAPI / Go backend services. Experience with Docker and CI/CD pipelines preferred.",
        "package": "18 LPA",
        "location": "Hyderabad, Telangana",
        "min_cgpa": 8.00,
        "eligible_branches": ["CSE", "IT"],
        "max_backlogs": 0,
        "deadline_days": 40,
        "questions": [
            {
                "question": "What mechanism protects web clients against Cross-Site Request Forgery (CSRF)?",
                "options": ["CORS headers alone", "Anti-CSRF Tokens and SameSite cookie attributes", "HTTPS encryption alone", "Base64 encoding"],
                "correct_option": "Anti-CSRF Tokens and SameSite cookie attributes"
            },
            {
                "question": "In Docker, what is the primary benefit of multi-stage builds?",
                "options": [
                    "Running multiple containers simultaneously",
                    "Drastically reducing final production image size by leaving build tools behind",
                    "Encrypting the container filesystem",
                    "Bypassing Linux kernel namespaces"
                ],
                "correct_option": "Drastically reducing final production image size by leaving build tools behind"
            },
            {
                "question": "When implementing JWT authentication, where should refresh tokens ideally be stored on the client?",
                "options": ["window.localStorage", "HttpOnly, Secure, SameSite cookies", "Redux store in plaintext", "URL query params"],
                "correct_option": "HttpOnly, Secure, SameSite cookies"
            },
            {
                "question": "Which HTTP caching header defines directives for both shared and private caches?",
                "options": ["ETag", "Cache-Control", "Last-Modified", "Expires"],
                "correct_option": "Cache-Control"
            },
            {
                "question": "What is the time complexity of searching a balanced binary search tree with N elements?",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_option": "O(log N)"
            }
        ]
    },

    # GreenLeaf Analytics (index 3, 4, 5)
    {
        "company_name": "GreenLeaf Analytics",
        "title": "Data Analyst",
        "description": "Analyze large-scale customer journey datasets. Build interactive dashboards in Power BI / Tableau, craft advanced SQL transformations, and model trends using Python.",
        "package": "10 LPA",
        "location": "Pune, Maharashtra",
        "min_cgpa": 7.00,
        "eligible_branches": ["CSE", "IT", "Data Science", "ECE"],
        "max_backlogs": 0,
        "deadline_days": 14,
        "questions": [
            {
                "question": "Which SQL window function computes running rank while skipping rank numbers on ties?",
                "options": ["ROW_NUMBER()", "DENSE_RANK()", "RANK()", "LEAD()"],
                "correct_option": "RANK()"
            },
            {
                "question": "In Pandas, which method is most computationally efficient for merging two DataFrames on an indexed key?",
                "options": ["df1.append(df2)", "df1.join(df2)", "for loop concatenation", "applymap"],
                "correct_option": "df1.join(df2)"
            },
            {
                "question": "Which statistical measure represents the degree of asymmetry of a probability distribution?",
                "options": ["Kurtosis", "Skewness", "Variance", "Covariance"],
                "correct_option": "Skewness"
            },
            {
                "question": "In Power BI, what does DAX stand for?",
                "options": ["Data Analysis Expressions", "Data Automation XML", "Dynamic Aggregation Syntax", "Direct Access eXchange"],
                "correct_option": "Data Analysis Expressions"
            },
            {
                "question": "What is the primary symptom of multicollinearity in linear regression?",
                "options": [
                    "Residuals are non-normally distributed",
                    "Independent variables are highly correlated, leading to unstable coefficient estimates",
                    "R-squared drops to zero",
                    "Target variable becomes discrete"
                ],
                "correct_option": "Independent variables are highly correlated, leading to unstable coefficient estimates"
            }
        ]
    },
    {
        "company_name": "GreenLeaf Analytics",
        "title": "Machine Learning Engineer",
        "description": "Develop and deploy deep learning and NLP models. Work with PyTorch, LangChain, vector databases, and LLM fine-tuning pipelines on Google Cloud.",
        "package": "20 LPA",
        "location": "Bengaluru, Karnataka (Remote)",
        "min_cgpa": 8.00,
        "eligible_branches": ["CSE", "IT", "AI/DS"],
        "max_backlogs": 0,
        "deadline_days": 30,
        "questions": [
            {
                "question": "In Transformer self-attention, what prevents future tokens from attending to subsequent positions during autoregressive generation?",
                "options": ["LayerNorm", "Causal Attention Masking", "Dropout", "Residual Connections"],
                "correct_option": "Causal Attention Masking"
            },
            {
                "question": "What parameter in Low-Rank Adaptation (LoRA) determines the rank of the decomposition matrices?",
                "options": ["alpha", "r", "dropout", "temperature"],
                "correct_option": "r"
            },
            {
                "question": "Which distance metric is standard for cosine similarity on unit-normalized embeddings in vector databases?",
                "options": ["Manhattan distance", "Inner product / Dot product", "Chebyshev distance", "Mahalanobis distance"],
                "correct_option": "Inner product / Dot product"
            },
            {
                "question": "What technique mitigates vanishing gradients in deep residual networks?",
                "options": ["Sigmoid activation", "Identity skip connections", "L1 regularization", "Gradient clipping alone"],
                "correct_option": "Identity skip connections"
            },
            {
                "question": "Which evaluation metric is best suited for imbalanced binary classification where false negatives are critical?",
                "options": ["Accuracy", "ROC-AUC / Recall", "Mean Squared Error", "Adjusted R-squared"],
                "correct_option": "ROC-AUC / Recall"
            }
        ]
    },
    {
        "company_name": "GreenLeaf Analytics",
        "title": "Data Engineer",
        "description": "Build reliable ETL / ELT data pipelines using Spark, Airflow, and BigQuery. Maintain warehouse schemas and ensure high data quality across analytics stores.",
        "package": "15 LPA",
        "location": "Gurugram, Haryana",
        "min_cgpa": 7.50,
        "eligible_branches": ["CSE", "IT", "ECE"],
        "max_backlogs": 0,
        "deadline_days": 21,
        "questions": [
            {
                "question": "In Apache Spark, which transformation causes a wide dependency shuffle across cluster nodes?",
                "options": ["map()", "filter()", "groupByKey()", "flatMap()"],
                "correct_option": "groupByKey()"
            },
            {
                "question": "In Apache Airflow, what construct ensures tasks run sequentially?",
                "options": ["Bitshift operators (>>) or set_downstream", "Cron triggers", "XCom pulls alone", "Pool limits"],
                "correct_option": "Bitshift operators (>>) or set_downstream"
            },
            {
                "question": "What is the primary advantage of columnar storage formats like Parquet over row-based formats like CSV?",
                "options": [
                    "Human readable plaintext",
                    "Efficient column projection and high compression ratio for analytical queries",
                    "Simpler parsing in shell scripts",
                    "Faster single-row updates"
                ],
                "correct_option": "Efficient column projection and high compression ratio for analytical queries"
            },
            {
                "question": "What does ACID stand for in database transaction management?",
                "options": [
                    "Atomicity, Consistency, Isolation, Durability",
                    "Availability, Concurrency, Integrity, Durability",
                    "Access, Control, Indexing, Delivery",
                    "Asynchronous, Coordinated, Immutable, Distributed"
                ],
                "correct_option": "Atomicity, Consistency, Isolation, Durability"
            },
            {
                "question": "In data warehousing, what is a Slowly Changing Dimension (SCD) Type 2?",
                "options": [
                    "Overwriting the existing attribute with the new value",
                    "Creating a new record with effective dates and a current flag to preserve history",
                    "Adding a new column for the previous value",
                    "Deleting historical records"
                ],
                "correct_option": "Creating a new record with effective dates and a current flag to preserve history"
            }
        ]
    },

    # Meridian Systems (index 6, 7)
    {
        "company_name": "Meridian Systems",
        "title": "DevOps Engineer",
        "description": "Manage multi-cloud infrastructure on AWS and GCP. Deploy containerized microservices using Kubernetes (EKS/GKE), Terraform, and GitLab CI/CD.",
        "package": "16 LPA",
        "location": "Bengaluru, Karnataka",
        "min_cgpa": 7.00,
        "eligible_branches": ["CSE", "IT", "ECE"],
        "max_backlogs": 0,
        "deadline_days": 18,
        "questions": [
            {
                "question": "In Kubernetes, which controller ensures a copy of a Pod runs on all (or some) nodes in the cluster?",
                "options": ["Deployment", "StatefulSet", "DaemonSet", "Job"],
                "correct_option": "DaemonSet"
            },
            {
                "question": "What Terraform command reconciles existing infrastructure with configuration files and outputs a preview?",
                "options": ["terraform init", "terraform plan", "terraform apply --auto-approve", "terraform refresh"],
                "correct_option": "terraform plan"
            },
            {
                "question": "What is the primary function of a Kubernetes Ingress controller?",
                "options": [
                    "Provision virtual machines on AWS EC2",
                    "Route HTTP and HTTPS traffic from outside the cluster to internal services",
                    "Rotate node SSH keys automatically",
                    "Schedule cron backup tasks"
                ],
                "correct_option": "Route HTTP and HTTPS traffic from outside the cluster to internal services"
            },
            {
                "question": "In Prometheus monitoring, which metric type represents a cumulative metric that only increases or resets to zero?",
                "options": ["Gauge", "Counter", "Histogram", "Summary"],
                "correct_option": "Counter"
            },
            {
                "question": "What deployment strategy routes a small percentage of production traffic to a new version before full rollout?",
                "options": ["Recreate", "Canary Deployment", "Blue/Green Deployment", "In-place Rolling Replacement"],
                "correct_option": "Canary Deployment"
            }
        ]
    },
    {
        "company_name": "Meridian Systems",
        "title": "Cloud Security Analyst",
        "description": "Perform vulnerability assessments, audit IAM roles, secure Kubernetes clusters, and enforce zero-trust security postures across production environments.",
        "package": "13 LPA",
        "location": "Hyderabad, Telangana (Hybrid)",
        "min_cgpa": 7.20,
        "eligible_branches": ["CSE", "IT"],
        "max_backlogs": 0,
        "deadline_days": 35,
        "questions": [
            {
                "question": "What principle mandates that users and services should only be granted minimum necessary permissions?",
                "options": ["Principle of Open Access", "Principle of Least Privilege", "Separation of Concerns", "Defense in Depth"],
                "correct_option": "Principle of Least Privilege"
            },
            {
                "question": "What does mTLS provide in a microservices service mesh?",
                "options": [
                    "Mutual authentication and encrypted communication between services",
                    "Automatic load shedding for failed requests",
                    "DNS resolution caching",
                    "Compression of JSON payloads"
                ],
                "correct_option": "Mutual authentication and encrypted communication between services"
            },
            {
                "question": "Which attack exploits unsanitized user inputs executed in the browser context?",
                "options": ["SQL Injection", "Cross-Site Scripting (XSS)", "DNS Spoofing", "ARP Poisoning"],
                "correct_option": "Cross-Site Scripting (XSS)"
            },
            {
                "question": "What is the primary role of a Cloud Security Posture Management (CSPM) tool?",
                "options": [
                    "Continually monitor cloud resources for configuration drift and compliance violations",
                    "Block DDoS attacks at Layer 7",
                    "Replace VPN gateways",
                    "Compress cloud storage objects"
                ],
                "correct_option": "Continually monitor cloud resources for configuration drift and compliance violations"
            },
            {
                "question": "In asymmetric cryptography, which key is used to decrypt a message encrypted with a public key?",
                "options": ["The sender's public key", "The recipient's private key", "A shared symmetric salt", "The certificate authority key"],
                "correct_option": "The recipient's private key"
            }
        ]
    },

    # Bright Path Robotics (index 8, 9)
    {
        "company_name": "Bright Path Robotics",
        "title": "Robotics Software Engineer",
        "description": "Develop motion planning and perception algorithms using ROS2, C++, and Python for autonomous mobile robots. Work with LIDAR, SLAM, and real-time computer vision.",
        "package": "17 LPA",
        "location": "Chennai, Tamil Nadu",
        "min_cgpa": 7.50,
        "eligible_branches": ["Robotics", "ECE", "CSE", "Mechanical"],
        "max_backlogs": 0,
        "deadline_days": 28,
        "questions": [
            {
                "question": "What middleware communication architecture does ROS2 utilize for peer-to-peer discovery?",
                "options": ["TCP/IP sockets alone", "DDS (Data Distribution Service)", "ZeroMQ", "gRPC over HTTP/2"],
                "correct_option": "DDS (Data Distribution Service)"
            },
            {
                "question": "What does SLAM stand for in autonomous mobile robotics?",
                "options": [
                    "Simultaneous Localization and Mapping",
                    "Synchronous Linear Actuation Module",
                    "Spatial Lidar Alignment Matrix",
                    "Sub-surface Land Navigation Model"
                ],
                "correct_option": "Simultaneous Localization and Mapping"
            },
            {
                "question": "Which state estimation algorithm is standard for fusing noisy IMU and wheel encoder measurements?",
                "options": ["Extended Kalman Filter (EKF)", "K-Nearest Neighbors", "Gradient Descent", "Dijkstra's Algorithm"],
                "correct_option": "Extended Kalman Filter (EKF)"
            },
            {
                "question": "In C++, which smart pointer allows shared ownership of a dynamically allocated resource?",
                "options": ["std::unique_ptr", "std::shared_ptr", "std::weak_ptr", "std::auto_ptr"],
                "correct_option": "std::shared_ptr"
            },
            {
                "question": "Which path planning algorithm uses heuristics to find the shortest path on a discrete grid map?",
                "options": ["Breadth-First Search", "A* Algorithm", "Bellman-Ford", "Floyd-Warshall"],
                "correct_option": "A* Algorithm"
            }
        ]
    },
    {
        "company_name": "Bright Path Robotics",
        "title": "Embedded Systems Intern",
        "description": "Program STM32 and ESP32 microcontrollers in Embedded C/C++. Integrate I2C, SPI, and CAN communication buses for motor controllers and sensors.",
        "package": "9 LPA",
        "location": "Bengaluru, Karnataka",
        "min_cgpa": 6.80,
        "eligible_branches": ["ECE", "EEE", "Robotics"],
        "max_backlogs": 0,
        "deadline_days": 12,
        "questions": [
            {
                "question": "How many signal lines are required for standard I2C bus communication (excluding power/ground)?",
                "options": ["1 (TX)", "2 (SDA, SCL)", "4 (MOSI, MISO, SCK, CS)", "8 (Parallel bus)"],
                "correct_option": "2 (SDA, SCL)"
            },
            {
                "question": "What is the primary function of a Watchdog Timer (WDT) in microcontrollers?",
                "options": [
                    "Measure PWM duty cycle for motor drivers",
                    "Reset the processor if software crashes or hangs in an infinite loop",
                    "Generate high-precision audio tones",
                    "Keep track of the real-world date and time"
                ],
                "correct_option": "Reset the processor if software crashes or hangs in an infinite loop"
            },
            {
                "question": "What C keyword instructs the compiler NOT to optimize reads/writes to a memory address (e.g. hardware registers)?",
                "options": ["static", "const", "volatile", "register"],
                "correct_option": "volatile"
            },
            {
                "question": "In FreeRTOS, what scheduling policy switches tasks when a higher priority task becomes ready?",
                "options": ["Cooperative Scheduling", "Preemptive Priority-Based Scheduling", "First In First Out", "Round Robin alone"],
                "correct_option": "Preemptive Priority-Based Scheduling"
            },
            {
                "question": "Which communication bus is commonly used in automotive and industrial robotics for high electrical noise immunity?",
                "options": ["UART", "CAN Bus", "SPI", "USB 2.0"],
                "correct_option": "CAN Bus"
            }
        ]
    },
]

DEMO_STUDENTS_DATA = [
    # SHOWCASE 1
    {
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@demo.hirelytics.in",
        "college": "IIT Bombay",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.95,
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/aarav-sharma-demo",
        "github_url": "https://github.com/aaravsharma-demo",
        "is_showcase": True,
    },
    # SHOWCASE 2
    {
        "full_name": "Priya Patel",
        "email": "priya.patel@demo.hirelytics.in",
        "college": "NIT Trichy",
        "branch": "Information Technology",
        "cgpa": 8.78,
        "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/priya-patel-demo",
        "github_url": "https://github.com/priyapatel-demo",
        "is_showcase": True,
    },
    # Regular students 3 - 20
    {
        "full_name": "Rohan Verma",
        "email": "rohan.verma@demo.hirelytics.in",
        "college": "BITS Pilani",
        "branch": "Computer Science and Engineering",
        "cgpa": 9.15,
        "skills": ["Python", "FastAPI", "PostgreSQL", "System Design", "Kafka"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/rohan-verma-demo",
        "github_url": "https://github.com/rohanverma-demo",
    },
    {
        "full_name": "Ananya Iyer",
        "email": "ananya.iyer@demo.hirelytics.in",
        "college": "VIT Vellore",
        "branch": "Information Technology",
        "cgpa": 8.60,
        "skills": ["SQL", "Python", "Power BI", "Pandas", "Tableau"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/ananya-iyer-demo",
        "github_url": "https://github.com/ananyaiyer-demo",
    },
    {
        "full_name": "Siddharth Nair",
        "email": "siddharth.nair@demo.hirelytics.in",
        "college": "Delhi Technological University (DTU)",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.45,
        "skills": ["AWS", "Docker", "Kubernetes", "Linux", "Terraform"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/siddharth-nair-demo",
        "github_url": "https://github.com/siddharthnair-demo",
    },
    {
        "full_name": "Sneha Kulkarni",
        "email": "sneha.kulkarni@demo.hirelytics.in",
        "college": "College of Engineering Pune (COEP)",
        "branch": "Electronics & Telecommunication",
        "cgpa": 8.20,
        "skills": ["C++", "ROS2", "Python", "Computer Vision", "Linux"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/sneha-kulkarni-demo",
        "github_url": "https://github.com/snehakulkarni-demo",
    },
    {
        "full_name": "Vikram Malhotra",
        "email": "vikram.malhotra@demo.hirelytics.in",
        "college": "IIIT Hyderabad",
        "branch": "Computer Science and Engineering",
        "cgpa": 9.35,
        "skills": ["PyTorch", "Python", "NLP", "LangChain", "Vector DBs"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/vikram-malhotra-demo",
        "github_url": "https://github.com/vikrammalhotra-demo",
    },
    {
        "full_name": "Ishita Gupta",
        "email": "ishita.gupta@demo.hirelytics.in",
        "college": "Manipal Institute of Technology",
        "branch": "Information Technology",
        "cgpa": 7.90,
        "skills": ["React", "JavaScript", "HTML5", "CSS3", "Git"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/ishita-gupta-demo",
        "github_url": "https://github.com/ishitagupta-demo",
    },
    {
        "full_name": "Aditi Rao",
        "email": "aditi.rao@demo.hirelytics.in",
        "college": "RV College of Engineering",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.10,
        "skills": ["Python", "Django", "SQL", "REST APIs", "Docker"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/aditi-rao-demo",
        "github_url": "https://github.com/aditirao-demo",
    },
    {
        "full_name": "Varun Deshmukh",
        "email": "varun.deshmukh@demo.hirelytics.in",
        "college": "Thapar Institute of Engineering",
        "branch": "Electronics & Communication",
        "cgpa": 7.40,
        "skills": ["Embedded C", "Microcontrollers", "IoT", "C++", "PCB Design"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/varun-deshmukh-demo",
        "github_url": "https://github.com/varundeshmukh-demo",
    },
    {
        "full_name": "Pooja Mehta",
        "email": "pooja.mehta@demo.hirelytics.in",
        "college": "PSG College of Technology",
        "branch": "Information Technology",
        "cgpa": 8.55,
        "skills": ["Spark", "Python", "BigQuery", "SQL", "Airflow"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/pooja-mehta-demo",
        "github_url": "https://github.com/poojamehta-demo",
    },
    {
        "full_name": "Kabir Sen",
        "email": "kabir.sen@demo.hirelytics.in",
        "college": "Jadavpur University",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.70,
        "skills": ["Kubernetes", "Docker", "CI/CD", "Prometheus", "Golang"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/kabir-sen-demo",
        "github_url": "https://github.com/kabirsen-demo",
    },
    {
        "full_name": "Tanvi Joshi",
        "email": "tanvi.joshi@demo.hirelytics.in",
        "college": "VJTI Mumbai",
        "branch": "Information Technology",
        "cgpa": 7.65,
        "skills": ["TypeScript", "React", "Node.js", "MongoDB", "Express"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/tanvi-joshi-demo",
        "github_url": "https://github.com/tanvijoshi-demo",
    },
    {
        "full_name": "Rahul Nambiar",
        "email": "rahul.nambiar@demo.hirelytics.in",
        "college": "NIT Calicut",
        "branch": "Mechanical Engineering",
        "cgpa": 7.10,
        "skills": ["SolidWorks", "Python", "Robotics", "MATLAB", "ROS"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/rahul-nambiar-demo",
        "github_url": "https://github.com/rahulnambiar-demo",
    },
    {
        "full_name": "Divya Pillai",
        "email": "divya.pillai@demo.hirelytics.in",
        "college": "SRM Institute of Science and Technology",
        "branch": "Computer Science and Engineering",
        "cgpa": 7.85,
        "skills": ["Python", "Data Analysis", "SQL", "Excel", "Scikit-Learn"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/divya-pillai-demo",
        "github_url": "https://github.com/divyapillai-demo",
    },
    {
        "full_name": "Aryan Kapoor",
        "email": "aryan.kapoor@demo.hirelytics.in",
        "college": "Shiv Nadar University",
        "branch": "Computer Science and Engineering",
        "cgpa": 6.80,
        "skills": ["Java", "Spring Boot", "MySQL", "Git", "Postman"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/aryan-kapoor-demo",
        "github_url": "https://github.com/aryankapoor-demo",
    },
    {
        "full_name": "Riya Banerjee",
        "email": "riya.banerjee@demo.hirelytics.in",
        "college": "Heritage Institute of Technology",
        "branch": "Information Technology",
        "cgpa": 6.95,
        "skills": ["HTML/CSS", "JavaScript", "Bootstrap", "PHP", "MySQL"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/riya-banerjee-demo",
        "github_url": "https://github.com/riyabanerjee-demo",
    },
    {
        "full_name": "Harshvardhan Singh",
        "email": "harsh.singh@demo.hirelytics.in",
        "college": "SRM University Chennai",
        "branch": "Electronics & Communication",
        "cgpa": 7.30,
        "skills": ["Networks", "Linux", "Cybersecurity", "Python", "Wireshark"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/harsh-singh-demo",
        "github_url": "https://github.com/harshsingh-demo",
    },
    {
        "full_name": "Meera Nair",
        "email": "meera.nair@demo.hirelytics.in",
        "college": "BMS College of Engineering",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.30,
        "skills": ["Go", "Docker", "PostgreSQL", "gRPC", "Microservices"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/meera-nair-demo",
        "github_url": "https://github.com/meeranair-demo",
    },
    {
        "full_name": "Yash Agarwal",
        "email": "yash.agarwal@demo.hirelytics.in",
        "college": "Amity University",
        "branch": "Computer Science and Engineering",
        "cgpa": 6.60,
        "skills": ["Python", "Basic SQL", "HTML", "Git", "Linux Basics"],
        "resume_url": "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        "linkedin_url": "https://linkedin.com/in/yash-agarwal-demo",
        "github_url": "https://github.com/yashagarwal-demo",
    },
]


def clean_demo_data(db: Session) -> None:
    """Removes previously seeded demo users and all related records cleanly."""
    print("Clearing previously seeded demo data...")
    company_emails = [c["email"] for c in DEMO_COMPANIES_DATA]
    student_emails = [s["email"] for s in DEMO_STUDENTS_DATA]
    all_emails = company_emails + student_emails

    users = db.query(models.User).filter(models.User.email.in_(all_emails)).all()
    user_ids = [u.id for u in users]

    if user_ids:
        # 1. Clean up activity logs
        db.query(models.ActivityLog).filter(models.ActivityLog.user_id.in_(user_ids)).delete(synchronize_session=False)

        # 2. Find students and companies
        students = db.query(models.Student).filter(models.Student.user_id.in_(user_ids)).all()
        student_ids = [s.id for s in students]

        companies = db.query(models.Company).filter(models.Company.user_id.in_(user_ids)).all()
        company_ids = [c.id for c in companies]

        drives = db.query(models.Drive).filter(models.Drive.company_id.in_(company_ids)).all()
        drive_ids = [d.id for d in drives]

        # 3. Find applications
        app_filter = []
        if student_ids:
            app_filter.append(models.Application.student_id.in_(student_ids))
        if drive_ids:
            app_filter.append(models.Application.drive_id.in_(drive_ids))

        if app_filter:
            from sqlalchemy import or_
            apps = db.query(models.Application).filter(or_(*app_filter)).all()
            app_ids = [a.id for a in apps]

            if app_ids:
                db.query(models.Scorecard).filter(models.Scorecard.application_id.in_(app_ids)).delete(synchronize_session=False)
                db.query(models.Interview).filter(models.Interview.application_id.in_(app_ids)).delete(synchronize_session=False)
                db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.application_id.in_(app_ids)).delete(synchronize_session=False)
                db.query(models.Application).filter(models.Application.id.in_(app_ids)).delete(synchronize_session=False)

        # 4. Clean assessments and drives
        if drive_ids:
            db.query(models.Assessment).filter(models.Assessment.drive_id.in_(drive_ids)).delete(synchronize_session=False)
            db.query(models.Drive).filter(models.Drive.id.in_(drive_ids)).delete(synchronize_session=False)

        # 5. Clean profiles
        if student_ids:
            db.query(models.Student).filter(models.Student.id.in_(student_ids)).delete(synchronize_session=False)
        if company_ids:
            db.query(models.Company).filter(models.Company.id.in_(company_ids)).delete(synchronize_session=False)

        # 6. Clean notifications and users
        db.query(models.Notification).filter(models.Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.id.in_(user_ids)).delete(synchronize_session=False)

    db.commit()
    print(f"Cleaned {len(users)} existing demo accounts and associated data.")


def seed_data(reset: bool = False) -> None:
    """Main seeding function."""
    init_db()
    db: Session = SessionLocal()

    try:
        existing_company = (
            db.query(models.Company)
            .filter(models.Company.company_name == "TechNova Solutions")
            .first()
        )
        if existing_company:
            if not reset:
                print("=" * 60)
                print("WARNING: Seed demo data already exists in database!")
                print("To overwrite and re-seed fresh, run with:")
                print("    python src/app/seed_demo_data.py --reset")
                print("=" * 60)
                print("\nSHOWCASE STUDENT LOGIN CREDENTIALS (Ready for Live Demo):")
                print("  1. Email:    aarav.sharma@demo.hirelytics.in")
                print(f"     Password: {DEMO_PASSWORD}")
                print("     Status:   Stage = 'assessment' (Ready for Live Interview & Real AI Scoring)")
                print("  2. Email:    priya.patel@demo.hirelytics.in")
                print(f"     Password: {DEMO_PASSWORD}")
                print("     Status:   Stage = 'assessment' (Ready for Live Interview & Real AI Scoring)")
                print("\nCOMPANY LOGIN CREDENTIALS:")
                for c in DEMO_COMPANIES_DATA:
                    print(f"  - {c['company_name']}: {c['email']} / {DEMO_PASSWORD}")
                return
            else:
                clean_demo_data(db)

        now = datetime.now(timezone.utc)

        # ─────────────────────────────────────────────
        # 1. CREATE COMPANIES
        # ─────────────────────────────────────────────
        print("1. Seeding Companies...")
        companies_map = {}
        for c_data in DEMO_COMPANIES_DATA:
            user = models.User(
                email=c_data["email"],
                password_hash=DEMO_PASSWORD_HASH,
                role=models.UserRole.company,
                is_active=True,
                created_at=now - timedelta(days=30),
            )
            db.add(user)
            db.flush()

            company = models.Company(
                user_id=user.id,
                company_name=c_data["company_name"],
                industry=c_data["industry"],
                logo_url=c_data["logo_url"],
                notification_prefs={"email": True, "inApp": True},
                status=models.CompanyStatus.verified,
                created_at=now - timedelta(days=30),
            )
            db.add(company)
            db.flush()
            companies_map[c_data["company_name"]] = company

        # ─────────────────────────────────────────────
        # 2. CREATE DRIVES & ASSESSMENTS
        # ─────────────────────────────────────────────
        print("2. Seeding Drives & Assessments...")
        drives_list = []
        drives_map = {}
        for d_data in DEMO_DRIVES_DATA:
            company = companies_map[d_data["company_name"]]
            drive = models.Drive(
                company_id=company.id,
                title=d_data["title"],
                description=d_data["description"],
                package=d_data["package"],
                location=d_data["location"],
                min_cgpa=d_data["min_cgpa"],
                eligible_branches=d_data["eligible_branches"],
                max_backlogs=d_data["max_backlogs"],
                selection_stages=["resume", "assessment", "ai_interview", "hr"],
                status=models.DriveStatus.live,
                deadline=now + timedelta(days=d_data["deadline_days"]),
                created_at=now - timedelta(days=20),
            )
            db.add(drive)
            db.flush()
            drives_list.append(drive)
            drives_map[(d_data["company_name"], d_data["title"])] = drive

            # Create Assessment for the drive
            assessment = models.Assessment(
                drive_id=drive.id,
                questions=d_data["questions"],
                duration_mins=30,
            )
            db.add(assessment)
            db.flush()

        # ─────────────────────────────────────────────
        # 3. CREATE STUDENTS
        # ─────────────────────────────────────────────
        print("3. Seeding Students...")
        students_map = {}
        students_list = []
        for s_data in DEMO_STUDENTS_DATA:
            user = models.User(
                email=s_data["email"],
                password_hash=DEMO_PASSWORD_HASH,
                role=models.UserRole.student,
                is_active=True,
                created_at=now - timedelta(days=25),
            )
            db.add(user)
            db.flush()

            student = models.Student(
                user_id=user.id,
                full_name=s_data["full_name"],
                college=s_data["college"],
                branch=s_data["branch"],
                cgpa=s_data["cgpa"],
                skills=s_data["skills"],
                resume_url=s_data["resume_url"],
                linkedin_url=s_data.get("linkedin_url"),
                github_url=s_data.get("github_url"),
                portfolio_url=f"https://portfolio.demo/{s_data['full_name'].lower().replace(' ', '')}",
                notification_prefs={"email": True, "inApp": True},
                status=models.StudentStatus.active,
                created_at=now - timedelta(days=25),
            )
            db.add(student)
            db.flush()
            students_map[s_data["full_name"]] = student
            students_list.append(student)

        # ─────────────────────────────────────────────
        # 4. CREATE APPLICATIONS & PIPELINE PROGRESSION
        # ─────────────────────────────────────────────
        print("4. Seeding Applications across stages...")

        # Application specification (24 total)
        # 8 applied, 4 assessment (including 2 showcase), 3 ai_interview, 3 shortlisted, 2 offered, 2 hired, 2 rejected
        applications_spec = [
            # 8 APPLIED
            {
                "student_name": "Ishita Gupta",
                "company_name": "TechNova Solutions",
                "drive_title": "Frontend Developer Intern",
                "stage": models.ApplicationStage.applied,
                "days_ago": 12,
            },
            {
                "student_name": "Aditi Rao",
                "company_name": "TechNova Solutions",
                "drive_title": "Full Stack Developer",
                "stage": models.ApplicationStage.applied,
                "days_ago": 11,
            },
            {
                "student_name": "Varun Deshmukh",
                "company_name": "Bright Path Robotics",
                "drive_title": "Embedded Systems Intern",
                "stage": models.ApplicationStage.applied,
                "days_ago": 9,
            },
            {
                "student_name": "Kabir Sen",
                "company_name": "Meridian Systems",
                "drive_title": "DevOps Engineer",
                "stage": models.ApplicationStage.applied,
                "days_ago": 8,
            },
            {
                "student_name": "Tanvi Joshi",
                "company_name": "TechNova Solutions",
                "drive_title": "Backend Engineer",
                "stage": models.ApplicationStage.applied,
                "days_ago": 7,
            },
            {
                "student_name": "Rahul Nambiar",
                "company_name": "Bright Path Robotics",
                "drive_title": "Robotics Software Engineer",
                "stage": models.ApplicationStage.applied,
                "days_ago": 6,
            },
            {
                "student_name": "Divya Pillai",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Data Analyst",
                "stage": models.ApplicationStage.applied,
                "days_ago": 5,
            },
            {
                "student_name": "Meera Nair",
                "company_name": "TechNova Solutions",
                "drive_title": "Full Stack Developer",
                "stage": models.ApplicationStage.applied,
                "days_ago": 4,
            },

            # 4 ASSESSMENT (Showcase 1 & 2 + 2 regular)
            {
                "student_name": "Aarav Sharma",  # SHOWCASE 1
                "company_name": "TechNova Solutions",
                "drive_title": "Backend Engineer",
                "stage": models.ApplicationStage.assessment,
                "assessment_score": 88.0,
                "days_ago": 10,
                "is_showcase": True,
            },
            {
                "student_name": "Priya Patel",   # SHOWCASE 2
                "company_name": "TechNova Solutions",
                "drive_title": "Frontend Developer Intern",
                "stage": models.ApplicationStage.assessment,
                "assessment_score": 92.0,
                "days_ago": 10,
                "is_showcase": True,
            },
            {
                "student_name": "Harshvardhan Singh",
                "company_name": "Meridian Systems",
                "drive_title": "Cloud Security Analyst",
                "stage": models.ApplicationStage.assessment,
                "assessment_score": 68.0,
                "days_ago": 8,
            },
            {
                "student_name": "Pooja Mehta",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Data Engineer",
                "stage": models.ApplicationStage.assessment,
                "assessment_score": 74.0,
                "days_ago": 7,
            },

            # 3 AI_INTERVIEW (Scheduled, not yet taken)
            {
                "student_name": "Siddharth Nair",
                "company_name": "Meridian Systems",
                "drive_title": "DevOps Engineer",
                "stage": models.ApplicationStage.ai_interview,
                "assessment_score": 82.0,
                "scheduled_offset_days": 2,  # in 2 days
                "days_ago": 10,
            },
            {
                "student_name": "Sneha Kulkarni",
                "company_name": "Bright Path Robotics",
                "drive_title": "Robotics Software Engineer",
                "stage": models.ApplicationStage.ai_interview,
                "assessment_score": 85.0,
                "scheduled_offset_days": 3,
                "days_ago": 9,
            },
            {
                "student_name": "Ananya Iyer",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Data Analyst",
                "stage": models.ApplicationStage.ai_interview,
                "assessment_score": 80.0,
                "scheduled_offset_days": 1,
                "days_ago": 8,
            },

            # 3 SHORTLISTED (Assessment + Completed Interview + Scorecard)
            {
                "student_name": "Rohan Verma",
                "company_name": "TechNova Solutions",
                "drive_title": "Backend Engineer",
                "stage": models.ApplicationStage.shortlisted,
                "assessment_score": 88.0,
                "resume_match_score": 84.0,
                "communication_score": 82.0,
                "technical_interview_score": 86.0,
                "overall_ai_score": 85.0,
                "ai_summary": "Strong candidate with solid backend and distributed systems fundamentals.",
                "insights": [
                    "Scored 88.0% on technical assessment.",
                    "Technical Interview depth scored at 86.0%.",
                    "Strong verbal clarity with structured database schema explanations.",
                    "Demonstrated deep proficiency in FastAPI, PostgreSQL, and Redis."
                ],
                "days_ago": 12,
            },
            {
                "student_name": "Vikram Malhotra",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Machine Learning Engineer",
                "stage": models.ApplicationStage.shortlisted,
                "assessment_score": 92.0,
                "resume_match_score": 90.0,
                "communication_score": 85.0,
                "technical_interview_score": 91.0,
                "overall_ai_score": 89.5,
                "ai_summary": "Exceptional machine learning acumen with deep transformer and LLM fine-tuning knowledge.",
                "insights": [
                    "Scored 92.0% on technical assessment.",
                    "Technical Interview depth scored at 91.0%.",
                    "Clear explanation of LoRA parameter efficiency and causal attention masking.",
                    "Excellent practical experience with PyTorch and vector embeddings."
                ],
                "days_ago": 13,
            },
            {
                "student_name": "Pooja Mehta",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Data Analyst",
                "stage": models.ApplicationStage.shortlisted,
                "assessment_score": 78.0,
                "resume_match_score": 76.0,
                "communication_score": 74.0,
                "technical_interview_score": 78.0,
                "overall_ai_score": 76.5,
                "ai_summary": "Consistent analytical abilities with practical SQL, Spark, and BI modeling experience.",
                "insights": [
                    "Scored 78.0% on technical assessment.",
                    "Technical Interview depth scored at 78.0%.",
                    "Solid understanding of SQL window functions and aggregation pipelines.",
                    "Good structured responses during data modeling scenarios."
                ],
                "days_ago": 11,
            },

            # 2 OFFERED (High Scores 75-95%)
            {
                "student_name": "Sneha Kulkarni",
                "company_name": "Bright Path Robotics",
                "drive_title": "Embedded Systems Intern",
                "stage": models.ApplicationStage.offered,
                "assessment_score": 94.0,
                "resume_match_score": 92.0,
                "communication_score": 89.0,
                "technical_interview_score": 92.0,
                "overall_ai_score": 91.75,
                "ai_summary": "Outstanding candidate with stellar hardware-software integration capabilities.",
                "insights": [
                    "Scored 94.0% on technical assessment.",
                    "Technical Interview depth scored at 92.0%.",
                    "Flawless articulation of I2C/SPI bus timing and FreeRTOS task priority mechanisms.",
                    "High confidence tone and minimal filler words."
                ],
                "days_ago": 14,
            },
            {
                "student_name": "Siddharth Nair",
                "company_name": "TechNova Solutions",
                "drive_title": "Full Stack Developer",
                "stage": models.ApplicationStage.offered,
                "assessment_score": 90.0,
                "resume_match_score": 88.0,
                "communication_score": 86.0,
                "technical_interview_score": 89.0,
                "overall_ai_score": 88.25,
                "ai_summary": "High-caliber full-stack developer with sound architectural sensibilities.",
                "insights": [
                    "Scored 90.0% on technical assessment.",
                    "Technical Interview depth scored at 89.0%.",
                    "Strong system design principles and containerized CI/CD mastery.",
                    "Excellent problem-solving approach during concurrent state management questions."
                ],
                "days_ago": 15,
            },

            # 2 HIRED (High Scores 75-95%)
            {
                "student_name": "Rohan Verma",
                "company_name": "Meridian Systems",
                "drive_title": "DevOps Engineer",
                "stage": models.ApplicationStage.hired,
                "assessment_score": 95.0,
                "resume_match_score": 94.0,
                "communication_score": 91.0,
                "technical_interview_score": 94.0,
                "overall_ai_score": 93.5,
                "ai_summary": "Top-tier DevOps engineer with production Kubernetes and cloud automation mastery.",
                "insights": [
                    "Scored 95.0% on technical assessment.",
                    "Technical Interview depth scored at 94.0%.",
                    "Expert knowledge of Terraform state locking and canary release topologies.",
                    "Exceptional communication clarity and leadership potential."
                ],
                "days_ago": 16,
            },
            {
                "student_name": "Vikram Malhotra",
                "company_name": "TechNova Solutions",
                "drive_title": "Backend Engineer",
                "stage": models.ApplicationStage.hired,
                "assessment_score": 96.0,
                "resume_match_score": 93.0,
                "communication_score": 90.0,
                "technical_interview_score": 95.0,
                "overall_ai_score": 93.5,
                "ai_summary": "Exceptional algorithmic problem-solving and distributed backend mastery.",
                "insights": [
                    "Scored 96.0% on technical assessment.",
                    "Technical Interview depth scored at 95.0%.",
                    "Demonstrated deep knowledge of serializable database transactions and indexing.",
                    "Clean, confident articulation across all technical scenarios."
                ],
                "days_ago": 17,
            },

            # 2 REJECTED (1 low score, 1 stalled/screened out)
            {
                "student_name": "Aryan Kapoor",
                "company_name": "TechNova Solutions",
                "drive_title": "Backend Engineer",
                "stage": models.ApplicationStage.rejected,
                "assessment_score": 36.0,
                "resume_match_score": 42.0,
                "communication_score": 45.0,
                "technical_interview_score": 38.0,
                "overall_ai_score": 40.25,
                "ai_summary": "Significant gaps in backend fundamentals, database indexing, and API security.",
                "insights": [
                    "Scored 36.0% on technical assessment.",
                    "Technical Interview depth scored at 38.0%.",
                    "Struggled with concurrency control and database transaction boundaries.",
                    "Frequent hesitation and ungrounded responses during technical rounds."
                ],
                "days_ago": 10,
            },
            {
                "student_name": "Yash Agarwal",
                "company_name": "GreenLeaf Analytics",
                "drive_title": "Data Analyst",
                "stage": models.ApplicationStage.rejected,
                "days_ago": 8,
            },
        ]

        created_applications = []

        for spec in applications_spec:
            student = students_map[spec["student_name"]]
            drive = drives_map[(spec["company_name"], spec["drive_title"])]
            company = drive.company
            applied_time = now - timedelta(days=spec["days_ago"])

            # 1. Base Application row
            app = models.Application(
                student_id=student.id,
                drive_id=drive.id,
                current_stage=spec["stage"],
                applied_at=applied_time,
                updated_at=applied_time,
            )
            db.add(app)
            db.flush()
            created_applications.append(app)

            # ActivityLog + Notification: Applied
            db.add(models.ActivityLog(
                user_id=student.user_id,
                action=f"Applied to {drive.title} at {company.company_name}",
                log_metadata={"drive_id": drive.id, "application_id": app.id},
                created_at=applied_time,
            ))
            db.add(models.Notification(
                user_id=student.user_id,
                type="application_update",
                message=f"Your application to {drive.title} was submitted",
                is_read=True,
                created_at=applied_time,
            ))
            db.add(models.Notification(
                user_id=company.user_id,
                type="application_update",
                message=f"New application received from {student.full_name} for {drive.title}",
                is_read=True,
                created_at=applied_time,
            ))

            # 2. Assessment Submission if stage >= assessment
            has_assessment = "assessment_score" in spec
            if has_assessment:
                ass_score = spec["assessment_score"]
                ass_time = applied_time + timedelta(days=2)
                answers = [{"question_id": i, "selected_option": "Option"} for i in range(5)]
                sub = models.AssessmentSubmission(
                    application_id=app.id,
                    answers=answers,
                    score=ass_score,
                    proctor_flags=[],
                    submitted_at=ass_time,
                )
                db.add(sub)
                db.flush()

                db.add(models.ActivityLog(
                    user_id=student.user_id,
                    action=f"Completed assessment for {drive.title} — scored {ass_score}%",
                    log_metadata={"drive_id": drive.id, "application_id": app.id},
                    created_at=ass_time,
                ))
                db.add(models.Notification(
                    user_id=student.user_id,
                    type="ai_result_ready",
                    message=f"Your assessment for {drive.title} was scored: {ass_score}%",
                    is_read=True,
                    created_at=ass_time,
                ))
                db.add(models.Notification(
                    user_id=company.user_id,
                    type="application_update",
                    message=f"New assessment submission from {student.full_name} for {drive.title}",
                    is_read=True,
                    created_at=ass_time,
                ))

            # 3. Scheduled Interview (ai_interview stage)
            if spec["stage"] == models.ApplicationStage.ai_interview:
                sched_time = applied_time + timedelta(days=3)
                interview_time = now + timedelta(days=spec.get("scheduled_offset_days", 2))
                interview = models.Interview(
                    application_id=app.id,
                    questions=[
                        {"question": "Can you walk me through a complex project on your resume?", "category": "intro"},
                        {"question": "How do you approach debugging production issues?", "category": "technical"},
                        {"question": "Describe your experience with containerization and CI/CD pipelines.", "category": "technical"},
                        {"question": "How do you handle disagreements on system design decisions?", "category": "soft_skill"},
                        {"question": "Why are you interested in joining our engineering team?", "category": "closing"},
                    ],
                    scheduled_at=interview_time,
                    completed_at=None,
                    transcript=None,
                    sentiment_data={},
                )
                db.add(interview)
                db.flush()

                db.add(models.ActivityLog(
                    user_id=student.user_id,
                    action=f"Interview scheduled for {drive.title}",
                    log_metadata={"drive_id": drive.id, "application_id": app.id},
                    created_at=sched_time,
                ))
                db.add(models.Notification(
                    user_id=student.user_id,
                    type="interview_scheduled",
                    message=f"AI Video Interview scheduled for {drive.title} at {company.company_name}",
                    is_read=False,
                    created_at=sched_time,
                ))

            # 4. Completed Interview & Scorecard for shortlisted / offered / hired / rejected-with-scores
            has_full_pipeline = spec["stage"] in [
                models.ApplicationStage.shortlisted,
                models.ApplicationStage.offered,
                models.ApplicationStage.hired,
            ] or ("overall_ai_score" in spec)

            if has_full_pipeline:
                sched_time = applied_time + timedelta(days=3)
                completed_time = applied_time + timedelta(days=4)

                transcript_text = (
                    f"Question 1: Can you walk me through your engineering background and key projects?\n"
                    f"Answer: Hello! I am in my final year majoring in {student.branch} at {student.college}. "
                    f"Over the last two years, I built multiple scalable services leveraging {', '.join(student.skills[:3])}. "
                    f"My most significant project implemented asynchronous message queues and automated Docker deployments.\n\n"
                    f"Question 2: How do you ensure high performance and reliability in system design?\n"
                    f"Answer: I focus on clean service separation, efficient indexing, caching with Redis, and monitoring with Prometheus. "
                    f"I write idempotent APIs and leverage database connection pools to prevent latency degradation under high load.\n\n"
                    f"Question 3: How do you handle cross-functional collaboration and technical disagreements?\n"
                    f"Answer: I prefer backing technical proposals with data, benchmarks, and prototype experiments. "
                    f"Listening to peer feedback and prioritizing customer outcomes has always helped resolve deadlocks constructively."
                )

                sentiment = {
                    "confidence_score": float(spec.get("communication_score", 80.0)),
                    "tone": "confident" if spec.get("overall_ai_score", 70) > 70 else "neutral",
                    "communication_quality": "excellent" if spec.get("overall_ai_score", 70) >= 85 else "good",
                    "filler_word_count": 2 if spec.get("overall_ai_score", 70) >= 80 else 5,
                    "keyword_matches": [s.lower() for s in student.skills[:4]],
                    "key_strengths": ["Structured articulation", "Solid architectural depth"],
                    "areas_for_improvement": ["Further edge-case analysis in distributed failures"],
                    "technical_score": float(spec.get("technical_interview_score", 80.0)),
                }

                interview = models.Interview(
                    application_id=app.id,
                    questions=[
                        {"question": "Can you walk me through your engineering background and key projects?", "category": "intro"},
                        {"question": "How do you ensure high performance and reliability in system design?", "category": "technical"},
                        {"question": "How do you handle cross-functional collaboration and technical disagreements?", "category": "soft_skill"},
                    ],
                    scheduled_at=sched_time,
                    completed_at=completed_time,
                    transcript=transcript_text,
                    sentiment_data=sentiment,
                )
                db.add(interview)
                db.flush()

                # Interview completion log & notifications
                db.add(models.ActivityLog(
                    user_id=student.user_id,
                    action=f"Completed AI interview for {drive.title}",
                    log_metadata={"drive_id": drive.id, "application_id": app.id},
                    created_at=completed_time,
                ))
                db.add(models.Notification(
                    user_id=student.user_id,
                    type="ai_result_ready",
                    message=f"Your AI interview for {drive.title} was analyzed",
                    is_read=True,
                    created_at=completed_time,
                ))
                db.add(models.Notification(
                    user_id=company.user_id,
                    type="application_update",
                    message=f"Interview completed by {student.full_name} for {drive.title}",
                    is_read=True,
                    created_at=completed_time,
                ))

                # Scorecard
                scorecard_time = completed_time + timedelta(hours=1)
                scorecard = models.Scorecard(
                    application_id=app.id,
                    resume_match_score=spec["resume_match_score"],
                    assessment_score=spec["assessment_score"],
                    communication_score=spec["communication_score"],
                    technical_interview_score=spec["technical_interview_score"],
                    overall_ai_score=spec["overall_ai_score"],
                    ai_summary=spec["ai_summary"],
                    ai_insights=spec.get("insights", []),
                    generated_at=scorecard_time,
                )
                db.add(scorecard)
                db.flush()

                # Progression logs for Shortlisted / Offered / Hired / Rejected
                if spec["stage"] in [
                    models.ApplicationStage.shortlisted,
                    models.ApplicationStage.offered,
                    models.ApplicationStage.hired,
                ]:
                    shortlist_time = scorecard_time + timedelta(hours=2)
                    db.add(models.ActivityLog(
                        user_id=student.user_id,
                        action=f"Shortlisted for {drive.title} at {company.company_name}",
                        log_metadata={"drive_id": drive.id, "application_id": app.id},
                        created_at=shortlist_time,
                    ))
                    db.add(models.Notification(
                        user_id=student.user_id,
                        type="shortlisted",
                        message=f"You've been shortlisted for {drive.title} at {company.company_name}",
                        is_read=True,
                        created_at=shortlist_time,
                    ))

                if spec["stage"] in [models.ApplicationStage.offered, models.ApplicationStage.hired]:
                    offer_time = scorecard_time + timedelta(days=2)
                    db.add(models.ActivityLog(
                        user_id=student.user_id,
                        action=f"Offer received from {company.company_name} for {drive.title}",
                        log_metadata={"drive_id": drive.id, "application_id": app.id},
                        created_at=offer_time,
                    ))
                    db.add(models.Notification(
                        user_id=student.user_id,
                        type="offer",
                        message=f"Congratulations! You received an offer from {company.company_name}",
                        is_read=True,
                        created_at=offer_time,
                    ))
                    db.add(models.Notification(
                        user_id=company.user_id,
                        type="application_update",
                        message=f"Offer extended to {student.full_name} for {drive.title}",
                        is_read=True,
                        created_at=offer_time,
                    ))

                if spec["stage"] == models.ApplicationStage.hired:
                    hire_time = scorecard_time + timedelta(days=4)
                    db.add(models.ActivityLog(
                        user_id=student.user_id,
                        action=f"Hired by {company.company_name} for {drive.title}",
                        log_metadata={"drive_id": drive.id, "application_id": app.id},
                        created_at=hire_time,
                    ))
                    db.add(models.Notification(
                        user_id=student.user_id,
                        type="application_update",
                        message=f"Congratulations! You have been marked as Hired by {company.company_name} for {drive.title}",
                        is_read=False,
                        created_at=hire_time,
                    ))
                    db.add(models.Notification(
                        user_id=company.user_id,
                        type="application_update",
                        message=f"Candidate {student.full_name} accepted offer and joined {drive.title}",
                        is_read=False,
                        created_at=hire_time,
                    ))

            # Progression log for Rejected stage
            if spec["stage"] == models.ApplicationStage.rejected:
                rejection_time = applied_time + timedelta(days=4)
                db.add(models.ActivityLog(
                    user_id=student.user_id,
                    action=f"Application status updated for {drive.title}",
                    log_metadata={"drive_id": drive.id, "application_id": app.id},
                    created_at=rejection_time,
                ))
                db.add(models.Notification(
                    user_id=student.user_id,
                    type="application_update",
                    message=f"Update on your application for {drive.title} at {company.company_name}",
                    is_read=True,
                    created_at=rejection_time,
                ))

        db.commit()
        print("Database commit successful.")

        # ---------------------------------------------
        # 5. PRINT SUMMARY
        # ---------------------------------------------
        total_companies = len(companies_map)
        total_drives = len(drives_list)
        total_students = len(students_list)
        total_applications = len(created_applications)

        stage_counts = {}
        for app in created_applications:
            stage_name = app.current_stage.value
            stage_counts[stage_name] = stage_counts.get(stage_name, 0) + 1

        print("\n" + "=" * 70)
        print("HIRELYTICS DEMO DATABASE SEEDED SUCCESSFULLY!")
        print("=" * 70)
        print(f"  * Companies created:    {total_companies}")
        print(f"  * Drives created:       {total_drives} (all live, with MCQ assessments)")
        print(f"  * Students created:     {total_students}")
        print(f"  * Applications created: {total_applications}")
        print("\nPipeline Stage Breakdown:")
        for stage, count in stage_counts.items():
            print(f"  - {stage:<16}: {count}")

        print("\n" + "=" * 70)
        print("SPECIAL SHOWCASE STUDENTS (Ready for Live Demo presentation):")
        print("=" * 70)
        print("These 2 students have completed their Online Assessment (scores: 88% & 92%),")
        print("with NO interview or scorecard seeded yet. During your presentation, you can")
        print("schedule their interview live, speak answers into the mic, and let the real")
        print("Gemini & Groq AI models generate transcripts and scorecards live!")
        print()
        print("  1) Candidate: Aarav Sharma")
        print("     Email:    aarav.sharma@demo.hirelytics.in")
        print(f"     Password: {DEMO_PASSWORD}")
        print("     College:  IIT Bombay (CSE, CGPA: 8.95)")
        print("     Drive:    Backend Engineer @ TechNova Solutions")
        print("     Status:   stage = 'assessment' (Ready to schedule AI Interview)")
        print()
        print("  2) Candidate: Priya Patel")
        print("     Email:    priya.patel@demo.hirelytics.in")
        print(f"     Password: {DEMO_PASSWORD}")
        print("     College:  NIT Trichy (IT, CGPA: 8.78)")
        print("     Drive:    Frontend Developer Intern @ TechNova Solutions")
        print("     Status:   stage = 'assessment' (Ready to schedule AI Interview)")

        print("\n" + "=" * 70)
        print("SEEDED COMPANY ACCOUNTS (Password: Demo1234!):")
        print("=" * 70)
        for c in DEMO_COMPANIES_DATA:
            print(f"  * {c['company_name']:<24}: {c['email']}")
        print("=" * 70 + "\n")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hirelytics Demo Database Seeder")
    parser.add_argument(
        "--reset",
        "--force",
        dest="reset",
        action="store_true",
        help="Clear previous demo seed data and re-seed fresh",
    )
    args = parser.parse_args()
    seed_data(reset=args.reset)
