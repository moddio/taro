class PhaserAttributeBar extends Phaser.GameObjects.Container {

	private readonly bar: Phaser.GameObjects.Graphics;
	private readonly text: Phaser.GameObjects.Text;

	constructor(private unit: PhaserUnit) {

		const scene = unit.scene;

		super(scene);

		const bar = this.bar = scene.add.graphics();
		this.add(bar);

		const text = this.text = scene.add.text(0, 0, '', {
			fontFamily: 'Arial',
			color: '#000000',
			align: 'center'
		});
		text.setFontStyle('bold');
		text.setFontSize(14);
		text.setOrigin(0.5);
		this.add(text);

		unit.add(this);
	}
}
