/**
 * Placeholder notification service.
 *
 * The base project does not send e-mail/SMS (no provider credentials are
 * required for it to run). Hook a real provider here when needed, e.g.:
 *   - SMTP / SendGrid  -> SMTP_HOST, SMTP_USER, SMTP_PASS
 *   - Twilio           -> TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
 * For now we simply log the event so the flow stays observable.
 */
export const notify = (event, payload = {}) => {
  console.log(`[notify:${event}]`, JSON.stringify(payload))
}

export default { notify }
