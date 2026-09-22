# MAGGA

Central hub for Thai-translated furry manga and doujin works, managing manga submissions, reader experiences, community comments, user profiles, and digital asset storage.

## Language

### Assets & Storage

**Asset Storage**:
The intake module responsible for validating, transforming, and persisting uploaded media assets.
_Avoid_: S3 service, file uploader, R2 helper

**Asset Kind**:
The classification of an uploaded media asset (`manga-page`, `comment-image`, `avatar`, `advertisement`) that dictates its validation, transformation, and storage path policy.
_Avoid_: upload type, file category

**Storage Adapter**:
An adapter satisfying the storage seam to persist and retrieve media objects across different storage backends.
_Avoid_: S3 client, storage driver

### Identity & Authorization

**Auth Intake**:
The module responsible for validating incoming requests or sessions, verifying banned status, enforcing roles, and presenting an authorized caller context.
_Avoid_: auth middleware, session checker, permission service

**Caller Context**:
The verified identity and authorization state of the actor initiating a request or server action.
_Avoid_: user context, current user, session wrapper

### Security & Integrity

**Content Sanitization**:
The module responsible for escaping untrusted user input, scrubbing rich HTML, cleaning storage path segments, and redacting sensitive data from outgoing responses.
_Avoid_: string cleaner, filter utility, XSS scrubber

### Content & Publishing

**Manga**:
A translated work or comic consisting of metadata and ordered page assets.
_Avoid_: comic, book, post

**Submission**:
A pending manga contribution submitted by a translator or contributor for moderator review.
_Avoid_: draft, upload request

**Reader**:
The presentation surface for viewing manga page assets in sequence.
_Avoid_: viewer, gallery
