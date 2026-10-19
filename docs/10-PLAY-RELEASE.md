# Google Play release checklist | verified 2026-10-16
[ ] Create Play Console developer account, one-time $25 fee, verify identity.
[ ] Choose final app name/package ID, check trademark and Play listing availability (Momentum is placeholder).
[ ] New Android phone apps and updates target Android 16 API 36+ as of 2026-08-31 (verify before submission).
[ ] Use signed AAB, upload to internal testing first. Configure EAS keystore and app signing securely.
[ ] New personal accounts created after 2023-11-13: closed test ≥12 continuously opted-in testers ≥14 days, then apply for production access.
[ ] Declare health app status on Play Console **even for testing tracks**, describe health features accurately.
[ ] Publish accurate privacy policy for collected nutrition, body metrics, workout details and third-party processors.
[ ] Complete Data safety form and account/data deletion mechanisms, collection and sharing disclosures.
[ ] Health Connect: request only needed data permissions, justify them and comply with its policy.
[ ] Only user-consented nutrition/activity data transmitted. Avoid ad SDK at launch.
[ ] Test camera permission, offline behavior, account/data export/deletion, background sync, accessibility and crash rates.
[ ] App descriptions avoid medical/diagnostic claims and deceptive weight-loss promises.
[ ] Audit dependencies and update Play requirements shortly before publish.
[ ] Do not auto-submit production; final release needs owner review.
Sources: https://support.google.com/googleplay/android-developer/answer/11926878 ; https://support.google.com/googleplay/android-developer/answer/14151465 ; https://support.google.com/googleplay/android-developer/answer/14738291 ; https://support.google.com/googleplay/android-developer/answer/6112435
