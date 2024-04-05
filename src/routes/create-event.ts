import { FastifyInstance } from "fastify"
import z from "zod"
import { ZodTypeProvider } from "fastify-type-provider-zod"

import { prisma } from "../lib/prisma"
import { GenerateSlug } from "../utils/generate-slug"
import { BadRequest } from "./errors/bad-request"

export async function CreateEvent(app: FastifyInstance) {
  app
  .withTypeProvider<ZodTypeProvider>()
  .post('/events', {
    schema: {
      summary: 'Create an event',
      tags: ['events'],
      body: z.object({
        title: z.string().min(4),
        details: z.string().nullable(),
        maximumAttendees: z.number().int().positive().nullable(),
      }),
      response: {
        201: z.object({
          eventId: z.string().uuid(),
        })
      }
    }
  }, async (request, reply) => {
    const { title, details, maximumAttendees } = request.body

    const slug = GenerateSlug(title)

    const eventWithSameAlreadyExists = await prisma.event.findUnique({
      where: {
        slug,
      }
    })

    if(eventWithSameAlreadyExists !== null) {
      throw new BadRequest('Another event have the same slug')
    }

    const event = await prisma.event.create({
      data: {
        title,
        details,
        maximumAttendees,
        slug,
      }
    })

    return reply.status(201).send({ eventId: event.id })
  })
}