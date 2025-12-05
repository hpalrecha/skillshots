
import { PrismaClient, UserRole, ContentType, TopicStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Fix for `process.exit` typing issue.
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data
  await prisma.userGroup.deleteMany();
  await prisma.topicPermission.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  // Create Groups
  const productTeam = await prisma.group.create({
    data: { id: 'group-1', name: 'Product Team' },
  });
  const salesTeam = await prisma.group.create({
    data: { id: 'group-2', name: 'Sales Team' },
  });
  const allEmployees = await prisma.group.create({
    data: { id: 'group-3', name: 'All Employees' },
  });
  console.log('Created groups');

  // Create Users
  const hashedPasswordAlex = await bcrypt.hash('password123', 10);
  const userAlex = await prisma.user.create({
    data: {
      id: 'user-1',
      name: 'Alex Ray',
      email: 'alex@example.com',
      password: hashedPasswordAlex,
      role: UserRole.Creator,
    },
  });

  const hashedPasswordSam = await bcrypt.hash('password123', 10);
  const userSam = await prisma.user.create({
    data: {
      id: 'user-2',
      name: 'Sam Doe',
      email: 'sam@example.com',
      password: hashedPasswordSam,
      role: UserRole.Learner,
    },
  });
  console.log('Created users');
  
  // Assign Users to Groups
  await prisma.userGroup.createMany({
    data: [
        { userId: userAlex.id, groupId: productTeam.id },
        { userId: userAlex.id, groupId: allEmployees.id },
        { userId: userSam.id, groupId: salesTeam.id },
        { userId: userSam.id, groupId: allEmployees.id },
    ]
  });
  console.log('Assigned users to groups');


  // Create Topics and Content
  const topic1 = await prisma.topic.create({
    data: {
      id: '1',
      title: 'Workplace Safety Standards 2024',
      category: 'Health & Safety',
      authorId: userAlex.id,
      readTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1598528994503-68d1976a266e?q=80&w=1200',
      content: {
        create: [
          { type: ContentType.Paragraph, content: 'Safety is our number one priority. This module outlines the updated protocols for 2024, focusing on emergency exits, fire hazards, and proper ergonomic setups.', order: 1 },
          { type: ContentType.Image as any, content: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=800', title: 'Emergency Exits', order: 2 },
          { type: ContentType.Paragraph, content: 'Please review the diagram above. Obstructing these paths is a severe violation of safety code. Additionally, all employees must participate in the bi-annual fire drill.', order: 3 },
          { type: ContentType.Video, content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Fire Safety Demonstration', order: 4 },
        ],
      },
      sharedWith: {
        create: [{ groupId: allEmployees.id }]
      }
    },
  });
  
  const topic2 = await prisma.topic.create({
    data: {
        id: '2',
        title: 'CRM Software: Advanced Features',
        category: 'Software Training',
        authorId: userSam.id,
        readTime: 12,
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200',
        content: {
            create: [
                { type: ContentType.Paragraph, content: 'This session dives into the advanced analytics features of "ConnectSphere". We will cover custom report generation and automated lead scoring.', order: 1 },
                { type: ContentType.Image as any, content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800', title: 'Analytics Dashboard', order: 2 },
                { type: ContentType.Paragraph, content: 'As seen in the image, the dashboard now aggregates data in real-time. This allows for faster decision-making during sales calls.', order: 3 },
                { type: ContentType.Document, content: '/docs/advanced-crm-guide.pdf', title: 'Advanced CRM Guide.pdf', order: 4 }
            ]
        },
        sharedWith: {
            create: [{ groupId: salesTeam.id }]
        }
    }
  });

  const topic3 = await prisma.topic.create({
    data: {
        id: '3',
        title: 'Fusion X Product Launch Details',
        category: 'Product Training',
        authorId: userAlex.id,
        readTime: 8,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
        content: {
            create: [
                { type: ContentType.Paragraph, content: 'The Fusion X is not just a product; it is a lifestyle revolution. Key selling points include its 48-hour battery life and AI-integrated personal assistant.', order: 1 },
                { type: ContentType.Image as any, content: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800', title: 'Fusion X Design', order: 2 },
                { type: ContentType.Document, content: '/docs/fusion-x-spec-sheet.pdf', title: 'Fusion X Spec Sheet.pdf', order: 3 }
            ]
        },
        sharedWith: {
            create: [
                { groupId: productTeam.id },
                { groupId: salesTeam.id }
            ]
        },
        progress: {
          create: [{ userId: userAlex.id, status: TopicStatus.Completed }]
        }
    }
  });

  const topic4 = await prisma.topic.create({
    data: {
        id: '4',
        title: 'Effective Remote Communication',
        category: 'Soft Skills',
        authorId: userAlex.id,
        readTime: 6,
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200',
        content: {
            create: [
                { type: ContentType.Paragraph, content: 'Remote work requires a different set of communication skills. Over-communication is better than under-communication when you are not physically present.', order: 1},
                { type: ContentType.Paragraph, content: 'Use the right tool for the job: Chat for quick questions, Video for discussions, and Email for formal records.', order: 2},
                { type: ContentType.Video, content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Remote Work Etiquette', order: 3}
            ]
        },
        sharedWith: {
            create: [{ groupId: productTeam.id }]
        }
    }
  });
  console.log('Created topics with content and permissions');


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
