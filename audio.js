let SOUNDS;
let audioCon;
try {
	new Howl({
		src: ['Songs/cavesounds1.ogg'],
	});
	onHowlLoaded();
}
catch (e) {
	class FakeHowl {
		volume() {}
		play() {}
		on() {}
		rate() {}
	}

	console.error(
		"Dependency Howl not loaded. Check internet connection and try again."
		+ "\n" + e
		+ "\n" + e.stack
	);
	SOUNDS = {
		CAVE_AMBIANCE: new FakeHowl(), 
		HEADER_MUSIC: new FakeHowl(), 
		LOOP1_MUSIC: new FakeHowl(), 
		LOOP2_MUSIC: new FakeHowl(), 
		LOOP3_MUSIC: new FakeHowl(), 
		END_MUSIC: new FakeHowl(), 
		FORMAL_COMPLAINT_MUSIC: new FakeHowl(), 
		DEATH_SFX: new FakeHowl(), 
		THROW_SFX: new FakeHowl(), 
		PICKUP_SFX: new FakeHowl(), 
		GEM_PICKUP_SFX: new FakeHowl(), 
		SPRING_SFX: new FakeHowl(), 
		JUMP_SFX: new FakeHowl(), 
		DJUMP_SFX: new FakeHowl(), 
		UNLOCK_SFX: new FakeHowl(), 
		BUTTON_SFX: new FakeHowl(), 
		PING_SFX: new FakeHowl(), 
		PONG_SFX: new FakeHowl(), 
		INCORRECT_SFX: new FakeHowl(),
		CORRECT_SFX: new FakeHowl(), 
	}
}

function onHowlLoaded() {
	SOUNDS = {
		CAVE_AMBIANCE: new Howl({
			src: ['Songs/cavesounds1.ogg'], loop: true,
		}), 
		HEADER_MUSIC: new Howl({
			src: ['Songs/velvetOpening.ogg'], loop: false,
		}), 
		LOOP1_MUSIC: new Howl({
			src: ['Songs/velvet1.ogg'], loop: false,
		}), 
		LOOP2_MUSIC: new Howl({
			src: ['Songs/velvet2.ogg'], loop: false,
		}), 
		LOOP3_MUSIC: new Howl({
			src: ['Songs/velvet3.ogg'], loop: false,
		}), 
		END_MUSIC: new Howl({
			src: ['Songs/velvetCredits.ogg'], loop: true,
		}), 
		FORMAL_COMPLAINT_MUSIC: new Howl({
			src: ['Songs/formal-complaint.mp3'], loop: true,
		}), 
		DEATH_SFX: new Howl({
			src: ['sfx/Death.wav'], loop: false,
		}), 
		THROW_SFX: new Howl({
			src: ['sfx/Throw.wav'], loop: false,
		}), 
		PICKUP_SFX: new Howl({
			src: ['sfx/Pickup.ogg'], loop: false,
			maxVolume: 0.5
		}), 
		GEM_PICKUP_SFX: new Howl({
			src: ['sfx/GemPickup.wav'], loop: false,
		}), 
		SPRING_SFX: new Howl({
			src: ['sfx/Spring.ogg'], loop: false,
			volume: 0.5,
		}), 
		JUMP_SFX: new Howl({
			src: ['sfx/Jump.ogg'], loop: false,
		}), 
		
		DJUMP_SFX: new Howl({
			src: ['sfx/DJump.ogg'], loop: false,
		}), 
		
		UNLOCK_SFX: new Howl({
			src: ['sfx/pianoPickup.ogg'], loop: false,
		}), 
		
		BUTTON_SFX: new Howl({
			src: ['sfx/bigButton.wav'], loop: false,
		}), 
		
		PING_SFX: new Howl({
			src: ['sfx/Ping.wav'], loop: false,
		}), 
		
		PONG_SFX: new Howl({
			src: ['sfx/Pong.wav'], loop: false,
		}), 
		
		INCORRECT_SFX: new Howl({
			src: ['sfx/Incorrect.ogg'], loop: false,
		}), 
		
		CORRECT_SFX: new Howl({
			src: ['sfx/Correct.ogg'], loop: false,
		}), 
	}
}

const MAX_VOLS = {
	PICKUP_SFX: 0.5,
	SPRING_SFX: 0.5,
	CAVE_AMBIANCE: 1,
	
	HEADER_MUSIC: 0.5,
	LOOP1_MUSIC: 0.5,
	LOOP2_MUSIC: 0.5,
	LOOP3_MUSIC: 0.5,
};

class AudioController {
	constructor() {
		this.curSong = null;
		this.curSongId = -1;
		this.musicVolume = 0.5;
		this.sfxVolume = 1;

		this.nowPlaying = "";
	}

	/**
	 * Queues the next song but doesn't play it
	 * */
	queueSong(s) {
		this.curSong = s;
	}

	playAmbiance(ambiance) {
		ambiance.volume(this.getMaxVolume(ambiance) * this.sfxVolume);
		ambiance.play();
		this.ambiance = ambiance;
	}

	playSong(song, stopOnEnd) {
		this.nowPlaying = song;
		song.volume(this.getMaxVolume(song) * this.musicVolume);
		this.curSongId = song.play();
		this.curSong = song;

		if (!stopOnEnd) {
			this.curSong.on('end', () => {
				this.playSong(this.curSong);
			}, this.curSongId)
		}
	}

	fadeOutSong(ms) {
		if (this.nowPlaying) {
			this.nowPlaying.fade(this.getMaxVolume(this.nowPlaying) * this.musicVolume, 0,ms,this.curSongId);
			this.nowPlaying.off('end');
			this.nowPlaying = null;
		}
	}

	stopSong() {
		if (this.curSong) this.curSong.stop();
		this.curSong = null;
	}

	playSoundEffect(s, onEnd) {
		onEnd = onEnd ? onEnd : () => {
		};
		s.on('end', () => {
			this.curSoundEffect = null;
			onEnd();
		});
		s.volume(this.getMaxVolume(s) * this.sfxVolume);
		s.rate(Math.random() * 0.2 + 0.9);
		s.play();
		this.curSoundEffect = s;
	}

	getMaxVolume(sound) {
		//TODO: This doesn't work
		return MAX_VOLS[sound] ? MAX_VOLS[sound] : 1;
	}

	setMusicVolume(vol) {
		this.musicVolume = vol * this.getMaxVolume(this.curSong);
		if (this.curSong) this.curSong.volume(vol * this.getMaxVolume(this.curSong));
	}

	setSFXVolume(vol) {
		this.sfxVolume = vol;
		if (this.ambiance) this.ambiance.volume(vol * this.getMaxVolume(this.ambiance));
	}
}

audioCon = new AudioController();

export {
    audioCon,
    SOUNDS
}