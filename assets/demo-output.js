// Sample output for the sample PRD (assets/sample-prd.md), generated with Claude using prompts/backlog_prompt.md.
// Demo mode loads this so the tool works without an API key.
window.DEMO_OUTPUT = {
  "product": "AI Meeting Assistant (MVP)",
  "assumptions": [
    "Google Meet is the only meeting platform in the MVP; Zoom and Teams come later.",
    "Jira Cloud only; Jira Server and Data Center are not supported.",
    "English only for transcripts and summaries.",
    "Pilot users are added as Google OAuth test users until verification is approved.",
    "The meeting bot, speech to text and LLM vendors are chosen in the spikes in the first sprint."
  ],
  "open_questions": [
    "What is the default data retention period, and can admins set it per workspace?",
    "Should action items without a named owner be assigned to the meeting organiser by default?",
    "Can members post to any Slack channel, or only channels chosen by an admin?",
    "What is the longest meeting we must support (2 hours, 4 hours)?",
    "What should the bot be called in the participant list, and who writes the consent message text?",
    "Who owns the 20 meeting test set and the reviewer rubric for summary quality?"
  ],
  "epics": [
    {
      "id": "E1", "name": "Accounts and workspace", "goal": "People sign in with their work account and share one meeting library per team.",
      "stories": [
        {"id": "E1-S1", "type": "Story", "title": "Sign in with Google work account",
         "story": "As a team member, I want to sign in with my Google work account, so that I do not need another password.",
         "acceptance_criteria": [
           "Given a valid Google Workspace account, when I click Sign in with Google, then I land on my workspace home within 5 seconds.",
           "Given a personal Gmail account, when I sign in, then I see a message that a work account is needed.",
           "Given I sign out, when I press back in the browser, then no meeting data is shown."],
         "points": 5, "priority": "Must", "depends_on": ["E2-S1"], "labels": ["auth"]},
        {"id": "E1-S2", "type": "Story", "title": "Workspace and roles",
         "story": "As a workspace admin, I want to invite members and set roles, so that my team shares one meeting library.",
         "acceptance_criteria": [
           "Given I am the first user from my domain, when I sign in, then a workspace is created and I am admin.",
           "Given I am admin, when I invite a member by email, then they join with the member role on first sign in.",
           "Given I am a member, when I open settings, then I cannot change roles."],
         "points": 3, "priority": "Must", "depends_on": ["E1-S1"], "labels": ["auth"]},
        {"id": "E1-S3", "type": "Story", "title": "Admin settings for retention and consent",
         "story": "As a workspace admin, I want to set the data retention period and the consent notice, so that we meet our privacy policy.",
         "acceptance_criteria": [
           "Given I am admin, when I set retention to 30, 90 or 365 days, then the setting is saved and shown to all members.",
           "Given I edit the consent notice, when the bot next joins a meeting, then it posts the updated text.",
           "Given I am a member, when I open admin settings, then I see them as read only."],
         "points": 5, "priority": "Should", "depends_on": ["E1-S2"], "labels": ["admin", "privacy"]}
      ]
    },
    {
      "id": "E2", "name": "Platform foundations", "goal": "The team can build, test and deploy safely, and the riskiest choices are proven early.",
      "stories": [
        {"id": "E2-S1", "type": "Enabler", "title": "Environments and CI/CD",
         "story": "As an engineer, I want dev and staging environments with a CI/CD pipeline, so that every merge is tested and deployable.",
         "acceptance_criteria": [
           "Given a merge to main, when the pipeline runs, then tests run and the build deploys to staging.",
           "Given a failing test, when the pipeline runs, then the deployment is blocked.",
           "Given any secret, when it is used by a service, then it comes from the secrets manager, not the code."],
         "points": 5, "priority": "Must", "depends_on": [], "labels": ["devops"]},
        {"id": "E2-S2", "type": "Enabler", "title": "Core data model",
         "story": "As an engineer, I want the core data model in place, so that meetings, transcripts and action items have a stable home.",
         "acceptance_criteria": [
           "Given the migrations run, when I inspect the database, then tables exist for workspaces, users, meetings, recordings, transcript segments, summaries and action items.",
           "Given the entity diagram, when the Backend Lead reviews it, then it is approved and stored in the wiki."],
         "points": 3, "priority": "Must", "depends_on": ["E2-S1"], "labels": ["backend"]},
        {"id": "E2-S3", "type": "Spike", "title": "Spike: meeting bot vendor",
         "story": "As the team, we want to test meeting bot vendors, so that we know a bot can join Google Meet and return a recording.",
         "acceptance_criteria": [
           "Given 5 test Google Meet calls, when the bot is scheduled, then a recording is returned for all 5.",
           "Given the test results, when the spike ends after 4 days, then join time, failure cases, limits and cost per hour are written in the decision record."],
         "points": 5, "priority": "Must", "depends_on": [], "labels": ["spike", "vendor"]},
        {"id": "E2-S4", "type": "Spike", "title": "Spike: speech to text with speaker labels",
         "story": "As the team, we want to compare 2 speech to text vendors on our own recordings, so that we pick one that meets the 12% word error rate target.",
         "acceptance_criteria": [
           "Given 10 recordings from the test set, when both vendors transcribe them, then word error rate and speaker labelling errors are measured for each.",
           "Given the results, when the spike ends after 4 days, then the AI/ML Lead signs a recommendation with cost per audio hour."],
         "points": 5, "priority": "Must", "depends_on": [], "labels": ["spike", "ai"]},
        {"id": "E2-S5", "type": "Spike", "title": "Spike: LLM summary baseline",
         "story": "As the team, we want a first summary baseline, so that we know where summary quality starts before we build.",
         "acceptance_criteria": [
           "Given 5 transcripts, when they are summarised with a first prompt, then 2 reviewers score each on the 5 point rubric.",
           "Given the scores, when the spike ends, then the baseline score, token cost and latency are recorded."],
         "points": 3, "priority": "Should", "depends_on": [], "labels": ["spike", "ai"]}
      ]
    },
    {
      "id": "E3", "name": "Meeting capture", "goal": "Chosen meetings are recorded reliably, with consent, and nothing is lost.",
      "stories": [
        {"id": "E3-S1", "type": "Story", "title": "Connect Google Calendar",
         "story": "As a team member, I want to connect my Google Calendar, so that the assistant knows my upcoming meetings.",
         "acceptance_criteria": [
           "Given I grant read only calendar access, when I connect, then my next 14 days of meetings with a Meet link appear within 1 minute.",
           "Given I revoke access in Google, when the app next syncs, then I see a reconnect prompt.",
           "Given a meeting without a video link, when I view my list, then it is not offered for recording."],
         "points": 5, "priority": "Must", "depends_on": ["E1-S1"], "labels": ["integration", "calendar"]},
        {"id": "E3-S2", "type": "Story", "title": "Choose meetings to record",
         "story": "As a team member, I want to choose which meetings are recorded, one by one or by a rule, so that only the right calls are captured.",
         "acceptance_criteria": [
           "Given a meeting in my list, when I switch Record on, then it is marked for recording.",
           "Given I set the rule Record all meetings I organise, when a new meeting I organise is synced, then it is marked for recording.",
           "Given I switch Record off before the start, then the bot does not join."],
         "points": 3, "priority": "Must", "depends_on": ["E3-S1"], "labels": ["calendar"]},
        {"id": "E3-S3", "type": "Story", "title": "Bot joins and records",
         "story": "As a team member, I want the bot to join and record the meetings I chose, so that I do not have to take notes.",
         "acceptance_criteria": [
           "Given a meeting marked Record, when it starts, then the bot joins within 2 minutes and records until the meeting ends.",
           "Given the host does not admit the bot within 10 minutes, then the bot leaves and the meeting shows Not recorded with the reason.",
           "Given the meeting ends, when the recording is ready, then it is received through the vendor webhook."],
         "points": 8, "priority": "Must", "depends_on": ["E2-S3", "E3-S2", "E3-S6"], "labels": ["integration", "bot"]},
        {"id": "E3-S4", "type": "Story", "title": "Consent notice and stop command",
         "story": "As a meeting participant, I want to know the meeting is recorded and be able to stop it, so that my consent is respected.",
         "acceptance_criteria": [
           "Given the bot joins, then its name says it is recording and it posts the consent notice in the meeting chat.",
           "Given any participant types the stop command in chat, then recording stops within 10 seconds and the owner is notified."],
         "points": 3, "priority": "Must", "depends_on": ["E3-S3"], "labels": ["privacy", "bot"]},
        {"id": "E3-S5", "type": "Story", "title": "Upload a recording file",
         "story": "As a team member, I want to upload a meeting recording, so that I still get notes when the bot did not join.",
         "acceptance_criteria": [
           "Given an MP3, MP4, M4A or WAV file up to 500 MB, when I upload it, then it is stored and shows Uploaded.",
           "Given an unsupported or larger file, when I upload it, then I see a clear error and nothing is stored."],
         "points": 5, "priority": "Must", "depends_on": ["E3-S6"], "labels": ["upload"]},
        {"id": "E3-S6", "type": "Enabler", "title": "Store recordings and queue processing",
         "story": "As the system, I need every recording stored and queued for processing, so that no meeting is lost.",
         "acceptance_criteria": [
           "Given a recording is received, when it is stored encrypted in the India region, then a processing job is queued within 30 seconds.",
           "Given a job fails, then it retries 3 times with backoff and then alerts the on call engineer.",
           "Given any meeting, when I open it, then I see one status: Recorded, Processing, Ready or Failed."],
         "points": 5, "priority": "Must", "depends_on": ["E2-S2"], "labels": ["backend", "pipeline"]}
      ]
    },
    {
      "id": "E4", "name": "Transcripts", "goal": "Users read an accurate transcript and know who said what.",
      "stories": [
        {"id": "E4-S1", "type": "Story", "title": "Transcript with speaker labels",
         "story": "As a team member, I want an accurate transcript with speakers labelled, so that I can read who said what.",
         "acceptance_criteria": [
           "Given a 60 minute recording, when processing completes, then the transcript is ready within 5 minutes (p90).",
           "Given a ready transcript, then each segment has a speaker label, start time and text.",
           "Given the 20 meeting test set, then word error rate is 12% or lower on clear audio."],
         "points": 8, "priority": "Must", "depends_on": ["E2-S4", "E3-S6"], "labels": ["ai", "pipeline"]},
        {"id": "E4-S2", "type": "Story", "title": "Transcript viewer with playback",
         "story": "As a team member, I want to read the transcript and play the audio from any line, so that I can check what was said.",
         "acceptance_criteria": [
           "Given a ready transcript, when I click a line, then audio plays from that timestamp.",
           "Given a 2 hour meeting, when I open the transcript, then the page loads in under 3 seconds.",
           "Given a transcript, when I click Download, then I get a TXT file."],
         "points": 5, "priority": "Must", "depends_on": ["E4-S1"], "labels": ["frontend"]},
        {"id": "E4-S3", "type": "Story", "title": "Rename speakers",
         "story": "As a team member, I want to rename speakers, so that the transcript shows real names.",
         "acceptance_criteria": [
           "Given labels Speaker 1 and Speaker 2, when I rename Speaker 1, then every segment for that speaker updates.",
           "Given calendar attendees, when I rename a speaker, then attendee names are suggested."],
         "points": 3, "priority": "Should", "depends_on": ["E4-S1"], "labels": ["frontend"]},
        {"id": "E4-S4", "type": "Story", "title": "Notes ready and failure notifications",
         "story": "As a team member, I want to be told when notes are ready or processing failed, so that I do not keep checking.",
         "acceptance_criteria": [
           "Given processing completes, then I get an in app and email notification with a link.",
           "Given processing fails after retries, then I see the reason and options to retry or upload the file."],
         "points": 3, "priority": "Should", "depends_on": ["E3-S6"], "labels": ["notifications"]}
      ]
    },
    {
      "id": "E5", "name": "AI summary and action items", "goal": "Every meeting ends with a trusted summary and confirmed action items.",
      "stories": [
        {"id": "E5-S1", "type": "Story", "title": "AI meeting summary",
         "story": "As a team lead, I want an AI summary with overview, key points, decisions and open questions, so that I can catch up in 2 minutes.",
         "acceptance_criteria": [
           "Given a ready transcript, when the summary is generated, then it has the four sections: overview, key points, decisions, open questions.",
           "Given the 20 meeting test set, then reviewers score summaries 4.0 or higher on average on the 5 point rubric.",
           "Given a decision in the summary, then it links to the transcript timestamp it came from."],
         "points": 8, "priority": "Must", "depends_on": ["E4-S1", "E2-S5"], "labels": ["ai"]},
        {"id": "E5-S2", "type": "Story", "title": "Edit the summary",
         "story": "As a team member, I want to edit the summary before sharing, so that what goes out is correct.",
         "acceptance_criteria": [
           "Given a summary, when I edit and save it, then the edited version is shown to everyone in the workspace.",
           "Given an edited summary, then it shows Edited by and the time."],
         "points": 3, "priority": "Must", "depends_on": ["E5-S1"], "labels": ["frontend"]},
        {"id": "E5-S3", "type": "Story", "title": "Extract action items",
         "story": "As a team lead, I want action items extracted with owner and due date, so that follow ups are not lost.",
         "acceptance_criteria": [
           "Given a transcript, when action items are extracted, then each has a task, and an owner and due date when they were said.",
           "Given the labelled test set, then extraction reaches 85% precision and 80% recall.",
           "Given an action item, then it links to the transcript line it came from."],
         "points": 8, "priority": "Must", "depends_on": ["E4-S1"], "labels": ["ai"]},
        {"id": "E5-S4", "type": "Story", "title": "Confirm or edit action items",
         "story": "As a team member, I want to confirm, edit or delete each action item, so that only correct tasks move forward.",
         "acceptance_criteria": [
           "Given a list of action items, when I confirm one, then it is marked Confirmed.",
           "Given an action item, when I edit the owner or date and save, then the change is kept.",
           "Given an action item, when I delete it, then it no longer appears in the meeting."],
         "points": 3, "priority": "Must", "depends_on": ["E5-S3"], "labels": ["frontend"]},
        {"id": "E5-S5", "type": "Story", "title": "Long meetings",
         "story": "As a team member, I want long meetings summarised as well as short ones, so that 2 hour workshops are covered.",
         "acceptance_criteria": [
           "Given a 2 hour transcript, when the summary is generated, then it covers the whole meeting with no section missing.",
           "Given a 2 hour transcript, then the summary is generated quickly."],
         "points": 5, "priority": "Should", "depends_on": ["E5-S1"], "labels": ["ai"]},
        {"id": "E5-S6", "type": "Enabler", "title": "AI quality evaluation harness",
         "story": "As the AI/ML team, we want an automated evaluation run, so that every prompt or model change is measured before release.",
         "acceptance_criteria": [
           "Given the 20 meeting test set, when the evaluation runs, then it reports word error rate, rubric scores and action item precision and recall.",
           "Given a change lowers any score below target, then the pipeline flags it before release."],
         "points": 5, "priority": "Must", "depends_on": ["E2-S4"], "labels": ["ai", "quality"]}
      ]
    },
    {
      "id": "E6", "name": "Search", "goal": "Past decisions are found in seconds.",
      "stories": [
        {"id": "E6-S1", "type": "Enabler", "title": "Index transcripts and summaries",
         "story": "As the system, I need transcripts and summaries indexed, so that they can be searched.",
         "acceptance_criteria": [
           "Given a meeting becomes Ready, then its transcript and summary are indexed within 1 minute.",
           "Given a meeting is deleted, then it is removed from the index within 1 minute."],
         "points": 5, "priority": "Must", "depends_on": ["E4-S1"], "labels": ["backend", "search"]},
        {"id": "E6-S2", "type": "Story", "title": "Search with filters",
         "story": "As a team member, I want to search past meetings by keyword, speaker, participant and date, so that I can find a decision quickly.",
         "acceptance_criteria": [
           "Given indexed meetings, when I search a keyword, then matching meetings show with the matched line highlighted in under 2 seconds (p95).",
           "Given filters for speaker, participant and date, when I apply them, then only matching results show.",
           "Given I am a member, then I only see meetings from my workspace."],
         "points": 5, "priority": "Must", "depends_on": ["E6-S1"], "labels": ["search", "frontend"]},
        {"id": "E6-S3", "type": "Story", "title": "Semantic ranking",
         "story": "As a team member, I want results ranked by meaning, not only exact words, so that I find meetings even when I do not remember the words used.",
         "acceptance_criteria": [
           "Given the query budget approval, when I search, then meetings that discussed budget sign off rank in the top 5 even without the exact phrase.",
           "Given 20 test queries, then the right meeting is in the top 5 for at least 16."],
         "points": 5, "priority": "Could", "depends_on": ["E6-S1"], "labels": ["ai", "search"]}
      ]
    },
    {
      "id": "E7", "name": "Slack and Jira", "goal": "Meeting outcomes land in the tools teams already use.",
      "stories": [
        {"id": "E7-S1", "type": "Story", "title": "Share summary to Slack",
         "story": "As a team lead, I want to post the summary and action items to a Slack channel, so that people who missed the call are informed.",
         "acceptance_criteria": [
           "Given I connect Slack, when I choose a channel and click Share, then the summary and action items are posted with a link to the meeting.",
           "Given the Slack app is removed, when I click Share, then I see a reconnect prompt and nothing is lost."],
         "points": 5, "priority": "Must", "depends_on": ["E5-S2"], "labels": ["integration", "slack"]},
        {"id": "E7-S2", "type": "Story", "title": "Connect Jira Cloud",
         "story": "As a workspace admin, I want to connect Jira Cloud and map a default project, so that action items can become issues.",
         "acceptance_criteria": [
           "Given I am admin, when I connect Jira Cloud, then I can choose a default project and issue type.",
           "Given the connection expires, then admins see a reconnect prompt."],
         "points": 5, "priority": "Must", "depends_on": ["E1-S2"], "labels": ["integration", "jira"]},
        {"id": "E7-S3", "type": "Story", "title": "Create Jira issues from action items",
         "story": "As a team member, I want to create Jira issues from confirmed action items, so that follow ups are tracked where work happens.",
         "acceptance_criteria": [
           "Given confirmed action items, when I click Create in Jira, then one issue is created per item with owner, due date and a link back to the meeting.",
           "Given an issue already exists for an item, when I click again, then no duplicate is created."],
         "points": 5, "priority": "Must", "depends_on": ["E7-S2", "E5-S4"], "labels": ["integration", "jira"]}
      ]
    },
    {
      "id": "E8", "name": "Launch readiness", "goal": "The product is secure, fast and ready to run in production.",
      "stories": [
        {"id": "E8-S1", "type": "Enabler", "title": "Performance and load testing",
         "story": "As the team, we want to load test at 3 times expected peak, so that the processing and search targets hold on launch day.",
         "acceptance_criteria": [
           "Given 3 times the expected meetings ending on the hour, when the load test runs, then p90 processing stays under 5 minutes.",
           "Given the load test, then search stays under 2 seconds (p95) and no jobs are lost."],
         "points": 8, "priority": "Must", "depends_on": ["E6-S2", "E5-S1"], "labels": ["performance"]},
        {"id": "E8-S2", "type": "Enabler", "title": "Security hardening and VAPT fixes",
         "story": "As the team, we want an external security test and all high findings fixed, so that customer recordings are safe.",
         "acceptance_criteria": [
           "Given the external VAPT report, then all critical and high findings are closed and retested before launch.",
           "Given any recording, then it is encrypted in transit and at rest."],
         "points": 8, "priority": "Must", "depends_on": ["E7-S3"], "labels": ["security"]},
        {"id": "E8-S3", "type": "Enabler", "title": "Production environment and runbook",
         "story": "As the team, we want production with monitoring, alerts and a runbook, so that we can launch and support the product.",
         "acceptance_criteria": [
           "Given production is built from code, when the release dry run is done, then it deploys and rolls back within 30 minutes.",
           "Given an error rate or queue age above threshold, then the on call engineer is alerted."],
         "points": 5, "priority": "Must", "depends_on": ["E2-S1"], "labels": ["devops"]},
        {"id": "E8-S4", "type": "Enabler", "title": "Retention and deletion jobs",
         "story": "As a workspace admin, I want recordings deleted after the retention period, so that we keep data only as long as allowed.",
         "acceptance_criteria": [
           "Given a retention period, when a recording passes it, then the audio, transcript and index entries are deleted within 24 hours.",
           "Given a deletion, then it is written to the audit log."],
         "points": 5, "priority": "Must", "depends_on": ["E1-S3"], "labels": ["privacy", "backend"]}
      ]
    }
  ]
};
