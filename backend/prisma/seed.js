import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default categories
  const workCategory = await prisma.category.upsert({
    where: { name: 'Work' },
    update: {},
    create: {
      name: 'Work',
      color: '#EF4444', // Red
    },
  });

  const personalCategory = await prisma.category.upsert({
    where: { name: 'Personal' },
    update: {},
    create: {
      name: 'Personal',
      color: '#10B981', // Green
    },
  });

  const shoppingCategory = await prisma.category.upsert({
    where: { name: 'Shopping' },
    update: {},
    create: {
      name: 'Shopping',
      color: '#F59E0B', // Yellow
    },
  });

  const healthCategory = await prisma.category.upsert({
    where: { name: 'Health' },
    update: {},
    create: {
      name: 'Health',
      color: '#8B5CF6', // Purple
    },
  });

  console.log('✅ Categories created');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('✅ Demo user created');

  // Create sample tasks
  const sampleTasks = [
    {
      title: 'Complete project proposal',
      description: 'Finish the Q4 project proposal for the client meeting',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      categoryId: workCategory.id,
      userId: demoUser.id,
    },
    {
      title: 'Buy groceries',
      description: 'Milk, bread, eggs, fruits, and vegetables',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      categoryId: shoppingCategory.id,
      userId: demoUser.id,
    },
    {
      title: 'Schedule dentist appointment',
      description: 'Regular checkup and cleaning',
      priority: 'LOW',
      categoryId: healthCategory.id,
      userId: demoUser.id,
    },
    {
      title: 'Plan weekend trip',
      description: 'Research destinations and book accommodation',
      priority: 'LOW',
      categoryId: personalCategory.id,
      userId: demoUser.id,
    },
    {
      title: 'Review team performance',
      description: 'Complete quarterly performance reviews for team members',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      categoryId: workCategory.id,
      userId: demoUser.id,
    },
    {
      title: 'Exercise routine',
      description: 'Go for a 30-minute jog in the park',
      priority: 'MEDIUM',
      completed: true,
      categoryId: healthCategory.id,
      userId: demoUser.id,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.create({
      data: task,
    });
  }

  console.log('✅ Sample tasks created');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });