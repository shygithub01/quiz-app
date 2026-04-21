// Background Music Player for Live Events
// Generates upbeat background music using Web Audio API

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let oscillators: OscillatorNode[] = [];
let scheduledTimeouts: number[] = [];

/**
 * Start playing background music
 */
export function startBackgroundMusic(): void {
  if (isPlaying) return;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.value = 0.15; // Low volume so it doesn't interfere
    
    isPlaying = true;
    playMusicLoop();
    
    console.log('🎵 Background music started');
  } catch (error) {
    console.error('Failed to start background music:', error);
  }
}

/**
 * Stop playing background music
 */
export function stopBackgroundMusic(): void {
  if (!audioContext && !isPlaying) return; // Nothing to stop
  
  try {
    console.log('🎵 Stopping background music - clearing', oscillators.length, 'oscillators and', scheduledTimeouts.length, 'timeouts');
    
    // Clear all scheduled timeouts first
    scheduledTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    scheduledTimeouts = [];
    
    // Stop all oscillators
    oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    oscillators = [];
    
    // Disconnect and close audio context
    if (masterGain) {
      try {
        masterGain.disconnect();
      } catch (e) {
        // Ignore
      }
      masterGain = null;
    }
    
    if (audioContext) {
      try {
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (e) {
        // Ignore
      }
      audioContext = null;
    }
    
    isPlaying = false;
    
    console.log('🎵 Background music stopped');
  } catch (error) {
    console.error('Failed to stop background music:', error);
    // Force reset even if error
    audioContext = null;
    masterGain = null;
    oscillators = [];
    scheduledTimeouts = [];
    isPlaying = false;
  }
}

/**
 * Play a continuous upbeat music loop
 */
function playMusicLoop(): void {
  if (!audioContext || !masterGain || !isPlaying) return;
  
  // Simple upbeat chord progression: C - G - Am - F
  const chords = [
    [261.63, 329.63, 392.00], // C major (C-E-G)
    [392.00, 493.88, 587.33], // G major (G-B-D)
    [220.00, 261.63, 329.63], // A minor (A-C-E)
    [349.23, 440.00, 523.25]  // F major (F-A-C)
  ];
  
  let chordIndex = 0;
  const beatDuration = 0.5; // 120 BPM
  
  function playChord() {
    if (!audioContext || !masterGain || !isPlaying) return;
    
    const now = audioContext.currentTime;
    const chord = chords[chordIndex % chords.length];
    
    // Play each note in the chord
    chord.forEach((freq) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      
      osc.connect(gain);
      gain.connect(masterGain!);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      // Envelope: fade in and out
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + beatDuration);
      
      osc.start(now);
      osc.stop(now + beatDuration);
      
      oscillators.push(osc);
      
      // Clean up after note finishes
      setTimeout(() => {
        const index = oscillators.indexOf(osc);
        if (index > -1) {
          oscillators.splice(index, 1);
        }
      }, beatDuration * 1000 + 100);
    });
    
    chordIndex++;
    
    // Schedule next chord
    if (isPlaying) {
      const timeoutId = setTimeout(playChord, beatDuration * 1000) as unknown as number;
      scheduledTimeouts.push(timeoutId);
    }
  }
  
  playChord();
}

export function muteBackgroundMusic(): void {
  if (!masterGain || !audioContext || !isPlaying) return;
  masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.3);
}

export function unmuteBackgroundMusic(): void {
  if (!masterGain || !audioContext || !isPlaying) return;
  masterGain.gain.setTargetAtTime(0.15, audioContext.currentTime, 0.3);
}

export function isMusicPlaying(): boolean {
  return isPlaying;
}

/**
 * Play victory sound effect when competition ends
 * Triumphant ascending melody with celebration feel
 */
export function playVictorySound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Victory melody: C - E - G - C (octave higher)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.2 },      // C5
      { freq: 659.25, start: 0.2, duration: 0.2 },    // E5
      { freq: 783.99, start: 0.4, duration: 0.2 },    // G5
      { freq: 1046.50, start: 0.6, duration: 0.5 }    // C6 (hold longer)
    ];
    
    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = note.freq;
      osc.type = 'triangle'; // Warmer sound
      
      const startTime = audioContext.currentTime + note.start;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
      
      osc.start(startTime);
      osc.stop(startTime + note.duration);
    });
    
    console.log('🎺 Victory sound played!');
  } catch (error) {
    console.error('Failed to play victory sound:', error);
  }
}
