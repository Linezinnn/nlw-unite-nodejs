import { prisma } from "../src/lib/prisma"

async function seed() {
  await prisma.event.create({
    data: {
      id: 'b45032ed-2a3c-4c0d-9215-dece1acec822',
      title: 'Unite Summit',
      slug: 'unite-summit',
      details: 'Um evento para quem ama programar',
      maximumAttendees: 120,
    }
  })
}

seed().then(() => {
  console.log('Database seeded!')
  prisma.$disconnect()
})