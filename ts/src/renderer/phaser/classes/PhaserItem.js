class PhaserItem extends Phaser.GameObjects.Container {
    constructor(scene, item) {
        super(scene);
        this.item = item;
        const key = `item/${item._stats.itemTypeId}`;
        const sprite = this.sprite = scene.add.sprite(0, 0, key);
        this.add(sprite);
        scene.add.existing(this);
        this.hide = item.on('hide', () => {
            this.sprite.setActive(false).setVisible(false);
        });
        this.show = item.on('show', () => {
            this.sprite.setActive(true).setVisible(true);
        });
        this.playAnimationListener =
            item.on('play-animation', (animationId) => {
                console.log('PhaserItem play-animation', `${key}/${animationId}`); // TODO remove
                sprite.play(`${key}/${animationId}`);
            });
        scene.events.on('update', this.update, this);
    }
    update( /*time: number, delta: number*/) {
        const item = this.item;
        const container = item._pixiContainer;
        const texture = item._pixiTexture;
        if (item._destroyed || container._destroyed) {
            item.off('hide', this.hide);
            this.hide = null;
            item.off('show', this.show);
            this.show = null;
            item.off('play-animation', this.playAnimationListener);
            this.playAnimationListener = null;
            this.scene.events.off('update', this.update, this);
            this.sprite = null;
            this.destroy();
            return;
        }
        this.x = container.x;
        this.y = container.y;
        const sprite = this.sprite;
        sprite.rotation = texture.rotation;
        sprite.setScale(texture.scale.x, texture.scale.y);
    }
}
//# sourceMappingURL=PhaserItem.js.map