import type { components } from '@/shared/api/schema/plant-care'

type Schemas = components['schemas']

export type Journal = Schemas['JournalResponse']
export type Checkpoint = Schemas['CheckpointResponse']
export type PlantUpdate = Schemas['UpdateResponse']
export type UpdateFeed = Schemas['FeedResponse']
export type SubmitUpdateRequest = Schemas['SubmitUpdateRequest']
export type PhotoKind = Schemas['PhotoKind']
export type UploadTicket = Schemas['UploadResponse']
export type UpdatePhotos = Schemas['PhotosResponse']
export type PhotoResponse = Schemas['PhotoResponse']
export type Drainage = Schemas['Drainage']
export type Lighting = Schemas['Lighting']
export type FingerTest = Schemas['FingerTest']
export type PotWeight = Schemas['PotWeight']
