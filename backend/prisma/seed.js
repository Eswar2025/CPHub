const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const students = [
  {
    name: "Petr",
    rollNumber: "CPHUB-DEMO-001",
    branch: "CSE",
    year: 4,
    section: "A",
    handles: {
      codeforces: "Petr",
      leetcode: "petr",
      codechef: "petr",
    },
  },
  {
    name: "Tourist",
    rollNumber: "CPHUB-DEMO-002",
    branch: "CSE",
    year: 4,
    section: "A",
    handles: {
      codeforces: "tourist",
      leetcode: "tourist",
      codechef: "tourist",
    },
  },
  {
    name: "Jiangly",
    rollNumber: "CPHUB-DEMO-003",
    branch: "CSE",
    year: 4,
    section: "A",
    handles: {
      codeforces: "jiangly",
      leetcode: "jiangly",
      codechef: "jiangly",
    },
  },
];

async function main() {
  for (const demoStudent of students) {
    const student = await prisma.student.upsert({
      where: { rollNumber: demoStudent.rollNumber },
      update: {
        name: demoStudent.name,
        branch: demoStudent.branch,
        year: demoStudent.year,
        section: demoStudent.section,
      },
      create: {
        name: demoStudent.name,
        rollNumber: demoStudent.rollNumber,
        branch: demoStudent.branch,
        year: demoStudent.year,
        section: demoStudent.section,
      },
    });

    for (const [platform, handle] of Object.entries(demoStudent.handles)) {
      await prisma.platformHandle.upsert({
        where: {
          studentId_platform: {
            studentId: student.id,
            platform,
          },
        },
        update: {
          handle,
          enabled: platform === "codeforces",
        },
        create: {
          studentId: student.id,
          platform,
          handle,
          enabled: platform === "codeforces",
        },
      });
    }
  }

  console.log("Seeded CP Hub v2 demo students.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
