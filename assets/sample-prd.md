# PRD: AI Meeting Assistant (MVP)

Owner: Product Manager | Version 1.0 | Status: Approved for planning

## 1. Problem
Teams lose time writing meeting notes and chasing follow ups. Decisions made in calls are hard to find a week later, and action items are often never logged in the tools where work is tracked.

## 2. Goal
Within 12 weeks, launch a web product that records online meetings and turns them into a searchable record with a transcript, speaker labels, an AI summary and action items, and pushes outcomes to Slack and Jira.

## 3. Users
1. Team member: attends meetings, wants notes and action items without typing them.
2. Team lead: wants decisions and owners visible after every meeting.
3. Workspace admin: manages members, retention and consent settings.

## 4. Scope (MVP)
1. Sign in with a Google work account. Workspaces with admin and member roles.
2. Connect Google Calendar (read only) and choose which meetings to record, one by one or by rule.
3. A bot joins the chosen Google Meet call, announces that it is recording, and records audio.
4. If the bot cannot join, the user can upload an audio or video file (MP3, MP4, M4A, WAV, up to 500 MB).
5. Transcript with timestamps and speaker labels. Speakers can be renamed; names are suggested from calendar attendees.
6. AI summary with overview, key points, decisions and open questions. The user can edit it.
7. AI action items with owner and due date when they were said. The user confirms, edits or deletes each one.
8. Search across past meetings by keyword, speaker, participant and date.
9. Share the summary and action items to a Slack channel.
10. Create Jira issues from confirmed action items, with a link back to the meeting.
11. Notifications when notes are ready or processing failed.
12. Admin settings: members, data retention period, consent notice.

## 5. Out of scope
Live transcription, mobile apps, Zoom and Teams bots, languages other than English, CRM integration, voice cloning, billing.

## 6. Non functional requirements
1. A 60 minute meeting is processed in under 5 minutes (p90).
2. Search returns results in under 2 seconds (p95).
3. Recordings are encrypted in transit and at rest, and stored in the India region.
4. 98% of recorded meetings are processed without manual help.
5. Word error rate of 12% or lower on clear English audio, measured on a test set of 20 meetings.
6. Summary quality averages 4.0 or higher on a 5 point reviewer rubric.

## 7. Constraints and assumptions
1. Team of 8 engineers (4 backend, 2 frontend, 2 AI/ML), 2 QA, 1 designer, 1 Product Manager, 1 Technical Project Manager.
2. Meeting bot, speech to text and LLM are bought as APIs, not built.
3. Two week sprints; six sprints until launch.
4. Google OAuth verification for calendar scopes can take several weeks.

## 8. Success metrics (4 weeks after launch)
1. 3 of 5 pilot teams use it every week.
2. 60% of recorded meetings are shared to Slack or Jira.
3. Users save at least 15 minutes per meeting on notes and follow ups, by survey.
