#!/usr/bin/env node
/**
 * Upload Pumasi seed metadata to IPFS
 * Uses Pinata API via localhost:3008
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const IPFS_API_BASE = "http://localhost:3008/api/ipfs";

// Real image URLs from Unsplash (free to use)
const IMAGES = {
  // Profile avatars
  alice: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  bob: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  carol: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  dave: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  eve: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  // Job category images
  webdev: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
  smartcontract: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
  uidesign: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
  logo: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop",
};

// Store uploaded IPFS hashes
const ipfsHashes = { images: {}, profiles: {}, jobs: {}, proposals: {}, deliverables: {}, reviews: {} };

async function downloadImage(url, name) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, name).then(resolve).catch(reject);
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ buffer: Buffer.concat(chunks), name }));
      response.on("error", reject);
    }).on("error", reject);
  });
}

async function uploadImageToIPFS(buffer, name) {
  return new Promise((resolve, reject) => {
    const boundary = "----FormBoundary" + Math.random().toString(36).substr(2);
    const filename = `${name}.jpg`;

    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\n${name}\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

    const options = {
      hostname: "localhost",
      port: 3008,
      path: "/api/ipfs/file",
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function uploadJSONToIPFS(content, name) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ content, name });
    const options = {
      hostname: "localhost",
      port: 3008,
      path: "/api/ipfs/json",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function uploadImages() {
  console.log("\n📸 Uploading images to IPFS...\n");

  for (const [name, url] of Object.entries(IMAGES)) {
    try {
      console.log(`  Downloading ${name}...`);
      const { buffer } = await downloadImage(url, name);
      console.log(`  Uploading ${name} to IPFS...`);
      const result = await uploadImageToIPFS(buffer, name);
      if (result.success) {
        ipfsHashes.images[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}\n`);
      } else {
        console.error(`  ✗ Failed: ${name}`, result);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

async function uploadProfiles() {
  console.log("\n👤 Uploading profile metadata to IPFS...\n");

  const profiles = {
    alice: {
      name: "Alice Kim",
      bio: "Platform administrator and community manager for Pumasi. Passionate about building trust in the gig economy.",
      skills: ["Community Management", "Korean-English Translation", "Customer Support"],
      location: "Seoul, South Korea",
      languages: ["Korean", "English"],
      avatar: ipfsHashes.images.alice,
      role: "admin",
    },
    bob: {
      name: "Bob Park",
      bio: "Tech startup founder looking for talented developers. Building the future of decentralized work.",
      skills: ["Project Management", "Product Strategy", "Blockchain"],
      location: "Busan, South Korea",
      languages: ["Korean", "English", "Japanese"],
      avatar: ipfsHashes.images.bob,
      role: "client",
    },
    carol: {
      name: "Carol Lee",
      bio: "Full-stack developer with 5 years experience. Specialized in React, Node.js, and smart contracts.",
      skills: ["React", "Node.js", "Solidity", "TypeScript", "GraphQL"],
      location: "Incheon, South Korea",
      languages: ["Korean", "English"],
      avatar: ipfsHashes.images.carol,
      role: "freelancer",
      portfolio: "https://carollee.dev",
      hourlyRate: "50 VERY",
    },
    dave: {
      name: "Dave Choi",
      bio: "UI/UX designer and brand specialist. Creating beautiful, user-centered digital experiences.",
      skills: ["UI Design", "UX Research", "Figma", "Brand Identity", "Prototyping"],
      location: "Daegu, South Korea",
      languages: ["Korean"],
      avatar: ipfsHashes.images.dave,
      role: "freelancer",
      portfolio: "https://davechoi.design",
      hourlyRate: "45 VERY",
    },
    eve: {
      name: "Eve Jung",
      bio: "Marketing agency owner. Always seeking creative talent for client projects.",
      skills: ["Marketing Strategy", "Brand Development", "Content Strategy"],
      location: "Seoul, South Korea",
      languages: ["Korean", "English", "Chinese"],
      avatar: ipfsHashes.images.eve,
      role: "client",
    },
  };

  for (const [name, profile] of Object.entries(profiles)) {
    try {
      const result = await uploadJSONToIPFS(profile, `profile-${name}`);
      if (result.success) {
        ipfsHashes.profiles[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

async function uploadJobs() {
  console.log("\n💼 Uploading job metadata to IPFS...\n");

  const jobs = {
    job0: {
      title: "React Developer for DeFi Dashboard",
      description:
        "Looking for an experienced React developer to build a DeFi dashboard. Must have experience with Web3 integration, wallet connections, and real-time data visualization.",
      category: "Web Development",
      skills: ["React", "TypeScript", "Web3.js", "TailwindCSS"],
      experienceLevel: "Intermediate",
      estimatedDuration: "2-4 weeks",
      image: ipfsHashes.images.webdev,
    },
    job1: {
      title: "Smart Contract Audit & Development",
      description:
        "Need a Solidity expert to audit existing contracts and develop new features for our NFT marketplace. Security-first approach required.",
      category: "Blockchain Development",
      skills: ["Solidity", "Foundry", "Security Auditing", "ERC-721"],
      experienceLevel: "Expert",
      estimatedDuration: "4-6 weeks",
      image: ipfsHashes.images.smartcontract,
    },
    job2: {
      title: "Mobile App UI/UX Design",
      description:
        "Seeking a talented designer for a crypto wallet mobile app. Need complete UI kit, wireframes, and interactive prototypes.",
      category: "Design",
      skills: ["Figma", "Mobile Design", "Prototyping", "Design Systems"],
      experienceLevel: "Intermediate",
      estimatedDuration: "2-3 weeks",
      image: ipfsHashes.images.uidesign,
    },
    job3: {
      title: "Logo & Brand Identity Design",
      description:
        "Looking for a creative designer to create a modern logo and brand identity for our Web3 startup. Deliverables include logo, color palette, and brand guidelines.",
      category: "Design",
      skills: ["Logo Design", "Brand Identity", "Illustrator", "Typography"],
      experienceLevel: "Entry",
      estimatedDuration: "1-2 weeks",
      image: ipfsHashes.images.logo,
    },
  };

  for (const [name, job] of Object.entries(jobs)) {
    try {
      const result = await uploadJSONToIPFS(job, name);
      if (result.success) {
        ipfsHashes.jobs[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

async function uploadProposals() {
  console.log("\n📝 Uploading proposal metadata to IPFS...\n");

  const proposals = {
    carolProp0: {
      coverLetter:
        "Hi! I'm excited to apply for this React developer position. With 5 years of experience in frontend development and 2 years specifically in Web3, I'm confident I can deliver a high-quality DeFi dashboard. I've previously built similar dashboards for DEX platforms.",
      timeline: "I can complete this project in 3 weeks with the following milestones:\n- Week 1: Setup, wallet integration, basic layout\n- Week 2: Charts, data fetching, real-time updates\n- Week 3: Polish, testing, documentation",
      proposedRate: "0.5 VERY",
      portfolio: ["https://github.com/carollee", "https://defi-dashboard-demo.vercel.app"],
    },
    daveProp0: {
      coverLetter:
        "I noticed you need a React developer for a DeFi dashboard. While my primary focus is UI/UX design, I also have frontend development experience and could bring a design-focused approach to your dashboard.",
      timeline: "4 weeks estimated, focusing on pixel-perfect implementation.",
      proposedRate: "0.45 VERY",
      portfolio: ["https://davechoi.design/web-projects"],
    },
    carolProp1: {
      coverLetter:
        "I'm very interested in your smart contract project. I have extensive experience with Solidity and have completed security audits for multiple DeFi protocols. I use Foundry for all my development and testing.",
      timeline: "5 weeks: 2 weeks audit, 3 weeks development with comprehensive testing",
      proposedRate: "1 VERY",
      portfolio: ["https://github.com/carollee/audits", "https://code4rena.com/@carollee"],
    },
    daveProp2: {
      coverLetter:
        "This mobile UI/UX project is perfect for my skillset! I specialize in crypto wallet and fintech app design. I'll deliver a complete design system that's both beautiful and highly usable.",
      timeline: "2.5 weeks: 1 week research & wireframes, 1.5 weeks high-fidelity designs",
      proposedRate: "0.25 VERY",
      portfolio: ["https://dribbble.com/davechoi", "https://davechoi.design/crypto-apps"],
    },
    carolProp3: {
      coverLetter:
        "I'd love to help with your brand identity project! While I'm primarily a developer, I have a strong eye for design and have created logos for several side projects. I can deliver a modern, professional brand identity.",
      timeline: "1.5 weeks: concept exploration, refinement, and final deliverables",
      proposedRate: "0.5 VERY",
      portfolio: ["https://carollee.dev/design-work"],
    },
  };

  for (const [name, proposal] of Object.entries(proposals)) {
    try {
      const result = await uploadJSONToIPFS(proposal, name);
      if (result.success) {
        ipfsHashes.proposals[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

async function uploadDeliverables() {
  console.log("\n📦 Uploading deliverable metadata to IPFS...\n");

  const deliverables = {
    deliverable3: {
      title: "Brand Identity Package - Final Delivery",
      description: "Complete brand identity package including logo, color palette, typography, and usage guidelines.",
      files: [
        { name: "logo-primary.svg", type: "vector", size: "24KB" },
        { name: "logo-variations.pdf", type: "document", size: "1.2MB" },
        { name: "brand-guidelines.pdf", type: "document", size: "3.5MB" },
        { name: "color-palette.json", type: "data", size: "2KB" },
      ],
      notes: "All files are included in the attached package. The brand guidelines document covers usage rules, minimum sizes, and color specifications.",
      submittedAt: new Date().toISOString(),
    },
  };

  for (const [name, deliverable] of Object.entries(deliverables)) {
    try {
      const result = await uploadJSONToIPFS(deliverable, name);
      if (result.success) {
        ipfsHashes.deliverables[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

async function uploadReviews() {
  console.log("\n⭐ Uploading review metadata to IPFS...\n");

  const reviews = {
    reviewEveCarol: {
      comment:
        "Carol did an excellent job on the brand identity project! She was communicative throughout the process, delivered on time, and the final product exceeded my expectations. The logo is modern and versatile, and the brand guidelines are comprehensive. Highly recommended!",
      rating: 5,
      aspects: { communication: 5, quality: 5, timeliness: 5, professionalism: 5 },
    },
    reviewCarolEve: {
      comment:
        "Eve was a great client to work with. She provided clear requirements upfront and gave constructive feedback throughout the project. Payment was prompt after approval. Would definitely work with her again!",
      rating: 4,
      aspects: { communication: 5, clarity: 4, responsiveness: 4, fairness: 5 },
    },
  };

  for (const [name, review] of Object.entries(reviews)) {
    try {
      const result = await uploadJSONToIPFS(review, name);
      if (result.success) {
        ipfsHashes.reviews[name] = result.url;
        console.log(`  ✓ ${name}: ${result.ipfsHash}`);
      }
    } catch (error) {
      console.error(`  ✗ Error with ${name}:`, error.message);
    }
  }
}

function generateSolidityConstants() {
  console.log("\n📋 Generated Solidity Constants:\n");
  console.log("// ============ IPFS URIs (Generated) ============");
  console.log("// Profile metadata URIs");
  console.log(`string constant ALICE_PROFILE = "${ipfsHashes.profiles.alice || ""}";`);
  console.log(`string constant BOB_PROFILE = "${ipfsHashes.profiles.bob || ""}";`);
  console.log(`string constant CAROL_PROFILE = "${ipfsHashes.profiles.carol || ""}";`);
  console.log(`string constant DAVE_PROFILE = "${ipfsHashes.profiles.dave || ""}";`);
  console.log(`string constant EVE_PROFILE = "${ipfsHashes.profiles.eve || ""}";`);
  console.log("\n// Job metadata URIs");
  console.log(`string constant JOB0_META = "${ipfsHashes.jobs.job0 || ""}";`);
  console.log(`string constant JOB1_META = "${ipfsHashes.jobs.job1 || ""}";`);
  console.log(`string constant JOB2_META = "${ipfsHashes.jobs.job2 || ""}";`);
  console.log(`string constant JOB3_META = "${ipfsHashes.jobs.job3 || ""}";`);
  console.log("\n// Proposal metadata URIs");
  console.log(`string constant CAROL_PROP0 = "${ipfsHashes.proposals.carolProp0 || ""}";`);
  console.log(`string constant DAVE_PROP0 = "${ipfsHashes.proposals.daveProp0 || ""}";`);
  console.log(`string constant CAROL_PROP1 = "${ipfsHashes.proposals.carolProp1 || ""}";`);
  console.log(`string constant DAVE_PROP2 = "${ipfsHashes.proposals.daveProp2 || ""}";`);
  console.log(`string constant CAROL_PROP3 = "${ipfsHashes.proposals.carolProp3 || ""}";`);
  console.log("\n// Deliverable metadata URI");
  console.log(`string constant DELIVERABLE3 = "${ipfsHashes.deliverables.deliverable3 || ""}";`);
  console.log("\n// Review comment URIs");
  console.log(`string constant REVIEW_EVE_CAROL = "${ipfsHashes.reviews.reviewEveCarol || ""}";`);
  console.log(`string constant REVIEW_CAROL_EVE = "${ipfsHashes.reviews.reviewCarolEve || ""}";`);
}

async function main() {
  console.log("🚀 Pumasi IPFS Metadata Upload Script");
  console.log("=====================================\n");

  try {
    await uploadImages();
    await uploadProfiles();
    await uploadJobs();
    await uploadProposals();
    await uploadDeliverables();
    await uploadReviews();

    // Save all hashes to file
    const outputPath = path.join(__dirname, "..", "ipfs-hashes.json");
    fs.writeFileSync(outputPath, JSON.stringify(ipfsHashes, null, 2));
    console.log(`\n💾 Saved all hashes to: ${outputPath}`);

    generateSolidityConstants();

    console.log("\n✅ Upload complete!");
  } catch (error) {
    console.error("\n❌ Upload failed:", error);
    process.exit(1);
  }
}

main();
