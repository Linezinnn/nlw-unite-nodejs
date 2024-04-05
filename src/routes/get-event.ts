import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { prisma } from "../lib/prisma";
import { NotFound } from "./errors/not-found";

export async function getEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/events/:eventId', {
      schema: {
        summary: 'Get an event',
        tags: ['events'],
        params: z.object({
          eventId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string().uuid(),
              title: z.string(),
              slug: z.string(),
              details: z.string().nullable(),
              maximumAttendees: z.number().int().positive().nullable(),
              attendeesAmount: z.number().int().positive(),
            })
          })
        },
      }
    }, async (request, reply) => {
      const { eventId } = request.params

      const event = await prisma.event.findUnique({
        select: {
          id: true,
          title: true,
          slug: true,
          maximumAttendees: true,
          details: true,
          _count: {
            select: {
              attendees: true,
            }
          }
        },
        where: {
          id: eventId,
        }
      })

      if(event === null) {
        throw new NotFound('Event not found')
      }

      return reply.status(200).send({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          maximumAttendees: event.maximumAttendees,
          details: event.details,
          attendeesAmount: event._count.attendees,
        }
      })
    })
}