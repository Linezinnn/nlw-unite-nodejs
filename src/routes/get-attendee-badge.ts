import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { prisma } from "../lib/prisma";
import { NotFound } from "./errors/not-found";

export async function getAttendeeBadge(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/attendees/:attendeeId/badge', {
      schema: {
        summary: 'Get an attendee badge',
        tags: ['attendees'],
        params: z.object({
          attendeeId: z.coerce.number().int().positive(),
        }),
        response: {
          200: z.object({
            badge: z.object({
              name: z.string(),
              email: z.string().email(),
              event: z.object({
                title: z.string(),
              }),
              checkInURL: z.string().url(),
            })
          })
        }
      },
    }, async (request, reply) => {
      const { attendeeId } = request.params

      const attendee = await prisma.attendee.findUnique({
        select: {
          name: true,
          email: true,
          event: {
            select: {
              title: true,
            }
          }
        },
        where: {
          id: attendeeId,
        }
      })

      if(attendee === null) {
        throw new NotFound('Attendee not found')
      }

      const baseURL = `${request.protocol}://${request.hostname}`

      const checkInURL = new URL(`/attendees/${attendeeId}/check-in`, baseURL)

      return reply.status(200).send({ 
        badge: {
          name: attendee.name,
          email: attendee.email,
          event: attendee.event,
          checkInURL: checkInURL.toString()
        }
      })
    })
}