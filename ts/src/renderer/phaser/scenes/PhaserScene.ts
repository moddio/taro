class PhaserScene extends Phaser.Scene {

	patchUrl (url: string): string {
		return url.replace(/^http(s)?:/i, location.protocol);
	}
}
