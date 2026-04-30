import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";

let _client: SESv2Client | null = null;

function getSesClient() {
  if (!_client) {
    _client = new SESv2Client({
      region: process.env.AWS_SES_REGION ?? "eu-west-1",
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  configurationSetName?: string;
  tags?: Array<{ Name: string; Value: string }>;
}

export async function sendEmail(opts: SendEmailOptions) {
  const client = getSesClient();
  const from = opts.from ?? process.env.SES_SENDER_EMAIL ?? process.env.SES_FROM_EMAIL!;
  const toAddresses = Array.isArray(opts.to) ? opts.to : [opts.to];

  const input: SendEmailCommandInput = {
    FromEmailAddress: from,
    Destination: { ToAddresses: toAddresses },
    Content: {
      Simple: {
        Subject: { Data: opts.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: opts.html, Charset: "UTF-8" },
          ...(opts.text ? { Text: { Data: opts.text, Charset: "UTF-8" } } : {}),
        },
      },
    },
    ...(opts.replyTo ? { ReplyToAddresses: [opts.replyTo] } : {}),
    ...(opts.configurationSetName
      ? { ConfigurationSetName: opts.configurationSetName }
      : process.env.SES_CONFIGURATION_SET
      ? { ConfigurationSetName: process.env.SES_CONFIGURATION_SET }
      : {}),
    ...(opts.tags ? { EmailTags: opts.tags } : {}),
  };

  const result = await client.send(new SendEmailCommand(input));
  return result.MessageId!;
}

export interface BulkRecipient {
  email: string;
  substitutions?: Record<string, string>;
}

export async function sendBulkEmail(
  recipients: BulkRecipient[],
  opts: Omit<SendEmailOptions, "to">
) {
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendEmail({ ...opts, to: r.email })
    )
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed };
}
