class BrownNoiseGenerator {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;

  private async init(): Promise<void> {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (required after user interaction)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  toggle(play: boolean) {
    if (play) {
      this.play();
    } else {
      this.stop();
    }
  }

  async play() {
    if (this.isPlaying) return;
    await this.init();

    if (!this.context) return;

    const bufferSize = 2 * this.context.sampleRate;
    const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0.05;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    noise.start(0);
    this.currentSource = noise;
    this.isPlaying = true;

    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.08, this.context.currentTime + 2);
  }

  stop() {
    if (!this.isPlaying || !this.context || !this.gainNode) return;

    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.5);

    setTimeout(() => {
      if (this.currentSource) {
        this.currentSource.stop();
        this.currentSource.disconnect();
      }
      this.isPlaying = false;
    }, 500);
  }

  async playEffect(url: string) {
    await this.init();
    if (!this.context) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.context.destination);
      source.start(0);
    } catch (error) {
      console.error("Error playing sound effect:", error);
    }
  }
}

export const audioService = new BrownNoiseGenerator();
