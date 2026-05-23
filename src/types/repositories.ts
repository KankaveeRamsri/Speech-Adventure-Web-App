/**
 * Repository interface barrel for Speech Adventure.
 *
 * Import repository interfaces from here rather than from individual
 * interface files. This keeps dependency paths short and makes it
 * easy to add new repositories without updating consumer imports.
 */

export type { IProgressRepository, StartSessionInput } from "@/lib/repositories/IProgressRepository";
export type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
export type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
export type { IInvitationRepository } from "@/lib/repositories/IInvitationRepository";
