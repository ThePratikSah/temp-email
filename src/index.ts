import PostalMime from "postal-mime";
import {
	deleteEmailById,
	deleteEmailsByMailbox,
	getEmailById,
	getEmailsByMailbox,
	listMailboxes,
	saveEmail,
} from "./db";
import { AttachmentMeta } from "./types";

export default {
	/**
	 * Cloudflare Email Worker handler.
	 * Triggered whenever an email arrives at your domain's catch-all route.
	 */
	async email(message, env, ctx): Promise<void> {
		try {
			// 1. Envelope & Mailbox Extraction
			const recipient = message.to.trim().toLowerCase();
			const [rawMailbox, domain = ""] = recipient.split("@");
			const mailbox = rawMailbox || "default";
			const sender = message.from.trim().toLowerCase();

			console.log(`[Email] Received for ${recipient} (mailbox: ${mailbox}) from ${sender}`);

			// 2. Parse MIME structure using PostalMime
			const email = await PostalMime.parse(message.raw);

			// 3. Extract Headers
			const headerMap: Record<string, string> = {};
			for (const [key, value] of message.headers.entries()) {
				headerMap[key.toLowerCase()] = value;
			}

			const subject = email.subject || message.headers.get("subject") || "(No Subject)";
			const messageId = email.messageId || message.headers.get("message-id") || null;
			const replyTo = message.headers.get("reply-to") || null;

			// 4. Extract Attachment Metadata (omitting raw binary to respect D1 row size limits)
			const attachments: AttachmentMeta[] = (email.attachments || []).map((att) => {
				let size = 0;
				if (typeof att.content === "string") {
					size = att.content.length;
				} else if (att.content && "byteLength" in att.content) {
					size = att.content.byteLength;
				}
				return {
					filename: att.filename || "unnamed",
					mimeType: att.mimeType || "application/octet-stream",
					size,
					disposition: att.disposition || "attachment",
				};
			});

			// 5. Persist to Cloudflare D1
			const id = crypto.randomUUID();
			await saveEmail(env.DB, {
				id,
				mailbox,
				domain,
				recipient,
				sender,
				senderName: email.from?.name || null,
				replyTo,
				subject,
				bodyText: email.text || null,
				bodyHtml: email.html || null,
				hasAttachments: attachments.length > 0,
				attachments,
				rawSize: message.rawSize,
				messageId,
				headers: headerMap,
				receivedAt: new Date().toISOString(),
			});

			console.log(`[Email] Successfully saved email ${id} to mailbox '${mailbox}' in D1`);
		} catch (error) {
			console.error("[Email] Email processing failed:", error);

			// Fallback: forward to admin or reject
			try {
				await message.forward("shivam3448@gmail.com");
			} catch (fallbackError) {
				console.error("[Email] Fallback forwarding failed:", fallbackError);
				message.setReject("Internal processing error");
			}
		}
	},

	/**
	 * HTTP Fetch handler.
	 * Provides a REST API to inspect mailboxes, read emails, or bulk delete junk emails.
	 */
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// JSON helper
		const json = (data: unknown, status = 200) =>
			new Response(JSON.stringify(data, null, 2), {
				status,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		try {
			// GET /api/mailboxes - List all mailboxes and counts
			if (pathname === "/api/mailboxes" && request.method === "GET") {
				const mailboxes = await listMailboxes(env.DB);
				return json({ success: true, mailboxes });
			}

			// DELETE /api/emails?mailbox=junk - Bulk delete all emails in a mailbox (e.g. junk)
			if (pathname === "/api/emails" && request.method === "DELETE") {
				const mailbox = url.searchParams.get("mailbox");
				if (!mailbox) {
					return json({ success: false, error: "Missing 'mailbox' query parameter." }, 400);
				}
				const deletedCount = await deleteEmailsByMailbox(env.DB, mailbox);
				return json({
					success: true,
					message: `Successfully deleted all emails in mailbox '${mailbox}'`,
					deletedCount,
				});
			}

			// GET /api/emails?mailbox=hi - List emails in a specific mailbox
			if (pathname === "/api/emails" && request.method === "GET") {
				const mailbox = url.searchParams.get("mailbox");
				if (!mailbox) {
					return json(
						{ success: false, error: "Missing 'mailbox' query parameter (e.g. ?mailbox=junk or ?mailbox=hi)" },
						400,
					);
				}
				const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
				const offset = parseInt(url.searchParams.get("offset") || "0", 10);

				const emails = await getEmailsByMailbox(env.DB, mailbox, limit, offset);
				return json({ success: true, mailbox, count: emails.length, emails });
			}

			// GET /api/emails/:id - Get a specific email by ID
			const emailIdMatch = pathname.match(/^\/api\/emails\/([a-zA-Z0-9_-]+)$/);
			if (emailIdMatch && request.method === "GET") {
				const id = emailIdMatch[1];
				const email = await getEmailById(env.DB, id);
				if (!email) {
					return json({ success: false, error: "Email not found" }, 404);
				}
				return json({ success: true, email });
			}

			// DELETE /api/emails/:id - Delete a specific email by ID
			if (emailIdMatch && request.method === "DELETE") {
				const id = emailIdMatch[1];
				const deleted = await deleteEmailById(env.DB, id);
				return json({ success: deleted, deletedId: id });
			}

			// Root landing route
			if (pathname === "/") {
				return json({
					name: "Cloudflare Catch-All Email Worker with D1 Storage",
					endpoints: {
						"GET /api/mailboxes": "List all mailboxes and message counts",
						"GET /api/emails?mailbox=<name>": "List emails in a mailbox (e.g. ?mailbox=hi)",
						"GET /api/emails/:id": "Get single email by ID",
						"DELETE /api/emails?mailbox=junk": "Delete all emails in a mailbox at once",
						"DELETE /api/emails/:id": "Delete single email by ID",
					},
				});
			}

			return json({ success: false, error: "Not Found" }, 404);
		} catch (err: any) {
			return json({ success: false, error: err.message || "Internal server error" }, 500);
		}
	},
} satisfies ExportedHandler<Env>;