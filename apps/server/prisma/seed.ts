import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password', 12);

  // Test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: UserRole.USER
    }
  });

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      bio: 'System Administrator'
    }
  });

  // Create sites for users if they don't exist
  try {
    const existingTestSite = await prisma.site.findFirst({
      where: { userId: testUser.id }
    });

    if (!existingTestSite) {
      const testSite = await prisma.site.create({
        data: {
          name: 'Test Blog',
          description: 'Test kullanıcısının blog sitesi',
          userId: testUser.id,
          domain: 'test.blog.com'
        }
      });
      console.log('✅ Test site created:', testSite.name, '- API Key:', testSite.apiKey);
    }

    const existingAdminSite = await prisma.site.findFirst({
      where: { userId: adminUser.id }
    });

    if (!existingAdminSite) {
      const adminSite = await prisma.site.create({
        data: {
          name: 'LAP CMS Admin Panel',
          description: 'Ana yönetim paneli sitesi',
          userId: adminUser.id,
          domain: 'admin.lapcms.com'
        }
      });
      console.log('✅ Admin site created:', adminSite.name, '- API Key:', adminSite.apiKey);
    }
  } catch (error) {
    console.log('⚠️ Sites may already exist or there was an error creating them');
  }
  
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
