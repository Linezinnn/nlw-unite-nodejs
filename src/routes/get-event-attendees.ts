import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { prisma } from "../lib/prisma";

export async function getEventAttendees(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/events/:eventId/attendees', {
      schema: {
        summary: 'Get events attendees',
        tags: ['events'],
        params: z.object({
          eventId: z.string().uuid(),
        }),
        querystring: z.object({
          query: z.string().nullish(),
          pageIndex: z.string().nullish().default('0').transform(Number),
        }),
        response: {
          200: z.object({
            attendees: z.array(
              z.object({
                name: z.string(),
                email: z.string().email(),
                id: z.number().int().positive(),
                createdAt: z.date(),
                checkedInAt: z.date().nullable(),
              })
            ),
            total: z.number().int().positive(),
          }),
        },
      }
    }, async (request, reply) => {
      const { eventId } = request.params
      const { pageIndex, query } = request.query

      const attendees = await prisma.attendee.findMany({
        select: {
          name: true,
          email: true,
          id: true,
          createdAt: true,
          checkIn: {
            select: {
              createdAt: true,
            }
          },
        },
        where: query ? {
          eventId,
          name: {
            contains: query,
          }
        } : {
          eventId,
        },
        take: 10,
        skip: pageIndex * 10,
        orderBy: {
          createdAt: 'desc'
        }
      })

      const countOfAttendees = await prisma.event.findUnique({
        select: {
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

      return reply.status(200).send({ 
        attendees: attendees.map(attendee => {
          return {
            id: attendee.id,
            name: attendee.name,
            email: attendee.email,
            createdAt: attendee.createdAt,
            checkedInAt: attendee.checkIn?.createdAt ?? null,
          }
        }),
        total: countOfAttendees?._count.attendees || 0,
      })
    })
}