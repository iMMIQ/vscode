import { Disposable } from "../../base/common/lifecycle.js";
import { localize } from '../../nls.js';
import { INotificationService, Severity } from '../../platform/notification/common/notification.js';

export class CodeServerClient extends Disposable {
	constructor (
		@INotificationService private notificationService: INotificationService,
	) {
		super();
	}

	async startup(): Promise<void> {
		// Emit ready events
		const event = new CustomEvent('ide-ready');
		window.dispatchEvent(event);

		if (parent) {
			// Tell the parent loading has completed.
			parent.postMessage({ event: 'loaded' }, '*');

			// Proxy or stop proxing events as requested by the parent.
			const listeners = new Map<string, (event: Event) => void>();

			window.addEventListener('message', parentEvent => {
				const eventName = parentEvent.data.bind || parentEvent.data.unbind;
				if (eventName) {
					const oldListener = listeners.get(eventName);
					if (oldListener) {
						document.removeEventListener(eventName, oldListener);
					}
				}

				if (parentEvent.data.bind && parentEvent.data.prop) {
					const listener = (event: Event) => {
						parent?.postMessage(
							{
								event: parentEvent.data.event,
								[parentEvent.data.prop]: event[parentEvent.data.prop as keyof Event],
							},
							window.location.origin,
						);
					};
					listeners.set(parentEvent.data.bind, listener);
					document.addEventListener(parentEvent.data.bind, listener);
				}
			});
		}

		if (!window.isSecureContext) {
			this.notificationService.notify({
				severity: Severity.Warning,
				message: localize(
					'insecureContext',
					"{0} is being accessed in an insecure context. Web views, the clipboard, and other functionality may not work as expected.",
					'code-server',
				),
				actions: {
					primary: [
						{
							id: 'understand',
							label: localize('confirmInsecure', "I understand"),
							tooltip: '',
							class: undefined,
							enabled: true,
							checked: true,
							run: () => {
								return Promise.resolve();
							},
						},
					],
				},
			});
		}
	}
}
