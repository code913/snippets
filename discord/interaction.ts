/**
 * The Interaction class takes a raw webhook interaction from discord and adds helpers to it
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */

import { InteractionResponseType } from "discord-interactions";

export class JsonResponse extends Response {
	constructor(body: { type: InteractionResponseType; data?: any; }, init?: ResponseInit | undefined) {
		const jsonBody = JSON.stringify(body);
		init ??= {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		};
		super(jsonBody, init);
	}
};

export class Interaction {
	[key: string]: any;
	constructor(interaction: any) {
		Object.assign(this, interaction);

		function getResolved(group: string) {
			return interaction.data.resolved[group][interaction.data.target_id];
		}
		switch (interaction.data.type) {
			case 2: {
				this.target = getResolved("users");
				break;
			};
			case 3: {
				this.target = getResolved("messages");
				break;
			};
		}

		function unpackOptions(opts: any) {
			let unpacked: { [key: string]: any } = {};
			for (let { name, value } of (opts ?? [])) {
				unpacked[name] = value ?? {};
			}
			return unpacked;
		}

		let { options } = interaction.data;

		if (options?.length) {
			let opt = options[0];
			switch (opt.type) {
				case 2: {
					const sub = opt.options[0];
					this.subcommand = `${opt.name} ${sub.name}`;
					({ options } = sub);
					break;
				}
				case 1: {
					this.subcommand = opt.name;
					({ options } = opt);
					break;
				}
				default:
					break;
			}

			this.options = unpackOptions(options);
		}
	}

	async createResponse(data: {
		[key: string]: any,
		attachments?: {
			name: string,
			bits: string | Buffer | ArrayBufferLike,
			type?: string
		}[]
	}, { type }: { type: InteractionResponseType } = {
		type: this.message ? InteractionResponseType.UPDATE_MESSAGE : InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
	}) {
		const { attachments } = data;
		const body = {
			type,
			data // intended to be a reference
		};

		if (attachments) {
			// @ts-ignore
			data.attachments = data.attachments?.map((_, i) => ({ id: i }));

			const formData = new FormData();

			formData.append("payload_json", JSON.stringify(body));

			for (let [i, { name, bits, type }] of Object.entries(attachments))
				formData.append(`files[${i}]`, new File([bits], name, {
					type: type ?? "application/octet-stream"
				}));

			return new Response(formData);
		}

		return new JsonResponse(body);
	}
};
