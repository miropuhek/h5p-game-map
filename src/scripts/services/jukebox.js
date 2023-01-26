export default class Jukebox {

  /**
   * Fill the jukebox with audios.
   *
   * @param {object} [params={}] Parameters.
   */
  static fill(params = {}) {
    for (const key in params) {
      if (!params[key].src) {
        continue;
      }

      Jukebox.add({
        id: key,
        src: params[key].src,
        options: params[key].options ?? {}
      });
    }
  }

  /**
   * Add audio.
   *
   * @param {object} [params = {}] Parameters.
   * @param {string} params.id Id of audio to add.
   * @param {string} params.src URL to audio file.
   * @param {object} [params.options] Options for the audio.
   * @param {boolean} [params.options.loop] If true, loop the audio.
   */
  static add(params = {}) {
    Jukebox.audios[params.id] = {
      loaded: false
    };

    const dom = document.createElement('audio');
    dom.addEventListener('load', () => {
      Jukebox.audios[params.id].loaded = true;
    });
    dom.src = params.src;

    // Handle loops
    if (params.options.loop) {
      dom.addEventListener('ended', () => {
        Jukebox.play(params.id);
      }, false);
    }

    Jukebox.audios[params.id].dom = dom;

    const track = Jukebox.audioContext.createMediaElementSource(dom);
    const gainNode = Jukebox.audioContext.createGain();
    track
      .connect(gainNode)
      .connect(Jukebox.audioContext.destination);

    Jukebox.audios[params.id].gainNode = gainNode;
  }

  /**
   * Play audio.
   *
   * @param {string} id Id of audio to play.
   * @returns {boolean} True, if audio could be played. Else false.
   */
  static async play(id) {
    if (Jukebox.isMutedState || !Jukebox.audios[id]) {
      return false;
    }

    // Check if context is in suspended state (autoplay policy)
    if (Jukebox.audioContext.state === 'suspended') {
      Jukebox.audioContext.resume();
    }

    let canPlay = false;
    try {
      await Jukebox.audios[id].dom.play();
      canPlay = true;
    }
    catch (error) {
      // Intentionally left blank
    }

    Jukebox.audios[id].isPlaying = canPlay;

    return canPlay;
  }

  /**
   * Stop audio.
   *
   * @param {string} id Id of audio to stop.
   */
  static stop(id) {
    if (!Jukebox.audios[id]) {
      return;
    }

    Jukebox.audios[id].dom.pause();

    Jukebox.audios[id].isPlaying = false;
  }

  /**
   * Stop all audios.
   */
  static stopAll() {
    for (const id in Jukebox.audios) {
      Jukebox.stop(id);
    }
  }

  /**
   * Determine whether audio is playing.
   *
   * @param {string} id Id of audio to be checked.
   * @returns {boolean} True, if audio is playing. Else false.
   */
  static isPlaying(id) {
    if (!Jukebox.audios[id]) {
      return false;
    }

    return Jukebox.audios[id].isPlaying ?? false;
  }

  /**
   * Fade audio.
   *
   * @param {string} id Id of audio to fade.
   * @param {object} [params={}] Parameters.
   * @param {string} params.type `in` to fade in, `out` to fade out.
   * @param {number} [params.time] Time for fading.
   * @param {number} [params.interval] Interval for fading update.
   */
  static fade(id, params = {}) {
    if (!Jukebox.audios[id] || this.isMutedState) {
      return; // Nothing to do here
    }

    if (params.type !== 'in' && params.type !== 'out') {
      return; // Missing required value
    }

    // Clear previous fade timeout
    window.clearTimeout(Jukebox.audios[id].fadeTimeout);

    // Sanitize time
    if (typeof params.time !== 'number') {
      params.time = Jukebox.DEFAULT_FADE_TIME_MS;
    }
    params.time = Math.max(
      Jukebox.DEFAULT_TIMER_INTERVAL_MS, params.time
    );

    // Sanitize interval
    if (typeof params.interval !== 'number') {
      params.interval = Jukebox.DEFAULT_TIMER_INTERVAL_MS;
    }
    params.interval = Math.max(50, params.interval);

    // Set gain delta for each interval
    if (typeof params.gainDelta !== 'number' || params.gainDelta <= 0) {
      if (params.type === 'in') {
        params.gainDelta = (1 - Jukebox.audios[id].gainNode.gain.value) /
        (params.time / params.interval);
      }
      else {
        params.gainDelta = Jukebox.audios[id].gainNode.gain.value /
        (params.time / params.interval);
      }
    }

    // End with clean gain values
    if (params.time <= 0) {
      Jukebox.audios[id].gainNode.gain.value = (params.type === 'in') ?
        1 :
        0;

      return;
    }

    // Update gain
    if (params.type === 'in') {
      Jukebox.audios[id].gainNode.gain.value =
        Math.min(1, Jukebox.audios[id].gainNode.gain.value += params.gainDelta);
    }
    else {
      Jukebox.audios[id].gainNode.gain.value =
      Math.max(0, Jukebox.audios[id].gainNode.gain.value -= params.gainDelta);
    }

    Jukebox.audios[id].fadeTimeout = window.setTimeout(() => {
      Jukebox.fade(
        id,
        {
          time: params.time - params.interval,
          gainDelta: params.gainDelta,
          type: params.type
        }
      );
    }, params.interval);
  }

  /**
   * Get DOM element of audio.
   *
   * @param {string} id Id of audio to get DOM element for.
   * @returns {HTMLElement|undefined} Audio element.
   */
  static getDOM(id) {
    if (!Jukebox.audios[id]) {
      return;
    }

    return Jukebox.audios[id].dom;
  }

  /**
   * Get audio ids.
   *
   * @returns {string[]} Audio ids.
   */
  static getAudioIds() {
    return Object.keys(Jukebox.audios);
  }

  /**
   * Mute.
   */
  static mute() {
    Jukebox.stopAll();
    Jukebox.isMutedState = true;
  }

  /**
   * Unmute.
   */
  static unmute() {
    Jukebox.isMutedState = false;
  }

  /**
   * Determine whether Jukebox is muted.
   *
   * @returns {boolean} True, if Jukebox is muted. Else false.
   */
  static isMuted() {
    return Jukebox.isMutedState;
  }
}

/** @param {object} audios Key based audio storage. */
Jukebox.audios = {};

/** @param {AudioContext} audioContext WebAudio API content. */
Jukebox.audioContext = new AudioContext();

/** @param {boolean} isMutedState Muted state. */
Jukebox.isMutedState = false;

/** @constant {number} DEFAULT_TIMER_INTERVAL_MS Default timer interval. */
Jukebox.DEFAULT_TIMER_INTERVAL_MS = 100;

/** @constant {number} DEFAULT_FADE_TIME_MS Default fade time. */
Jukebox.DEFAULT_FADE_TIME_MS = 1000;