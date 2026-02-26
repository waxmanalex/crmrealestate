import { PrismaClient, Role, LeadSource, ClientStatus, PropertyStatus, Currency, DealStage, TaskPriority, TaskStatus, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@recrm.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@recrm.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'sarah@recrm.com' },
    update: {},
    create: {
      name: 'Sarah Cohen',
      email: 'sarah@recrm.com',
      passwordHash: agentPassword,
      role: Role.AGENT,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'david@recrm.com' },
    update: {},
    create: {
      name: 'David Levi',
      email: 'david@recrm.com',
      passwordHash: agentPassword,
      role: Role.AGENT,
    },
  });

  console.log('Users created:', { admin: admin.email, agent1: agent1.email, agent2: agent2.email });

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        fullName: 'Moshe Katz',
        phone: '+972-52-1234567',
        email: 'moshe@example.com',
        leadSource: LeadSource.INSTAGRAM,
        status: ClientStatus.ACTIVE,
        assignedTo: agent1.id,
        tags: ['VIP', 'Buyer'],
        notes: 'Looking for 3-room apartment in Tel Aviv',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'Rachel Shapiro',
        phone: '+972-54-9876543',
        email: 'rachel@example.com',
        leadSource: LeadSource.REFERRAL,
        status: ClientStatus.NEW,
        assignedTo: agent2.id,
        tags: ['Investor'],
        notes: 'Interested in multiple properties',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'Yosef Ben-David',
        phone: '+972-50-5554433',
        leadSource: LeadSource.PORTAL,
        status: ClientStatus.ACTIVE,
        assignedTo: agent1.id,
        tags: ['Seller'],
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'Miriam Goldstein',
        phone: '+972-53-7778899',
        email: 'miriam@example.com',
        leadSource: LeadSource.FACEBOOK,
        status: ClientStatus.CONVERTED,
        assignedTo: admin.id,
        tags: ['Buyer', 'Renter'],
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'Avraham Peretz',
        phone: '+972-58-1112233',
        leadSource: LeadSource.OTHER,
        status: ClientStatus.NOT_INTERESTED,
        assignedTo: agent2.id,
      },
    }),
  ]);

  console.log('Clients created:', clients.length);

  // Create properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: '3BR Apartment in Tel Aviv',
        address: 'Dizengoff St 45, Tel Aviv',
        price: 3500000,
        currency: Currency.ILS,
        description: 'Beautiful apartment in the heart of Tel Aviv, fully renovated',
        status: PropertyStatus.ACTIVE,
        rooms: 3,
        sizeSqm: 85,
        floor: 4,
        ownerClientId: clients[2].id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Penthouse in Herzliya',
        address: 'Sokolov St 12, Herzliya Pituach',
        price: 8500000,
        currency: Currency.ILS,
        description: 'Luxurious penthouse with sea view, 4 bedrooms, private pool',
        status: PropertyStatus.ACTIVE,
        rooms: 4,
        sizeSqm: 200,
        floor: 15,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Studio Apartment Ramat Gan',
        address: 'Begin Rd 102, Ramat Gan',
        price: 1800000,
        currency: Currency.ILS,
        description: 'Cozy studio near Diamond Exchange',
        status: PropertyStatus.UNDER_OFFER,
        rooms: 1,
        sizeSqm: 35,
        floor: 2,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Office Space in Jerusalem',
        address: 'Jaffa Rd 200, Jerusalem',
        price: 450000,
        currency: Currency.USD,
        description: 'Modern office space in the center of Jerusalem',
        status: PropertyStatus.ACTIVE,
        sizeSqm: 120,
        floor: 3,
      },
    }),
    prisma.property.create({
      data: {
        title: '5BR Villa in Caesarea',
        address: 'HaNamal St 7, Caesarea',
        price: 15000000,
        currency: Currency.ILS,
        description: 'Stunning villa with private garden and pool',
        status: PropertyStatus.SOLD,
        rooms: 5,
        sizeSqm: 350,
        floor: 1,
      },
    }),
  ]);

  console.log('Properties created:', properties.length);

  // Create deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        clientId: clients[0].id,
        propertyId: properties[0].id,
        stage: DealStage.VIEWING,
        value: 3500000,
        probability: 60,
        assignedTo: agent1.id,
        nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: clients[1].id,
        propertyId: properties[1].id,
        stage: DealStage.NEGOTIATION,
        value: 8200000,
        probability: 40,
        assignedTo: agent2.id,
        nextActionAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: clients[3].id,
        propertyId: properties[4].id,
        stage: DealStage.CLOSED,
        value: 15000000,
        probability: 100,
        assignedTo: admin.id,
      },
    }),
    prisma.deal.create({
      data: {
        clientId: clients[2].id,
        stage: DealStage.NEW_LEAD,
        assignedTo: agent1.id,
        nextActionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: clients[4].id,
        propertyId: properties[2].id,
        stage: DealStage.CONTRACT,
        value: 1800000,
        probability: 85,
        assignedTo: agent2.id,
      },
    }),
  ]);

  console.log('Deals created:', deals.length);

  // Create tasks
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Call Moshe about property viewing',
        description: 'Schedule property viewing for next week',
        dueAt: tomorrow,
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        assignedTo: agent1.id,
        relatedClientId: clients[0].id,
        relatedDealId: deals[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Send contract to Rachel',
        dueAt: yesterday,
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        assignedTo: agent2.id,
        relatedClientId: clients[1].id,
        relatedDealId: deals[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Update property photos',
        description: 'Upload new photos for Tel Aviv apartment',
        dueAt: nextWeek,
        priority: TaskPriority.LOW,
        status: TaskStatus.IN_PROGRESS,
        assignedTo: agent1.id,
        relatedPropertyId: properties[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Follow up with Avraham',
        dueAt: yesterday,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assignedTo: agent2.id,
        relatedClientId: clients[4].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Prepare Q1 Report',
        dueAt: nextWeek,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assignedTo: admin.id,
      },
    }),
  ]);

  console.log('Tasks created');

  // Create activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: ActivityType.DEAL_CREATED,
        content: 'Deal created for Moshe Katz',
        userId: agent1.id,
        clientId: clients[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.STAGE_CHANGE,
        content: 'Deal moved to VIEWING stage',
        userId: agent1.id,
        clientId: clients[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        content: 'Client is very interested, prefers morning showings',
        userId: agent1.id,
        clientId: clients[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.CALL,
        content: 'Called client, discussed budget and requirements',
        userId: agent2.id,
        clientId: clients[1].id,
        dealId: deals[1].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.MEETING,
        content: 'Property viewing completed, client is interested',
        userId: agent2.id,
        clientId: clients[1].id,
        dealId: deals[1].id,
      },
    }),
  ]);

  console.log('Activities created');
  console.log('\n✅ Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@recrm.com / admin123');
  console.log('  Agent: sarah@recrm.com / agent123');
  console.log('  Agent: david@recrm.com / agent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
