class PhaserUnit extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;
	label: Phaser.GameObjects.Text;
	chat: PhaserChatBubble;

	attributes: PhaserAttributeBar[] = [];

	private followListener: EvtListener;
	private stopFollowListener: EvtListener;

	private playAnimationListener: EvtListener;

	private updateLabelListener: EvtListener;
	private hideLabelListener: EvtListener;

	private fadingTextListener: EvtListener;

	private renderAttributesListener: EvtListener;
	private updateAttributeListener: EvtListener;

	private renderChatListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private unit: Unit) {

		super(scene);

		const key = `unit/${unit._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		this.add(sprite);

		const label = this.label = scene.add.text(0, 0, 'cccccc');
		label.setOrigin(0.5);
		this.add(label);

		scene.add.existing(this);

		this.followListener = unit.on('follow', () => {
			console.log('PhaserUnit follow', unit.id()); // TODO remove
			const camera = scene.cameras.main as Phaser.Cameras.Scene2D.Camera & {
				_follow: Phaser.GameObjects.GameObject
			};
			if (camera._follow === this) {
				return;
			}
			camera.startFollow(this, true, 0.05, 0.05);
		});

		this.stopFollowListener = unit.on('stop-follow', () => {
			console.log('PhaserUnit stop-follow', unit.id()); // TODO remove
			scene.cameras.main.stopFollow();
		});

		this.playAnimationListener =
			unit.on('play-animation', (animationId: string) => {
				console.log('PhaserUnit play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});

		this.updateLabelListener =
			unit.on('update-label', (config: {
				text? : string;
				bold?: boolean;
				color?: string;
			}) => {
				console.log('PhaserUnit update-label', unit.id()); // TODO remove
				label.visible = true;

				label.setFontFamily('Verdana');
				label.setFontSize(16);
				label.setFontStyle(config.bold ? 'bold' : 'normal');
				label.setFill(config.color || '#fff');

				const strokeThickness = ige.game.data.settings
					.addStrokeToNameAndAttributes !== false ? 4 : 0;
				label.setStroke('#000', strokeThickness);

				label.setText(config.text || '');

				label.y = -25 -
					Math.max(sprite.displayHeight, sprite.displayWidth) / 2;
				label.setScale(1.25);
			});

		this.hideLabelListener =
			unit.on('hide-label', () => {
				console.log('PhaserUnit hide-label', unit.id()); // TODO remove
				label.visible = false;
			});

		this.fadingTextListener =
			unit.on('fading-text', (config: {
				text: string;
				color?: string;
			}) => {
				console.log('PhaserUnit fading-text', unit.id()); // TODO remove
				const data = {
					text : config.text || '',
					x: 0,
					y: 0,
					color: config.color || '#fff'
				};
				new PhaserFloatingText(this.scene, data, this);
			});

		const attributes = this.attributes;

		this.renderAttributesListener =
			unit.on('render-attributes', (data: {
				attrs: AttributeData[]
			}) => {
				console.log('PhaserUnit render-attributes', data); // TODO remove

				// release all existing attribute bars
				attributes.forEach((a) => {
					PhaserAttributeBar.release(a);
				});
				attributes.length = 0;

				// add attribute bars based on passed data
				data.attrs.forEach((ad) => {
					const a = PhaserAttributeBar.get(this);
					a.render(ad);
					attributes.push(a);
				});
			});

		this.updateAttributeListener =
			unit.on('update-attribute', (data: {
				attr: AttributeData;
				shouldRender: boolean;
			}) => {
				console.log('PhaserUnit update-attribute', data); // TODO remove

				let a: PhaserAttributeBar;
				let i = 0;

				for (; i < attributes.length; i++) {

					if (attributes[i].name === data.attr.type) {

						a = attributes[i];

						break;
					}
				}

				if (!data.shouldRender) {

					if (a) {
						PhaserAttributeBar.release(a);
						attributes.splice(i, 1);
					}

					return;

				}

				if (!a) {

					a = PhaserAttributeBar.get(this);

					attributes.push(a);
				}

				a.render(data.attr);

			});

		this.renderChatListener = unit.on('render-chat-bubble', (text) => {
			console.log('create-chat', text); // TODO remove
			if (this.chat) {
				this.chat.showMessage(text);
			} else {
				this.chat = new PhaserChatBubble(scene, text, this);
			}
		});

		/*this.renderChatBubble =
			unit.on('render-chat-bubble', (data: {
				attrs: AttributeData[]
			}) => {
				console.log('PhaserUnit render-attributes', data); // TODO remove

				// release all existing attribute bars
				attributes.forEach((a) => {
					PhaserAttributeBar.release(a);
				});
				attributes.length = 0;

				// add attribute bars based on passed data
				data.attrs.forEach((ad) => {
					const a = PhaserAttributeBar.get(this);
					a.render(ad);
					attributes.push(a);
				});
			});*/

		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		const unit = this.unit;
		const container = unit._pixiContainer;
		const texture = unit._pixiTexture;

		if (unit._destroyed || container._destroyed) {

			unit.off('follow', this.followListener);
			this.followListener = null;

			unit.off('stop-follow', this.stopFollowListener);
			this.stopFollowListener = null;

			unit.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;

			unit.off('update-label', this.updateLabelListener);
			this.updateLabelListener = null;

			unit.off('hide-label', this.hideLabelListener);
			this.hideLabelListener = null;

			unit.off('render-attributes', this.renderAttributesListener);
			this.renderAttributesListener = null;

			unit.off('update-attribute', this.updateAttributeListener);
			this.updateAttributeListener = null;

			unit.off('render-chat-bubble', this.renderChatListener);
			this.renderChatListener = null;
			if (this.chat) this.chat.destroy();

			// release all instantiated attribute bars
			this.attributes.forEach((a) => {
				PhaserAttributeBar.release(a);
			});
			this.attributes.length = 0;
			this.attributes = null;

			this.scene.events.off('update', this.update, this);

			this.label = null;
			this.sprite = null;

			this.destroy();

			return;
		}

		this.x = container.x;
		this.y = container.y;

		if (this.chat) this.chat.update(this.x, this.y);

		const sprite = this.sprite;
		sprite.rotation = texture.rotation;

		const bounds = unit._bounds2d;
		const flip = unit._stats.flip;
		sprite.setDisplaySize(bounds.x, bounds.y);
		sprite.setFlip(flip % 2 === 1, flip > 1);
	}
}
